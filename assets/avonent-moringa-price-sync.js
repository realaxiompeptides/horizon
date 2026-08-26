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

    // The benefit ticker now lives directly under the header, Resilia-style.
    // Hide the older mid-page copy so the same marquee is not shown twice.
    main.querySelectorAll('.section-avonent-benefit-marquee').forEach((section) => {
      section.style.display = 'none';
    });

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

    const syncHeadlinePrice = () => {
      const option = getSelectedBundle();
      const offer = main.querySelector('[data-avonent-price-offer]');
      if (!option || !offer) return;

      const quantity = Math.max(1, Number(option.dataset.quantity || 1));
      const subscriptionUnit = Number(option.dataset.subscriptionUnit || 0);
      const subscriptionCompareUnit = Number(
        option.dataset.subscriptionCompareUnit || option.dataset.oneTimeUnit || 0
      );
      const oneTimeUnit = Number(option.dataset.oneTimeUnit || 0);

      const subscriptionTotal = subscriptionUnit * quantity;
      const subscriptionCompareTotal = subscriptionCompareUnit * quantity;
      const oneTimeTotal = oneTimeUnit * quantity;

      const price = offer.querySelector('.avonent-price-offer__price');
      const compare = offer.querySelector('.avonent-price-offer__compare');
      const save = offer.querySelector('.avonent-price-offer__save');

      if (price && subscriptionTotal > 0) {
        price.textContent = formatMoney(subscriptionTotal);
      }

      if (compare) {
        if (subscriptionCompareTotal > subscriptionTotal && subscriptionTotal > 0) {
          compare.textContent = formatMoney(subscriptionCompareTotal);
          compare.hidden = false;
        } else {
          compare.textContent = '';
          compare.hidden = true;
        }
      }

      if (save && subscriptionCompareTotal > subscriptionTotal && subscriptionCompareTotal > 0) {
        const percent = Math.round(
          ((subscriptionCompareTotal - subscriptionTotal) / subscriptionCompareTotal) * 100
        );
        save.textContent = `Save ${percent}%`;
        save.hidden = percent <= 0;
      }

      offer.dataset.selectedQuantity = String(quantity);
      offer.dataset.subscriptionTotal = String(subscriptionTotal);
      offer.dataset.subscriptionCompareTotal = String(subscriptionCompareTotal);
      offer.dataset.oneTimeTotal = String(oneTimeTotal);

      // Keep the one-time purchase text below Add to Cart truthful for Buy 2 / Buy 3 too.
      const oneTimePrice = main.querySelector(
        '[data-moringa-purchase-meta] [data-moringa-one-time] strong'
      );
      if (oneTimePrice && oneTimeTotal > 0) {
        oneTimePrice.textContent = formatMoney(oneTimeTotal);
      }
    };

    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-av-bundle-option]')) return;
      window.setTimeout(syncHeadlinePrice, 0);
    });

    document.addEventListener('avonent:purchase-mode-change', () => {
      window.setTimeout(syncHeadlinePrice, 0);
    });

    document.addEventListener('shopify:section:load', () => {
      window.setTimeout(syncHeadlinePrice, 0);
    });

    // Horizon/Appstle can hydrate and replace product markup after first paint.
    [0, 80, 250, 700, 1400, 2600].forEach((delay) => {
      window.setTimeout(syncHeadlinePrice, delay);
    });
  });
})();
