(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  ready(() => {
    const main = document.querySelector('main[data-template*="product.moringa"]');
    if (!main) return;

    const claimMarker = (symbol) => `<sup class="avonent-claim-marker" aria-hidden="true">${symbol}</sup>`;

    const appendSingleMarker = (el, symbol) => {
      if (!el) return;
      el.querySelectorAll('.avonent-claim-marker').forEach((marker) => marker.remove());
      el.insertAdjacentHTML('beforeend', claimMarker(symbol));
    };

    if (!document.getElementById('avonent-moringa-copy-styles')) {
      const style = document.createElement('style');
      style.id = 'avonent-moringa-copy-styles';
      style.textContent = `
        main[data-template*="product.moringa"] .av-moringa-lead {
          color:#111; font-size:1.02em; line-height:1.6; margin:0 0 12px;
        }
        main[data-template*="product.moringa"] .av-moringa-proof {
          margin:14px 0 4px; padding:12px 14px; border:1px solid #cfeaf0;
          border-radius:12px; background:#f2fbfd; color:#26343a; line-height:1.5;
        }
        main[data-template*="product.moringa"] .av-moringa-proof strong { color:#078aa5; }
        main[data-template*="product.moringa"] .avonent-accordion__item--benefits .avonent-accordion__content-inner li::before {
          background:#02c6ea;
        }
        main[data-template*="product.moringa"] .avonent-claim-marker {
          color:inherit !important;
          text-decoration:none !important;
          pointer-events:none;
          cursor:default;
          opacity:.92;
        }

        /* Journey lead-in: moving benefit strip + image */
        .av-moringa-journey-leadin {
          width:100%;
          background:#fff;
          overflow:hidden;
        }
        .av-moringa-benefit-marquee {
          width:100%;
          overflow:hidden;
          border-top:1px solid #d9e9ed;
          border-bottom:1px solid #d9e9ed;
          background:#fff;
        }
        .av-moringa-benefit-track {
          display:flex;
          width:max-content;
          min-width:200%;
          animation:avMoringaMarquee 24s linear infinite;
          will-change:transform;
        }
        .av-moringa-benefit-set {
          display:flex;
          align-items:center;
          flex:none;
          gap:30px;
          padding:13px 15px;
        }
        .av-moringa-benefit-chip {
          display:inline-flex;
          align-items:center;
          gap:8px;
          white-space:nowrap;
          color:#111;
          font-family:var(--font-body--family);
          font-size:14px;
          font-weight:650;
          line-height:1;
        }
        .av-moringa-benefit-chip__icon {
          display:grid;
          place-items:center;
          width:22px;
          height:22px;
          border-radius:50%;
          color:#078aa5;
          background:#eaf9fc;
          font-size:13px;
          font-weight:800;
        }
        .av-moringa-journey-image {
          width:min(calc(100% - 48px), 1180px);
          margin:34px auto 28px;
          position:relative;
          overflow:hidden;
          border-radius:24px;
          background:linear-gradient(135deg,#eaf9fc,#c9eef5);
          min-height:280px;
        }
        .av-moringa-journey-image img {
          display:block;
          width:100%;
          height:100%;
          min-height:280px;
          max-height:480px;
          object-fit:cover;
          object-position:center;
        }
        .av-moringa-journey-image::after {
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(180deg,rgba(6,64,77,0) 38%,rgba(6,64,77,.46) 100%);
          pointer-events:none;
        }
        .av-moringa-journey-image__caption {
          position:absolute;
          z-index:2;
          left:24px;
          right:24px;
          bottom:22px;
          color:#fff;
          font-family:var(--font-heading--family);
          font-size:clamp(24px,4vw,42px);
          font-weight:700;
          line-height:1.02;
          letter-spacing:-.03em;
          text-shadow:0 2px 18px rgba(0,0,0,.22);
        }
        @keyframes avMoringaMarquee {
          from { transform:translateX(0); }
          to { transform:translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .av-moringa-benefit-track { animation:none; }
        }
        @media screen and (max-width:749px) {
          .av-moringa-benefit-set { gap:22px; padding:12px 12px; }
          .av-moringa-benefit-chip { font-size:13px; }
          .av-moringa-journey-image {
            width:calc(100% - 30px);
            margin:24px auto 22px;
            min-height:220px;
            border-radius:16px;
          }
          .av-moringa-journey-image img { min-height:220px; max-height:320px; }
          .av-moringa-journey-image__caption { left:18px; right:18px; bottom:17px; font-size:27px; }
        }
      `;
      document.head.appendChild(style);
    }

    const accordion = main.querySelector('.avonent-accordion');
    if (accordion) {
      const items = accordion.querySelectorAll('.avonent-accordion__item');
      const replaceItem = (index, title, html) => {
        const item = items[index];
        if (!item) return;
        const titleEl = item.querySelector('.avonent-accordion__title');
        const body = item.querySelector('.avonent-accordion__content-inner');
        if (titleEl) titleEl.textContent = title;
        if (body) body.innerHTML = html;
      };

      replaceItem(0, 'Description', `
        <p class="av-moringa-lead"><strong>Avonent Pure Moringa</strong> keeps daily wellness refreshingly simple: one featured botanical, Moringa oleifera leaf, in an easy two-capsule serving.</p>
        <p>Each serving provides <strong>800 mg of moringa leaf</strong>. Moringa has a long history as a food and wellness plant, and modern research continues to explore its naturally occurring polyphenols and other plant compounds for antioxidant, metabolic, cardiovascular, and whole-body wellness.</p>
        <p>There is no complicated multi-ingredient blend here. Just a straightforward way to make moringa leaf part of a consistent daily routine.</p>
        <div class="av-moringa-proof"><strong>Simple by design:</strong> 800 mg Moringa oleifera leaf per serving · vegetable capsule · 30 servings per bottle.</div>
      `);

      replaceItem(1, 'Benefits', `
        <ul>
          <li><strong>Daily vitality:</strong> plant-based nutritional support for everyday energy, resilience, and an active routine.${claimMarker('†')}</li>
          <li><strong>Antioxidant defense:</strong> moringa contains naturally occurring polyphenols and other antioxidant plant compounds that support the body’s defenses against oxidative stress.${claimMarker('†')}</li>
          <li><strong>Healthy aging support:</strong> antioxidant and plant-compound support designed to fit a long-term wellness routine.${claimMarker('†')}</li>
          <li><strong>Heart wellness:</strong> moringa has been studied for cardiometabolic markers including blood pressure and lipid-related measures; human evidence is still developing.${claimMarker('‡')}</li>
          <li><strong>Healthy glucose metabolism:</strong> human research has explored moringa’s relationship with fasting glucose and HbA1c. Findings are promising in some studies but remain preliminary and inconsistent.${claimMarker('‡')}</li>
          <li><strong>Joint & active-lifestyle support:</strong> moringa’s antioxidant plant compounds can complement a routine built around normal inflammatory balance, movement, and recovery.${claimMarker('†')}</li>
          <li><strong>Whole-body wellness:</strong> a simple single-botanical addition for people who want broad plant-based support without another complicated stack.${claimMarker('†')}</li>
        </ul>
      `);

      replaceItem(2, 'Recommended Use', `
        <p><strong>Take 2 capsules once daily</strong> with an 8 oz (237 mL) glass of water.</p>
        <p>For best results, the product label recommends taking your serving <strong>20–30 minutes before a meal</strong>, or using it as directed by your healthcare professional. Consistency matters more than chasing a perfect time of day, so pair it with a routine you can actually keep.</p>
        <p><strong>Important:</strong> Do not exceed the recommended dose. Consult a physician before use if you are pregnant, nursing, under 18, taking medication, or have a medical condition. Because moringa has been studied for glucose and blood-pressure effects, people using medications for either should speak with a healthcare professional before adding it to their routine.${claimMarker('‡')}</p>
      `);
    }

    const benefitGrid = main.querySelector('.avonent-benefits');
    if (benefitGrid) {
      benefitGrid.querySelectorAll('.avonent-benefits__text').forEach((el) => {
        const text = el.textContent;
        const marker = /heart|metabolic|glucose|blood pressure/i.test(text) ? '‡' : '†';
        appendSingleMarker(el, marker);
      });
    }

    const proof = main.querySelector('.avonent-proof-stats');
    if (proof) {
      const eyebrow = proof.querySelector('.avonent-proof-stats__eyebrow');
      const heading = proof.querySelector('.avonent-proof-stats__heading');
      const desc = proof.querySelector('.avonent-proof-stats__description');
      if (eyebrow) eyebrow.textContent = 'TRADITION MEETS MODERN WELLNESS';
      if (heading) heading.textContent = 'Rooted in nature. Made for everyday wellness.';
      if (desc) {
        desc.innerHTML = '<p>Pure Moringa brings one of the world’s most studied traditional botanicals into a simple daily routine—plant-based support for vitality, antioxidant defense, healthy aging, and whole-body wellness.</p>';
        appendSingleMarker(desc.querySelector('p'), '†');
      }
    }

    const journey = main.querySelector('.avonent-journey');
    if (journey) {
      const journeyWrapper = journey.closest('.shopify-section') || journey;

      // Add Resilia-inspired moving benefit strip and an editable-looking example image area above the journey.
      if (!main.querySelector('.av-moringa-journey-leadin')) {
        const leadin = document.createElement('section');
        leadin.className = 'av-moringa-journey-leadin';
        const chips = [
          ['⚡','Daily Vitality','†'],
          ['✦','Antioxidant Defense','†'],
          ['◒','Healthy Aging','†'],
          ['♥','Heart Wellness','‡'],
          ['↻','Metabolic Support','‡'],
          ['✓','Joint & Active Support','†']
        ];
        const chipHTML = chips.map(([icon,label,mark]) => `<span class="av-moringa-benefit-chip"><span class="av-moringa-benefit-chip__icon">${icon}</span>${label}${claimMarker(mark)}</span>`).join('');

        // For now use an existing Moringa/product image as the example image so this renders immediately.
        // It can be replaced with a dedicated lifestyle image in Shopify later.
        const sourceImage = main.querySelector('.product-media img, .product__media img, [data-product-media] img, img[src*="moringa"], img');
        const imageSrc = sourceImage?.currentSrc || sourceImage?.src || '';
        const imageAlt = sourceImage?.alt || 'Avonent Pure Moringa wellness lifestyle';

        leadin.innerHTML = `
          <div class="av-moringa-benefit-marquee" aria-label="Pure Moringa wellness benefits">
            <div class="av-moringa-benefit-track">
              <div class="av-moringa-benefit-set">${chipHTML}</div>
              <div class="av-moringa-benefit-set" aria-hidden="true">${chipHTML}</div>
            </div>
          </div>
          <div class="av-moringa-journey-image">
            ${imageSrc ? `<img src="${imageSrc}" alt="${imageAlt.replace(/"/g,'&quot;')}" loading="lazy">` : ''}
            <div class="av-moringa-journey-image__caption">Wellness built around consistency.</div>
          </div>
        `;
        journeyWrapper.parentNode.insertBefore(leadin, journeyWrapper);
      }

      const eyebrow = journey.querySelector('.avonent-journey__eyebrow');
      const heading = journey.querySelector('.avonent-journey__heading');
      const desc = journey.querySelector('.avonent-journey__description');
      if (eyebrow) eyebrow.textContent = 'BUILD YOUR ROUTINE';
      if (heading) heading.textContent = 'Your first month with Pure Moringa';
      if (desc) desc.innerHTML = '<p>Consistency first. Here’s a simple way to think about your first month—without pretending everyone feels the same change on the same timeline.</p>';

      const steps = [
        ['Week 1', 'Start the Ritual', ['Make 2 capsules part of your daily routine', 'Begin consistent plant-based wellness support', 'Give antioxidant support a regular place in your day']],
        ['Week 2', 'Build Momentum', ['Keep your routine simple and consistent', 'Support everyday vitality and an active lifestyle', 'Pay attention to your normal energy and recovery baseline']],
        ['Week 3', 'Think Whole-Body', ['Continue antioxidant and healthy-aging support', 'Support heart and metabolic wellness as part of a healthy lifestyle', 'Look for consistency—not overnight promises']],
        ['Week 4', 'Make It Your Baseline', ['Decide how Pure Moringa fits your long-term routine', 'Keep wellness simple with one featured botanical', 'Pair it with sleep, movement, hydration, and balanced nutrition']]
      ];

      const cards = journey.querySelectorAll('.avonent-journey__step');
      cards.forEach((card, i) => {
        const step = steps[i];
        if (!step) return;
        const week = card.querySelector('.avonent-journey__week');
        const title = card.querySelector('.avonent-journey__title');
        const benefits = card.querySelectorAll('.avonent-journey__benefit > span:last-child');
        if (week) week.textContent = step[0];
        if (title) title.textContent = step[1];
        benefits.forEach((el, idx) => {
          if (step[2][idx]) {
            el.textContent = step[2][idx];
            appendSingleMarker(el, '*');
          }
        });
      });
    }

    const bottomOffer = main.querySelector('.avonent-bottom-offer');
    if (bottomOffer) {
      const desc = bottomOffer.querySelector('.avonent-bottom-offer__description');
      if (desc) desc.innerHTML = '<p>Choose the supply that fits your routine and keep your daily Moringa wellness support within reach.</p>';
    }

    main.querySelectorAll('.avonent-formula, .av-ba').forEach(section => {
      const wrapper = section.closest('.shopify-section') || section;
      wrapper.style.display = 'none';
    });

    const reviews = main.querySelector('.avonent-customer-reviews');
    if (reviews) {
      const wrapper = reviews.closest('.shopify-section') || reviews;
      wrapper.style.display = 'none';
    }
  });
})();
