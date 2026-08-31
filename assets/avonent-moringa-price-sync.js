(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  ready(() => {
    const main = document.querySelector('main[data-template*="product.moringa"]');
    if (!main) return;

    main.querySelectorAll('.section-avonent-benefit-marquee').forEach((section) => {
      section.style.display = 'none';
    });

    if (!document.getElementById('avonent-purchase-mode-hotfix')) {
      const style = document.createElement('style');
      style.id = 'avonent-purchase-mode-hotfix';
      style.textContent = `
        main[data-template*="product.moringa"] .moringa-purchase-meta__one-time,
        main[data-template*="product.moringa"] .moringa-purchase-meta__one-time.is-selected {
          color: #008eae !important;
          border-bottom: 1px solid currentColor !important;
          cursor: pointer !important;
          pointer-events: auto !important;
          opacity: 1 !important;
        }
        main[data-template*="product.moringa"] [data-moringa-subscribe] {
          cursor: pointer !important;
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(style);
    }

    const formatMoney = (cents) => {
      const amount = Number(cents || 0) / 100;
      const currency = window.Shopify?.currency?.active || 'USD';
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
      } catch (error) {
        return `$${amount.toFixed(2)}`;
      }
    };

    let currentMode = 'subscription';
    let internalModeChange = false;

    const getOffer = () => main.querySelector('[data-avonent-price-offer]');
    const getBundleRoot = () => main.querySelector('.avonent-bundle');
    const getSelectedBundle = () => {
      const root = getBundleRoot();
      if (!root) return null;
      return (
        root.querySelector('[data-av-bundle-option].is-selected:not(:disabled)') ||
        root.querySelector('[data-av-bundle-option][aria-checked="true"]:not(:disabled)') ||
        root.querySelector('[data-av-bundle-option]:not(:disabled)')
      );
    };

    const getMainForm = () =>
      main.querySelector('.buy-buttons-block form[data-type="add-to-cart-form"]') ||
      main.querySelector('product-form-component form[data-type="add-to-cart-form"]') ||
      main.querySelector('form[action*="/cart/add"]');

    const enforceSellingPlan = () => {
      const offer = getOffer();
      const form = getMainForm();
      if (!offer || !form) return;

      const planId = String(offer.dataset.planId || '');
      let authoritative = form.querySelector('[data-avonent-moringa-selling-plan-global]');

      form.querySelectorAll('[name="selling_plan"]').forEach((control) => {
        if (control === authoritative) return;
        control.disabled = true;
        if (control.matches('[type="radio"], [type="checkbox"]')) control.checked = false;
      });

      if (currentMode === 'subscription' && planId) {
        if (!authoritative) {
          authoritative = document.createElement('input');
          authoritative.type = 'hidden';
          authoritative.name = 'selling_plan';
          authoritative.setAttribute('data-avonent-moringa-selling-plan-global', '');
          form.appendChild(authoritative);
        }
        authoritative.disabled = false;
        authoritative.name = 'selling_plan';
        authoritative.value = planId;
        authoritative.setAttribute('value', planId);
      } else if (authoritative) {
        authoritative.disabled = true;
        authoritative.value = '';
        authoritative.removeAttribute('value');
      }
    };

    const syncHeadlinePrice = () => {
      const option = getSelectedBundle();
      const offer = getOffer();
      if (!option || !offer) return;

      const quantity = Math.max(1, Number(option.dataset.quantity || 1));
      const subscriptionUnit = Number(option.dataset.subscriptionUnit || 0);
      const subscriptionCompareUnit = Number(option.dataset.subscriptionCompareUnit || option.dataset.oneTimeUnit || 0);
      const oneTimeUnit = Number(option.dataset.oneTimeUnit || 0);
      const oneTimeCompareUnit = Number(option.dataset.oneTimeCompareUnit || option.dataset.oneTimeUnit || 0);

      const subscriptionTotal = subscriptionUnit * quantity;
      const subscriptionCompareTotal = subscriptionCompareUnit * quantity;
      const oneTimeTotal = oneTimeUnit * quantity;
      const oneTimeCompareTotal = oneTimeCompareUnit * quantity;

      const price = offer.querySelector('.avonent-price-offer__price');
      const compare = offer.querySelector('.avonent-price-offer__compare');
      const save = offer.querySelector('.avonent-price-offer__save');
      const label = offer.querySelector('.avonent-price-offer__label');
      const helper = offer.querySelector('.avonent-price-offer__helper');
      const subscribeRow = offer.querySelector('[data-moringa-subscribe]');

      if (label && !label.dataset.subscriptionLabel) label.dataset.subscriptionLabel = label.textContent.trim();
      if (helper && !helper.dataset.subscriptionHelper) helper.dataset.subscriptionHelper = helper.textContent.trim();

      const activeTotal = currentMode === 'subscription' ? subscriptionTotal : oneTimeTotal;
      const activeCompareTotal = currentMode === 'subscription' ? subscriptionCompareTotal : oneTimeCompareTotal;

      if (price && activeTotal > 0) price.textContent = formatMoney(activeTotal);

      if (label) {
        label.textContent = currentMode === 'subscription'
          ? (label.dataset.subscriptionLabel || 'Subscribe & Save')
          : 'One-Time Purchase';
      }

      if (helper) {
        helper.textContent = currentMode === 'subscription'
          ? (helper.dataset.subscriptionHelper || 'Recurring delivery · Cancel anytime')
          : 'Pay once · No recurring delivery';
      }

      if (compare) {
        const showCompare = currentMode === 'subscription' && activeCompareTotal > activeTotal && activeTotal > 0;
        compare.textContent = showCompare ? formatMoney(activeCompareTotal) : '';
        compare.hidden = !showCompare;
      }

      if (save) {
        const percent = currentMode === 'subscription' && activeCompareTotal > activeTotal
          ? Math.round(((activeCompareTotal - activeTotal) / activeCompareTotal) * 100)
          : 0;
        save.textContent = percent > 0 ? `Save ${percent}%` : '';
        save.hidden = percent <= 0;
      }

      if (subscribeRow) {
        const selected = currentMode === 'subscription';
        subscribeRow.classList.toggle('is-selected', selected);
        subscribeRow.setAttribute('aria-pressed', selected ? 'true' : 'false');
      }

      const meta = main.querySelector('[data-moringa-purchase-meta]');
      const recurring = meta?.querySelector('[data-moringa-recurring]');
      const switchButton = meta?.querySelector('[data-moringa-one-time]');

      if (recurring) recurring.hidden = currentMode !== 'subscription';

      if (switchButton) {
        switchButton.classList.toggle('is-selected', currentMode === 'one_time');
        switchButton.setAttribute('aria-pressed', currentMode === 'one_time' ? 'true' : 'false');
        switchButton.dataset.purchaseSwitch = currentMode === 'one_time' ? 'subscription' : 'one_time';

        if (currentMode === 'subscription') {
          switchButton.innerHTML = `One-Time Purchase <strong>${formatMoney(oneTimeTotal)}</strong> + $4.95 Shipping <span>(No Free Gifts Included).</span>`;
        } else {
          const percent = subscriptionCompareTotal > subscriptionTotal
            ? Math.round(((subscriptionCompareTotal - subscriptionTotal) / subscriptionCompareTotal) * 100)
            : 0;
          switchButton.innerHTML = `Switch to Subscribe & Save <strong>${formatMoney(subscriptionTotal)}</strong>${percent > 0 ? ` · Save ${percent}%` : ''}`;
        }
      }

      offer.dataset.purchaseMode = currentMode;
      offer.dataset.selectedQuantity = String(quantity);
      offer.dataset.subscriptionTotal = String(subscriptionTotal);
      offer.dataset.subscriptionCompareTotal = String(subscriptionCompareTotal);
      offer.dataset.oneTimeTotal = String(oneTimeTotal);

      enforceSellingPlan();
    };

    const setMode = (nextMode, announce = true) => {
      currentMode = nextMode === 'one_time' || nextMode === 'one-time' ? 'one_time' : 'subscription';
      syncHeadlinePrice();

      if (announce && !internalModeChange) {
        const offer = getOffer();
        internalModeChange = true;
        document.dispatchEvent(new CustomEvent('avonent:purchase-mode-change', {
          detail: {
            mode: currentMode,
            sellingPlanId: currentMode === 'subscription' ? String(offer?.dataset.planId || '') : null
          }
        }));
        internalModeChange = false;
      }
    };

    document.addEventListener('click', (event) => {
      const switchButton = event.target.closest('[data-moringa-one-time]');
      if (switchButton && main.contains(switchButton)) {
        const nextMode = switchButton.dataset.purchaseSwitch ||
          (switchButton.getAttribute('aria-pressed') === 'true' ? 'subscription' : 'one_time');

        if (nextMode === 'subscription') {
          event.preventDefault();
          event.stopImmediatePropagation();

          const subscribeRow = getOffer()?.querySelector('[data-moringa-subscribe]');
          if (subscribeRow) {
            subscribeRow.click();
          } else {
            setMode('subscription');
          }
          return;
        }

        setMode('one_time');
        return;
      }

      const subscribe = event.target.closest('[data-moringa-subscribe]');
      if (subscribe && main.contains(subscribe)) {
        setMode('subscription');
        return;
      }

      if (event.target.closest('[data-av-bundle-option]')) {
        window.setTimeout(syncHeadlinePrice, 0);
      }

      const addButton = event.target.closest('button[type="submit"][name="add"], button[type="submit"][data-add-to-cart], [data-testid="add-to-cart"]');
      if (addButton && main.contains(addButton)) enforceSellingPlan();
    }, true);

    document.addEventListener('avonent:purchase-mode-change', (event) => {
      if (internalModeChange) return;
      const mode = event.detail?.mode;
      if (mode === 'subscription' || mode === 'one_time' || mode === 'one-time') {
        currentMode = mode === 'subscription' ? 'subscription' : 'one_time';
      }
      window.setTimeout(syncHeadlinePrice, 0);
    });

    document.addEventListener('avonent:bundle-change', () => {
      window.setTimeout(syncHeadlinePrice, 0);
    });

    document.addEventListener('shopify:section:load', () => {
      window.setTimeout(() => {
        const offer = getOffer();
        const subscribe = offer?.querySelector('[data-moringa-subscribe]');
        if (subscribe) {
          currentMode = subscribe.getAttribute('aria-pressed') === 'false' ? 'one_time' : 'subscription';
        }
        syncHeadlinePrice();
      }, 0);
    });

    document.addEventListener('formdata', (event) => {
      const form = getMainForm();
      if (!form || event.target !== form) return;
      const planId = String(getOffer()?.dataset.planId || '');
      event.formData.delete('selling_plan');
      if (currentMode === 'subscription' && planId) event.formData.set('selling_plan', planId);
    });

    [0, 80, 250, 700, 1400, 2600].forEach((delay) => {
      window.setTimeout(() => {
        const offer = getOffer();
        if (delay === 0 && offer) {
          const subscribe = offer.querySelector('[data-moringa-subscribe]');
          currentMode = subscribe?.getAttribute('aria-pressed') === 'false' ? 'one_time' : 'subscription';
        }
        syncHeadlinePrice();
      }, delay);
    });
  });
})();
