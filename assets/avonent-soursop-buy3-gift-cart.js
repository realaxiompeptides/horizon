/**
 * Keep the Soursop Buy 3 digital gift in sync across product, cart, and checkout paths.
 * Only the Soursop variant (58145310376102) qualifies. The separate Shopify
 * automatic BXGY discount handles the 100% price reduction at 3+ bottles.
 */
(() => {
  'use strict';
  if (window.__avonentSoursopBuy3GiftReady) return;
  window.__avonentSoursopBuy3GiftReady = true;

  const SOURSOP_ID = 58145310376102;
  const EBOOK_ID = 58170079510694;
  const MARKER = '_avonent_soursop_gift';
  const script = document.currentScript;
  let cartHasSoursop = script?.dataset.soursopInCart === 'true';
  const soursopProductPage = window.location.pathname.includes('/products/soursop-softgels');
  const root = () => window.Shopify?.routes?.root || '/';
  let inFlight = null;
  let timer = null;
  let checkoutPending = false;

  async function getCart() {
    const response = await fetch(root() + 'cart.js', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Unable to load the shopping cart.');
    return response.json();
  }

  async function postCart(endpoint, payload) {
    const response = await fetch(root() + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status || data.errors) {
      throw new Error(data.description || data.message || 'Unable to update the free e-book.');
    }
    return data;
  }

  const paidQty = (cart) => (cart.items || []).reduce((total, item) =>
    total + (Number(item.variant_id) === SOURSOP_ID ? Number(item.quantity || 0) : 0), 0);

  const isEbook = (item) => Number(item.variant_id) === EBOOK_ID;
  const isGift = (item) => isEbook(item) && (
    item.properties?.[MARKER] === 'buy3' ||
    item.properties?.['_Avonent gift'] === 'Buy 3 first-order e-book'
  );

  async function reconcile() {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      let cart = await getCart();
      const qualifies = paidQty(cart) >= 3;
      cartHasSoursop = paidQty(cart) > 0;
      const allEbooks = (cart.items || []).filter(isEbook);
      const gifts = allEbooks.filter(isGift);
      let changed = false;

      if (qualifies && allEbooks.length === 0) {
        // Shopify automatic BXGY discounts do not add the gift line themselves.
        await postCart('cart/add.js', {
          items: [{
            id: EBOOK_ID,
            quantity: 1,
            properties: { [MARKER]: 'buy3', '_Avonent gift': 'Buy 3 first-order e-book' }
          }]
        });
        changed = true;
      } else if (!qualifies && gifts.length) {
        // Never leave a formerly free, now $24.99 gift in a smaller cart.
        for (const item of gifts) {
          await postCart('cart/change.js', { id: item.key, quantity: 0 });
        }
        changed = true;
      } else if (qualifies && gifts.length > 0) {
        // Do not allow the automatically supplied e-book to multiply.
        for (let i = 0; i < gifts.length; i += 1) {
          const quantity = i === 0 ? 1 : 0;
          if (Number(gifts[i].quantity || 0) !== quantity) {
            await postCart('cart/change.js', { id: gifts[i].key, quantity });
            changed = true;
          }
        }
      }

      if (changed) cart = await getCart();
      return { cart, changed };
    })().finally(() => { inFlight = null; });
    return inFlight;
  }

  const cartPage = () => window.location.pathname.replace(/\/$/, '') ===
    (root() + 'cart').replace(/\/$/, '');

  function drawerOpen() {
    return !!document.querySelector(
      '#cart-drawer dialog[open], theme-drawer#cart-drawer[open], #cart-drawer[open]'
    );
  }

  async function syncAndRefresh() {
    try {
      const result = await reconcile();
      if (result.changed && (cartPage() || drawerOpen())) {
        // Reload only when the visible cart needs to show the new gift/price.
        window.location.reload();
      }
    } catch (error) {
      console.error('[Avonent Soursop Buy 3 gift]', error);
    }
  }

  function schedule(delay = 600) {
    window.clearTimeout(timer);
    timer = window.setTimeout(syncAndRefresh, delay);
  }

  async function goToVerifiedCheckout() {
    if (checkoutPending) return;
    checkoutPending = true;
    try {
      await reconcile();
      const cart = await getCart();
      const qty = paidQty(cart);
      const ebook = (cart.items || []).find(isEbook);
      if (qty >= 3 && !ebook) {
        throw new Error('Your free e-book could not be added. Please try again.');
      }
      if (qty >= 3 && ebook && Number(ebook.final_line_price || 0) > 0) {
        throw new Error('The e-book discount has not applied yet. Please try again before checking out.');
      }
      if (qty < 3 && (cart.items || []).some(isGift)) {
        throw new Error('The free e-book needs to be removed from this smaller order. Please try again.');
      }
      window.location.assign(root() + 'checkout');
    } catch (error) {
      checkoutPending = false;
      console.error('[Avonent Soursop checkout verification]', error);
      window.alert(error.message || 'Could not verify the free e-book. Please try again.');
    }
  }

  function checkoutButton(target) {
    return target instanceof Element && target.closest(
      'button[name="checkout"], input[name="checkout"], #checkout, a[href*="/checkout"], button[formaction*="/checkout"]'
    );
  }

  document.addEventListener('click', (event) => {
    const button = checkoutButton(event.target);
    if (button && (cartHasSoursop || soursopProductPage) &&
        !button.disabled && !event.defaultPrevented) {
      // Check the latest cart before handing over to Shopify checkout.
      event.preventDefault();
      event.stopImmediatePropagation();
      void goToVerifiedCheckout();
      return;
    }
    if (event.target instanceof Element && event.target.closest(
      '.cart-items__remove, [data-cart-remove], cart-items-component quantity-selector, [data-testid="cart-drawer-trigger"], [data-av-cb-bundle], .av-cb form button[type="submit"]'
    )) {
      schedule(1100);
      window.setTimeout(() => schedule(450), 2200);
    }
  }, true);

  document.addEventListener('submit', (event) => {
    const submitter = event.submitter;
    if (submitter && (cartHasSoursop || soursopProductPage) &&
        checkoutButton(submitter)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void goToVerifiedCheckout();
    }
  }, true);

  document.addEventListener('quantity-selector:update', () => {
    schedule(850);
    window.setTimeout(() => schedule(400), 1900);
  });
  document.addEventListener('shopify:section:load', () => schedule(500));
  document.addEventListener('cart:updated', () => schedule(500));

  function init() {
    schedule(150);
    document.querySelectorAll('cart-items-component').forEach((element) => {
      new MutationObserver(() => schedule(700))
        .observe(element, { childList: true, subtree: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
