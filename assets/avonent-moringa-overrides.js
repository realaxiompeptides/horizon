(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  ready(() => {
    const main = document.querySelector('main[data-template*="product.moringa"]');
    if (!main) return;

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
        main[data-template*="product.moringa"] .av-moringa-note {
          margin-top:12px!important; font-size:.9em; color:#68757a;
        }
        main[data-template*="product.moringa"] .avonent-accordion__item--benefits .avonent-accordion__content-inner li::before {
          background:#02c6ea;
        }
      `;
      document.head.appendChild(style);
    }

    // Product accordion: replace legacy digestive-complex copy.
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
          <li><strong>Daily vitality:</strong> plant-based nutritional support for everyday energy, resilience, and an active routine.</li>
          <li><strong>Antioxidant defense:</strong> moringa contains naturally occurring polyphenols and other antioxidant plant compounds that support the body’s defenses against oxidative stress.</li>
          <li><strong>Healthy aging support:</strong> antioxidant and plant-compound support designed to fit a long-term wellness routine.</li>
          <li><strong>Heart wellness:</strong> moringa has been studied for cardiometabolic markers including blood pressure and lipid-related measures; human evidence is still developing.</li>
          <li><strong>Healthy glucose metabolism:</strong> human research has explored moringa’s relationship with fasting glucose and HbA1c. Findings are promising in some studies but remain preliminary and inconsistent.</li>
          <li><strong>Joint & active-lifestyle support:</strong> moringa’s antioxidant plant compounds can complement a routine built around normal inflammatory balance, movement, and recovery.</li>
          <li><strong>Whole-body wellness:</strong> a simple single-botanical addition for people who want broad plant-based support without another complicated stack.</li>
        </ul>
        <p class="av-moringa-note"><strong>Research note:</strong> Avonent Pure Moringa is a dietary supplement, not a treatment for diabetes, high blood pressure, arthritis, or any other disease. Research into glucose, blood-pressure, and other metabolic outcomes is still emerging.</p>
        <p class="av-moringa-note">†These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.</p>
      `);

      replaceItem(2, 'Recommended Use', `
        <p><strong>Take 2 capsules once daily</strong> with an 8 oz (237 mL) glass of water.</p>
        <p>For best results, the product label recommends taking your serving <strong>20–30 minutes before a meal</strong>, or using it as directed by your healthcare professional. Consistency matters more than chasing a perfect time of day, so pair it with a routine you can actually keep.</p>
        <p><strong>Important:</strong> Do not exceed the recommended dose. Consult a physician before use if you are pregnant, nursing, under 18, taking medication, or have a medical condition. Because moringa has been studied for glucose and blood-pressure effects, people using medications for either should speak with a healthcare professional before adding it to their routine.</p>
      `);
    }

    // Top benefit grid.
    const benefitTexts = [
      'Daily Vitality Support†',
      'Healthy Aging Support†',
      'Heart Wellness Support†',
      'Healthy Glucose Metabolism†',
      'Joint & Active Lifestyle†',
      'Antioxidant Defense†'
    ];
    const benefitGrid = main.querySelector('.avonent-benefits');
    if (benefitGrid) {
      const labels = benefitGrid.querySelectorAll('.avonent-benefits__text');
      labels.forEach((el, i) => {
        if (benefitTexts[i]) el.textContent = benefitTexts[i];
      });
    }

    // Blue research / proof section.
    const proof = main.querySelector('.avonent-proof-stats');
    if (proof) {
      const eyebrow = proof.querySelector('.avonent-proof-stats__eyebrow');
      const heading = proof.querySelector('.avonent-proof-stats__heading');
      const desc = proof.querySelector('.avonent-proof-stats__description');
      if (eyebrow) eyebrow.textContent = 'ONE PLANT. A WIDER WELLNESS STORY.';
      if (heading) heading.textContent = 'Pure moringa. Simple formula. Serious daily potential.';
      if (desc) desc.innerHTML = '<p>Each serving delivers 800 mg of Moringa oleifera leaf. Human research has explored moringa across antioxidant and cardiometabolic health, while the evidence continues to evolve.</p>';

      const stats = proof.querySelectorAll('.avonent-proof-stats__stat');
      const data = [
        ['HUMAN RESEARCH', '20', 'Clinical studies included in a recent systematic review'],
        ['PURE LEAF', '800 mg', 'Moringa oleifera leaf per serving'],
        ['SIMPLE FORMULA', '1', 'Featured botanical ingredient'],
        ['DAILY ROUTINE', '30', 'Servings in every bottle']
      ];
      stats.forEach((stat, i) => {
        if (!data[i]) return;
        const kicker = stat.querySelector('.avonent-proof-stats__kicker');
        const value = stat.querySelector('.avonent-proof-stats__value');
        const label = stat.querySelector('.avonent-proof-stats__label');
        if (kicker) kicker.textContent = data[i][0];
        if (value) value.textContent = data[i][1];
        if (label) label.textContent = data[i][2];
      });
    }

    // Week-by-week section: a credible routine roadmap rather than promised medical outcomes.
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
          if (step[2][idx]) el.textContent = step[2][idx];
        });
      });
    }

    // The Moringa template still contains the old digestive ingredient breakdown
    // and digestive before/after story. Hide them until dedicated Moringa sections replace them.
    main.querySelectorAll('.avonent-formula, .av-ba').forEach(section => {
      const wrapper = section.closest('.shopify-section') || section;
      wrapper.style.display = 'none';
    });
  });
})();
