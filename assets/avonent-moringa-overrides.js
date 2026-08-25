(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  ready(() => {
    const main = document.querySelector('main[data-template*="product.moringa"]');
    if (!main) return;

    const claimMarker = (symbol, target, label) =>
      `<sup class="avonent-claim-marker"><a href="#${target}" aria-label="${label}">${symbol}</a></sup>`;

    const appendMarker = (el, symbol, target, label) => {
      if (!el || el.querySelector(`a[href="#${target}"]`)) return;
      el.insertAdjacentHTML('beforeend', claimMarker(symbol, target, label));
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
        main[data-template*="product.moringa"] .avonent-claim-marker a {
          color:#078aa5;
          text-decoration:none;
        }
      `;
      document.head.appendChild(style);
    }

    // Product accordion: Moringa copy with compact linked claim symbols instead of bulky notes.
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
          <li><strong>Daily vitality:</strong> plant-based nutritional support for everyday energy, resilience, and an active routine.${claimMarker('†','avonent-disclaimer-fda','See supplement disclaimer')}</li>
          <li><strong>Antioxidant defense:</strong> moringa contains naturally occurring polyphenols and other antioxidant plant compounds that support the body’s defenses against oxidative stress.${claimMarker('†','avonent-disclaimer-fda','See supplement disclaimer')}</li>
          <li><strong>Healthy aging support:</strong> antioxidant and plant-compound support designed to fit a long-term wellness routine.${claimMarker('†','avonent-disclaimer-fda','See supplement disclaimer')}</li>
          <li><strong>Heart wellness:</strong> moringa has been studied for cardiometabolic markers including blood pressure and lipid-related measures; human evidence is still developing.${claimMarker('†','avonent-disclaimer-fda','See supplement disclaimer')}${claimMarker('‡','avonent-disclaimer-medical','See healthcare professional disclaimer')}</li>
          <li><strong>Healthy glucose metabolism:</strong> human research has explored moringa’s relationship with fasting glucose and HbA1c. Findings are promising in some studies but remain preliminary and inconsistent.${claimMarker('†','avonent-disclaimer-fda','See supplement disclaimer')}${claimMarker('‡','avonent-disclaimer-medical','See healthcare professional disclaimer')}</li>
          <li><strong>Joint & active-lifestyle support:</strong> moringa’s antioxidant plant compounds can complement a routine built around normal inflammatory balance, movement, and recovery.${claimMarker('†','avonent-disclaimer-fda','See supplement disclaimer')}</li>
          <li><strong>Whole-body wellness:</strong> a simple single-botanical addition for people who want broad plant-based support without another complicated stack.${claimMarker('†','avonent-disclaimer-fda','See supplement disclaimer')}</li>
        </ul>
      `);

      replaceItem(2, 'Recommended Use', `
        <p><strong>Take 2 capsules once daily</strong> with an 8 oz (237 mL) glass of water.</p>
        <p>For best results, the product label recommends taking your serving <strong>20–30 minutes before a meal</strong>, or using it as directed by your healthcare professional. Consistency matters more than chasing a perfect time of day, so pair it with a routine you can actually keep.</p>
        <p><strong>Important:</strong> Do not exceed the recommended dose. Consult a physician before use if you are pregnant, nursing, under 18, taking medication, or have a medical condition. Because moringa has been studied for glucose and blood-pressure effects, people using medications for either should speak with a healthcare professional before adding it to their routine.${claimMarker('‡','avonent-disclaimer-medical','See healthcare professional disclaimer')}</p>
      `);
    }

    // Keep the exact original benefit wording. Only add linked claim symbols.
    const benefitGrid = main.querySelector('.avonent-benefits');
    if (benefitGrid) {
      benefitGrid.querySelectorAll('.avonent-benefits__text').forEach((el) => {
        appendMarker(el, '†', 'avonent-disclaimer-fda', 'See supplement disclaimer');
        if (/heart|metabolic|glucose|blood pressure/i.test(el.textContent)) {
          appendMarker(el, '‡', 'avonent-disclaimer-medical', 'See healthcare professional disclaimer');
        }
      });
    }

    // Blue research / proof section: change only the copy ABOVE the proof points.
    // Do not alter the existing study count, traditional-use years, formula amount, or customer milestone.
    const proof = main.querySelector('.avonent-proof-stats');
    if (proof) {
      const eyebrow = proof.querySelector('.avonent-proof-stats__eyebrow');
      const heading = proof.querySelector('.avonent-proof-stats__heading');
      const desc = proof.querySelector('.avonent-proof-stats__description');
      if (eyebrow) eyebrow.textContent = 'TRADITION MEETS MODERN WELLNESS';
      if (heading) heading.textContent = 'Rooted in nature. Made for everyday wellness.';
      if (desc) {
        desc.innerHTML = '<p>Pure Moringa brings one of the world’s most studied traditional botanicals into a simple daily routine—plant-based support for vitality, antioxidant defense, healthy aging, and whole-body wellness.</p>';
        appendMarker(desc.querySelector('p'), '†', 'avonent-disclaimer-fda', 'See supplement disclaimer');
      }
    }

    // Week-by-week section. Preserve the approved copy and attach * to routine/outcome language.
    const journey = main.querySelector('.avonent-journey');
    if (journey) {
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
            appendMarker(el, '*', 'avonent-disclaimer-results', 'See individual results disclaimer');
          }
        });
      });
    }

    // Bottom offer: remove the last remaining digestive-product wording.
    const bottomOffer = main.querySelector('.avonent-bottom-offer');
    if (bottomOffer) {
      const desc = bottomOffer.querySelector('.avonent-bottom-offer__description');
      if (desc) desc.innerHTML = '<p>Choose the supply that fits your routine and keep your daily Moringa wellness support within reach.</p>';
    }

    // Hide legacy digestive-only content until dedicated Moringa versions replace it.
    main.querySelectorAll('.avonent-formula, .av-ba').forEach(section => {
      const wrapper = section.closest('.shopify-section') || section;
      wrapper.style.display = 'none';
    });

    // Hide legacy digestive-product testimonials marked as verified on the Moringa template.
    const reviews = main.querySelector('.avonent-customer-reviews');
    if (reviews) {
      const wrapper = reviews.closest('.shopify-section') || reviews;
      wrapper.style.display = 'none';
    }
  });
})();
