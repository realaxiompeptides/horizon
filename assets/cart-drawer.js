import { Component } from '@theme/component';
import { CartLinesUpdateEvent, StandardEvents } from '@shopify/events';
import { DrawerOpenEvent } from '@theme/theme-drawer';

/**
 * A custom element that manages cart drawer behavior within a `<theme-drawer>`.
 *
 * Dialog lifecycle (open/close, squeeze, history, animations) is owned by `<theme-drawer>`.
 * The `cart:view` event is auto-dispatched by `CartItemsComponent` via the
 * `view-event-trigger="dialog"` attribute (see `snippets/cart-items-component.liquid`).
 * Cart count announcements are owned by `<header-actions>`.
 * This component handles the remaining cart-specific concerns: auto-open on add-to-cart,
 * sticky summary layout, and the installments CTA close-on-click.
 *
 * @extends {Component}
 */
class CartDrawerComponent extends Component {
  /** @type {number} */
  #summaryThreshold = 0.5;

  /** @type {number | null} */
  #reservationTimer = null;

  /** @type {boolean} */
  #protectionMutationPending = false;

  /** @type {number} */
  #protectionVariantId = 0;

  static #reservationDuration = 5 * 60 * 1000;
  static #reservationStorageKey = 'avonentCartReservationEndsAt';
  static #protectionPreferenceKey = 'avonentShippingProtectionEnabled';

  /** @type {import('@theme/theme-drawer').ThemeDrawer | null} */
  get #themeDrawer() {
    return /** @type {import('@theme/theme-drawer').ThemeDrawer | null} */ (this.closest('theme-drawer'));
  }

  /** @type {HTMLDialogElement | null} */
  get #dialog() {
    return this.closest('dialog');
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(StandardEvents.cartLinesUpdate, this.#handleCartLinesUpdate);
    this.#themeDrawer?.addEventListener(DrawerOpenEvent.eventName, this.#handleDrawerOpen);
    this.addEventListener('click', this.#handleEnhancementClick);

    this.#protectionVariantId = Number(this.dataset.protectionVariantId || 0);
    this.#startReservationTimer();

    // The restore path sets [open] before this module loads, so the
    // theme-drawer:open event will have already fired. Use the attribute
    // check so this works even before <theme-drawer> upgrades.
    if (this.#themeDrawer?.hasAttribute('open')) {
      this.#handleDrawerOpen();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(StandardEvents.cartLinesUpdate, this.#handleCartLinesUpdate);
    this.#themeDrawer?.removeEventListener(DrawerOpenEvent.eventName, this.#handleDrawerOpen);
    this.removeEventListener('click', this.#handleEnhancementClick);

    if (this.#reservationTimer !== null) {
      window.clearInterval(this.#reservationTimer);
      this.#reservationTimer = null;
    }
  }

  /**
   * Handles the theme-drawer opening — updates sticky state and wires up the installments CTA.
   */
  #handleDrawerOpen = () => {
    this.#updateStickyState();
    this.#startReservationTimer();
    this.#syncShippingProtection();

    // Close cart drawer when installments CTA is clicked to avoid overlapping dialogs.
    // Re-queried on every open so it survives cart content re-renders that
    // replace the shopify-payment-terms shadow root.
    customElements.whenDefined('shopify-payment-terms').then(() => {
      const cta = this.querySelector('shopify-payment-terms')?.shadowRoot?.querySelector('#shopify-installments-cta');
      cta?.addEventListener('click', () => this.#themeDrawer?.close(), { once: true });
    });
  };

  /**
   * @param {import('@shopify/events').CartLinesUpdateEvent} event
   */
  #handleCartLinesUpdate = (event) => {
    const shouldAutoOpen = this.hasAttribute('auto-open') && event.action === 'add' && !this.#themeDrawer?.isOpen;

    // When the event originates inside an open MODAL <dialog> (e.g. quick-add),
    // defer the auto-open until that dialog's native `close` fires so its focus
    // restoration runs first — otherwise we'd capture the wrong
    // `#previouslyFocused`. Non-modal dialogs (e.g. the hotspot preview) don't
    // close on add and don't move focus, so `:modal` excludes them.
    const sourceModal = /** @type {HTMLDialogElement | null} */ (
      event.target instanceof Element ? event.target.closest('dialog:modal') : null
    );

    if (shouldAutoOpen && !sourceModal && !this.#isCartEmpty()) {
      this.#themeDrawer?.open();
    }

    event.promise
      ?.then(({ detail }) => {
        const settle = () => requestAnimationFrame(() => this.#updateStickyState());
        const isProtectionUpdate = detail?.source === 'avonent-shipping-protection';

        if (!shouldAutoOpen || detail?.didError || isProtectionUpdate) {
          settle();
          if (!isProtectionUpdate && !detail?.didError) this.#syncShippingProtection();
          return;
        }

        const openAndSettle = () => {
          if (!this.#themeDrawer?.isOpen) this.#themeDrawer?.open();
          settle();
          this.#syncShippingProtection();
        };

        if (sourceModal?.open) {
          sourceModal.addEventListener('close', openAndSettle, { once: true });
        } else {
          openAndSettle();
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[cart-drawer] Event promise rejected:', error);
      });
  };


  #handleEnhancementClick = (event) => {
    if (!(event.target instanceof Element)) return;

    const toggle = event.target.closest('[data-avonent-protection-toggle]');
    if (!(toggle instanceof HTMLButtonElement) || !this.contains(toggle)) return;

    const enabled = toggle.getAttribute('aria-checked') !== 'true';
    sessionStorage.setItem(CartDrawerComponent.#protectionPreferenceKey, enabled ? 'true' : 'false');
    this.#setShippingProtection(enabled);
  };

  #startReservationTimer() {
    if (this.#reservationTimer !== null) window.clearInterval(this.#reservationTimer);

    let endsAt = Number(sessionStorage.getItem(CartDrawerComponent.#reservationStorageKey));
    if (!Number.isFinite(endsAt) || endsAt <= Date.now()) {
      endsAt = Date.now() + CartDrawerComponent.#reservationDuration;
      sessionStorage.setItem(CartDrawerComponent.#reservationStorageKey, String(endsAt));
    }

    const render = () => {
      let remaining = endsAt - Date.now();

      if (remaining <= 0) {
        endsAt = Date.now() + CartDrawerComponent.#reservationDuration;
        sessionStorage.setItem(CartDrawerComponent.#reservationStorageKey, String(endsAt));
        remaining = CartDrawerComponent.#reservationDuration;
      }

      const totalSeconds = Math.max(0, Math.ceil(remaining / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      for (const output of this.querySelectorAll('[data-avonent-cart-countdown]')) {
        output.textContent = value;
      }
    };

    render();
    this.#reservationTimer = window.setInterval(render, 1000);
  }

  async #syncShippingProtection() {
    if (!this.#protectionVariantId || this.#protectionMutationPending) return;

    try {
      const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!response.ok) return;

      const cart = await response.json();
      const protectionItems = cart.items.filter(
        (item) =>
          Number(item.variant_id) === this.#protectionVariantId ||
          item.handle === this.dataset.protectionHandle
      );
      const regularItems = cart.items.filter(
        (item) =>
          Number(item.variant_id) !== this.#protectionVariantId &&
          item.handle !== this.dataset.protectionHandle
      );
      const preference = sessionStorage.getItem(CartDrawerComponent.#protectionPreferenceKey);
      const shouldEnable = preference !== 'false';

      if (regularItems.length === 0 && protectionItems.length > 0) {
        await this.#setShippingProtection(false, true, protectionItems[0].key);
        return;
      }

      if (regularItems.length > 0 && shouldEnable && protectionItems.length === 0) {
        await this.#setShippingProtection(true, true);
        return;
      }

      if (protectionItems.length > 0 && protectionItems.some((item) => item.quantity !== 1)) {
        await this.#setShippingProtection(true, true, protectionItems[0].key);
      }
    } catch (error) {
      console.warn('[cart-drawer] Could not sync shipping protection:', error);
    }
  }

  async #setShippingProtection(enabled, automatic = false, knownLineKey = '') {
    if (!this.#protectionVariantId || this.#protectionMutationPending) return;

    const panel = this.querySelector('[data-avonent-protection]');
    const toggle = panel?.querySelector('[data-avonent-protection-toggle]');
    const lineKey = knownLineKey || panel?.dataset.lineKey || '';

    this.#protectionMutationPending = true;
    if (toggle instanceof HTMLButtonElement) {
      toggle.disabled = true;
      toggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
    }

    const root = window.Shopify?.routes?.root || '/';
    const isExistingLine = Boolean(lineKey);
    const endpoint = enabled && !isExistingLine ? `${root}cart/add.js` : `${root}cart/change.js`;
    const body = enabled && !isExistingLine
      ? {
          items: [{ id: this.#protectionVariantId, quantity: 1 }],
          sections: 'cart-drawer-section',
          sections_url: window.location.pathname,
        }
      : {
          id: lineKey,
          quantity: enabled ? 1 : 0,
          sections: 'cart-drawer-section',
          sections_url: window.location.pathname,
        };

    if (!enabled && !lineKey) {
      this.#protectionMutationPending = false;
      if (toggle instanceof HTMLButtonElement) toggle.disabled = false;
      return;
    }

    const deferred = CartLinesUpdateEvent.createPromise();
    this.dispatchEvent(
      new CartLinesUpdateEvent({
        action: enabled ? 'add' : 'remove',
        context: 'cart',
        lines: [
          {
            id: enabled ? String(this.#protectionVariantId) : lineKey,
            quantity: enabled ? 1 : 0,
          },
        ],
        promise: deferred.promise,
      })
    );

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (!response.ok || result.status || result.errors) {
        throw new Error(result.description || result.message || result.errors || 'Cart update failed');
      }

      const cartResponse = await fetch(`${root}cart.js`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const cart = await cartResponse.json();

      deferred.resolve({
        cart: CartLinesUpdateEvent.createCartFromAjaxResponse(cart),
        detail: {
          sections: result.sections || {},
          items: cart.items,
          itemCount: cart.item_count,
          source: 'avonent-shipping-protection',
          didError: false,
        },
      });
    } catch (error) {
      deferred.reject(error);
      if (toggle instanceof HTMLButtonElement) {
        toggle.setAttribute('aria-checked', enabled ? 'false' : 'true');
      }
      console.warn('[cart-drawer] Shipping protection update failed:', error);
    } finally {
      this.#protectionMutationPending = false;
      if (toggle instanceof HTMLButtonElement) toggle.disabled = false;
      requestAnimationFrame(() => this.#updateStickyState());
    }
  }


  #isCartEmpty() {
    return Boolean(this.querySelector('.cart-drawer--empty'));
  }

  #updateStickyState() {
    const dialog = this.#dialog;
    if (!dialog) return;

    // Refs do not cross nested `*-component` boundaries (e.g., `cart-items-component`), so we query within the dialog.
    const content = dialog.querySelector('.cart-drawer__content');
    const summary = dialog.querySelector('.cart-drawer__summary');

    if (!content || !summary) {
      // Ensure the dialog doesn't get stuck in "unsticky" mode when summary disappears (e.g., empty cart).
      dialog.setAttribute('cart-summary-sticky', 'false');
      return;
    }

    const drawerHeight = dialog.getBoundingClientRect().height;
    const summaryHeight = summary.getBoundingClientRect().height;
    const ratio = summaryHeight / drawerHeight;
    dialog.setAttribute('cart-summary-sticky', ratio > this.#summaryThreshold ? 'false' : 'true');
  }
}

if (!customElements.get('cart-drawer-component')) {
  customElements.define('cart-drawer-component', CartDrawerComponent);
}
