(() => {
  const onReady = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  onReady(() => {
    const main =
      document.querySelector('main[data-template*="product.moringa"]') ||
      (window.location.pathname.includes('pure-moringa') ? document.querySelector('main') : null);

    if (!main) return;

    main.querySelectorAll('.section-avonent-benefit-marquee').forEach((section) => {
      section.style.display = 'none';
    });

    if (!document.getElementById('avonent-moringa-purchase-controller-styles')) {
      const style = document.createElement('style');
      style.id = 'avonent-moringa-purchase-controller-styles';
      style.textContent = `
        main[data-template*="product.moringa"] .moringa-purchase-meta__one-time,
        main[data-template*="product.moringa"] .moringa-purchase-meta__one-time.is-selected {
          color: #00a9cc !important;
          border-bottom: 1px solid currentColor !important;
          cursor: pointer !important;
          pointer-events: auto !important;
          opacity: 1 !important;
          font-weight: 750 !important;
        }
        main[data-template*="product.moringa"] .moringa-purchase-meta__status {
          margin: 0;
          color: #222;
          font-size: 11px;
          line-height: 1.25;
          text-align: center;
        }
        main[data-template*="product.moringa"] [data-moringa-subscribe] {
          pointer-events: auto !important;
        }
        @media screen and (max-width: 749px) {
          main[data-template*="product.moringa"] .moringa-purchase-meta__status {
            font-size: 10px;
          }
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

    let mode = 'subscription';
    let dispatchingMode = false;

    const getOffer = () => main.querySelector('[data-avonent-price-offer]');
    const getBundleRoot = () => main.querySelector('.avonent-bundle');
    const getBundleOptions = () => Array.from(main.querySelectorAll('[data-av-bundle-option]'));
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
      main.querySelector('.buy-buttons-block product-form-component form[data-type="add-to-cart-form"]') ||
      main.querySelector('.buy-buttons-block form[data-type="add-to-cart-form"]') ||
      main.querySelector('product-form-component form[data-type="add-to-cart-form"]') ||
      main.querySelector('form[action*="/cart/add"]');

    const bundleNumbers = (option) => {
      if (!option) {
        return {
          quantity: 1,
          subscriptionTotal: 0,
          subscriptionCompareTotal: 0,
          oneTimeTotal: 0,
          oneTimeCompareTotal: 0
        };
      }

      const quantity = Math.max(1, Number(option.dataset.quantity || 1));
      const subscriptionUnit = Number(option.dataset.subscriptionUnit || 0);
      const subscriptionCompareUnit = Number(
        option.dataset.subscriptionCompareUnit || option.dataset.oneTimeUnit || 0
      );
      const oneTimeUnit = Number(option.dataset.oneTimeUnit || 0);
      const oneTimeCompareUnit = Number(
        option.dataset.oneTimeCompareUnit || option.dataset.oneTimeUnit || 0
      );

      return {
        quantity,
        subscriptionTotal: subscriptionUnit * quantity,
        subscriptionCompareTotal: subscriptionCompareUnit * quantity,
        oneTimeTotal: oneTimeUnit * quantity,
        oneTimeCompareTotal: oneTimeCompareUnit * quantity
      };
    };

    const enforceSellingPlan = () => {
      const offer = getOffer();
      const form = getMainForm();
      if (!offer || !form) return;

      const planId = String(offer.dataset.planId || '');
      let authoritative = form.querySelector('[data-avonent-moringa-selling-plan-global]');

      if (!authoritative) {
        authoritative = document.createElement('input');
        authoritative.type = 'hidden';
        authoritative.setAttribute('data-avonent-moringa-selling-plan-global', '');
        form.appendChild(authoritative);
      }

      form.querySelectorAll('[name="selling_plan"]').forEach((control) => {
        if (control === authoritative) return;
        control.disabled = true;
        if (control.matches('[type="radio"], [type="checkbox"]')) control.checked = false;
      });

      if (mode === 'subscription' && planId) {
        authoritative.disabled = false;
        authoritative.name = 'selling_plan';
        authoritative.value = planId;
        authoritative.setAttribute('value', planId);
      } else {
        authoritative.disabled = true;
        authoritative.name = 'selling_plan';
        authoritative.value = '';
        authoritative.removeAttribute('value');
      }
    };

    const renderBundlePrices = () => {
      getBundleOptions().forEach((option) => {
        const values = bundleNumbers(option);
        const total = mode === 'subscription' ? values.subscriptionTotal : values.oneTimeTotal;
        const compareTotal = mode === 'subscription'
          ? values.subscriptionCompareTotal
          : values.oneTimeCompareTotal;

        const price = option.querySelector('[data-av-bundle-price]');
        const compare = option.querySelector('[data-av-bundle-compare]');
        const savings = option.querySelector('[data-av-bundle-savings]');

        if (price && total > 0) price.textContent = formatMoney(total);

        if (compare) {
          const showCompare = compareTotal > total && total > 0;
          compare.textContent = showCompare ? formatMoney(compareTotal) : '';
          compare.hidden = !showCompare;
        }

        if (savings) {
          if (mode === 'one_time') {
            savings.hidden = true;
          } else if (savings.dataset.customText === 'true') {
            savings.hidden = false;
          } else {
            const percent = compareTotal > total
              ? Math.round(((compareTotal - total) / compareTotal) * 100)
              : 0;
            savings.textContent = percent > 0 ? `Save ${percent}%` : '';
            savings.hidden = percent <= 0;
          }
        }
      });

      const root = getBundleRoot();
      if (root) root.dataset.purchaseMode = mode;
    };

    const ensureMeta = () => {
      const form = getMainForm();
      if (!form) return null;

      let meta = form.querySelector('[data-moringa-purchase-meta]');
      if (!meta) {
        const buttons = form.querySelector('.product-form-buttons');
        if (!buttons) return null;

        meta = document.createElement('div');
        meta.className = 'moringa-purchase-meta';
        meta.setAttribute('data-moringa-purchase-meta', '');
        meta.innerHTML = `
          <div class="moringa-purchase-meta__recurring" data-moringa-recurring>
            <span class="moringa-purchase-meta__item">↻ <span>Refills ship every 30 days</span></span>
            <i aria-hidden="true"></i>
            <span class="moringa-purchase-meta__item">◷ <span>Skip or cancel anytime</span></span>
          </div>
          <button type="button" class="moringa-purchase-meta__one-time" data-moringa-one-time></button>
          <p class="moringa-purchase-meta__status" data-moringa-one-time-status hidden>One-time purchase selected · No recurring charges</p>
        `;
        buttons.insertAdjacentElement('afterend', meta);
      }

      let status = meta.querySelector('[data-moringa-one-time-status]');
      if (!status) {
        status = document.createElement('p');
        status.className = 'moringa-purchase-meta__status';
        status.setAttribute('data-moringa-one-time-status', '');
        status.textContent = 'One-time purchase selected · No recurring charges';
        meta.appendChild(status);
      }

      return meta;
    };

    const renderOffer = () => {
      const offer = getOffer();
      const selected = getSelectedBundle();
      if (!offer || !selected) return;

      const values = bundleNumbers(selected);
      const price = offer.querySelector('.avonent-price-offer__price');
      const compare = offer.querySelector('.avonent-price-offer__compare');
      const save = offer.querySelector('.avonent-price-offer__save');
      const label = offer.querySelector('.avonent-price-offer__label');
      const helper = offer.querySelector('.avonent-price-offer__helper');
      const subscribeRow = offer.querySelector('[data-moringa-subscribe]');

      if (label && !label.dataset.subscriptionLabel) {
        label.dataset.subscriptionLabel = label.textContent.trim() || 'Subscribe & Save';
      }
      if (helper && !helper.dataset.subscriptionHelper) {
        helper.dataset.subscriptionHelper = helper.textContent.trim() || 'Recurring delivery · Cancel anytime';
      }

      const activeTotal = mode === 'subscription' ? values.subscriptionTotal : values.oneTimeTotal;

      if (price && activeTotal > 0) price.textContent = formatMoney(activeTotal);

      if (label) {
        label.textContent = mode === 'subscription'
          ? (label.dataset.subscriptionLabel || 'Subscribe & Save')
          : 'One-Time Purchase';
      }

      if (helper) {
        if (mode === 'subscription') {
          helper.hidden = false;
          helper.textContent = helper.dataset.subscriptionHelper || 'Recurring delivery · Cancel anytime';
        } else {
          helper.hidden = true;
        }
      }

      if (compare) {
        const showCompare =
          mode === 'subscription' &&
          values.subscriptionCompareTotal > values.subscriptionTotal;
        compare.textContent = showCompare ? formatMoney(values.subscriptionCompareTotal) : '';
        compare.hidden = !showCompare;
      }

      if (save) {
        const percent =
          mode === 'subscription' && values.subscriptionCompareTotal > values.subscriptionTotal
            ? Math.round(
                ((values.subscriptionCompareTotal - values.subscriptionTotal) /
                  values.subscriptionCompareTotal) * 100
              )
            : 0;
        save.textContent = percent > 0 ? `Save ${percent}%` : '';
        save.hidden = percent <= 0;
      }

      if (subscribeRow) {
        subscribeRow.classList.toggle('is-selected', mode === 'subscription');
        subscribeRow.setAttribute('aria-pressed', mode === 'subscription' ? 'true' : 'false');
      }

      const meta = ensureMeta();
      const recurring = meta?.querySelector('[data-moringa-recurring]');
      const switchButton = meta?.querySelector('[data-moringa-one-time]');
      const status = meta?.querySelector('[data-moringa-one-time-status]');

      if (recurring) recurring.hidden = mode !== 'subscription';
      if (status) status.hidden = mode !== 'one_time';

      if (switchButton) {
        switchButton.classList.remove('is-selected');
        switchButton.setAttribute('aria-pressed', 'false');
        switchButton.dataset.purchaseSwitch = mode === 'subscription' ? 'one_time' : 'subscription';

        if (mode === 'subscription') {
          switchButton.innerHTML = `One-Time Purchase <strong>${formatMoney(values.oneTimeTotal)}</strong> + $4.95 Shipping <span>(No Free Gifts Included).</span>`;
        } else {
          switchButton.innerHTML = `Switch back to Subscribe & Save — <strong>${formatMoney(values.subscriptionTotal)}</strong>`;
        }
      }

      offer.dataset.purchaseMode = mode;
      offer.dataset.selectedQuantity = String(values.quantity);
      offer.dataset.subscriptionTotal = String(values.subscriptionTotal);
      offer.dataset.oneTimeTotal = String(values.oneTimeTotal);
    };

    const render = () => {
      renderBundlePrices();
      renderOffer();
      enforceSellingPlan();
    };

    const announceMode = () => {
      if (dispatchingMode) return;
      dispatchingMode = true;
      const offer = getOffer();
      document.dispatchEvent(new CustomEvent('avonent:purchase-mode-change', {
        detail: {
          mode,
          sellingPlanId: mode === 'subscription' ? String(offer?.dataset.planId || '') : null,
          source: 'moringa-controller'
        }
      }));
      dispatchingMode = false;
    };

    const setMode = (nextMode, announce = true) => {
      mode = nextMode === 'one_time' || nextMode === 'one-time' ? 'one_time' : 'subscription';
      render();
      if (announce) announceMode();

      requestAnimationFrame(render);
      window.setTimeout(render, 0);
      window.setTimeout(render, 80);
    };

    document.addEventListener('click', (event) => {
      const switchButton = event.target.closest('[data-moringa-one-time]');
      if (switchButton && main.contains(switchButton)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const nextMode = switchButton.dataset.purchaseSwitch ||
          (mode === 'subscription' ? 'one_time' : 'subscription');
        setMode(nextMode);
        return;
      }

      const subscribeRow = event.target.closest('[data-moringa-subscribe]');
      if (subscribeRow && main.contains(subscribeRow)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (mode !== 'subscription') setMode('subscription');
        return;
      }

      const bundle = event.target.closest('[data-av-bundle-option]');
      if (bundle && main.contains(bundle)) {
        window.setTimeout(render, 0);
        window.setTimeout(render, 40);
        return;
      }

      const addButton = event.target.closest(
        'button[type="submit"][name="add"], button[type="submit"][data-add-to-cart], [data-testid="add-to-cart"]'
      );
      if (addButton && main.contains(addButton)) {
        render();
        enforceSellingPlan();
      }
    }, true);

    document.addEventListener('avonent:bundle-change', () => {
      window.setTimeout(render, 0);
      window.setTimeout(render, 40);
    });

    document.addEventListener('avonent:purchase-mode-change', (event) => {
      if (event.detail?.source === 'moringa-controller' || dispatchingMode) return;
      const requested = event.detail?.mode;
      if (requested === 'subscription' || requested === 'one_time' || requested === 'one-time') {
        mode = requested === 'subscription' ? 'subscription' : 'one_time';
        window.setTimeout(render, 0);
      }
    });

    document.addEventListener('shopify:section:load', () => {
      window.setTimeout(render, 0);
      window.setTimeout(render, 120);
    });

    document.addEventListener('submit', (event) => {
      const form = getMainForm();
      if (!form || event.target !== form) return;
      enforceSellingPlan();
    }, true);

    document.addEventListener('formdata', (event) => {
      const form = getMainForm();
      if (!form || event.target !== form) return;

      const planId = String(getOffer()?.dataset.planId || '');
      event.formData.delete('selling_plan');
      if (mode === 'subscription' && planId) {
        event.formData.set('selling_plan', planId);
      }
    });

    mode = 'subscription';
    [0, 80, 250, 700, 1400, 2600, 3800].forEach((delay) => {
      window.setTimeout(render, delay);
    });
  });
})();
