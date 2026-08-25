(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  ready(() => {
    const main = document.querySelector('main[data-template*="product.moringa"]');
    if (!main) return;

    // Moringa-only visual polish for richer accordion copy.
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

    // 1) Product accordion: replace old digestive-complex copy.
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
        <p class="av-moringa-lead"><strong>Avonent Pure Moringa</strong> keeps daily wellness refreshingly simple: one botanical, Moringa oleifera leaf, in an easy two-capsule serving.</p>
        <p>Each serving provides <strong>800 mg of pure moringa leaf</strong>. Moringa has a long history as a food and wellness plant, and modern research continues to explore its naturally occurring polyphenols and other plant compounds for antioxidant, metabolic, cardiovascular, and whole-body wellness.</p>
        <p>There are no complicated multi-ingredient blends here. Just a straightforward way to add moringa leaf to a consistent daily routine.</p>
        <div class="av-moringa-proof"><strong>Simple by design:</strong> 800 mg Moringa oleifera leaf per serving · vegetable capsule · 30 servings per bottle.</div>
      `);

      replaceItem(1, 'Benefits', `
        <ul>
          <li><strong>Daily vitality:</strong> plant-based nutritional support for everyday energy, resilience, and an active routine.</li>
          <li><strong>Antioxidant defense:</strong> moringa naturally contains polyphenols and other antioxidant plant compounds that help support the body’s defenses against oxidative stress.</li>
          <li><strong>Healthy aging support:</strong> antioxidant and plant-nutrient support designed to fit a long-term wellness routine.</li>
          <li><strong>Heart wellness:</strong> moringa has been studied for cardiometabolic markers including blood pressure and lipid-related measures; human evidence is still developing.</li>
          <li><strong>Healthy glucose metabolism:</strong> human research has explored moringa’s relationship with fasting glucose and HbA1c. Findings are promising in some studies but remain preliminary and inconsistent.</li>
          <li><strong>Joint & active-lifestyle support:</strong> its antioxidant plant compounds support normal inflammatory balance and everyday recovery as part of a healthy lifestyle.</li>
          <li><strong>Whole-body wellness:</strong> a simple single-botanical addition for people who want broad plant-based support without another complicated stack.</li>
        </ul>
        <p class="av-moringa-note"><strong>Research note:</strong> Avonent Pure Moringa is a dietary supplement, not a treatment for diabetes, high blood pressure, arthritis, or any other disease. Research into glucose, blood-pressure, and other metabolic outcomes is still emerging.</p>
        <p class="av-moringa-note">†These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.</p>
      `);

      replaceItem(2, 'Recommended Use', `
        <p><strong>Take 2 capsules once daily</strong> with an 8 oz (237 mL) glass of water.</p>
        <p>For best results, the product label recommends taking your serving <strong>20–30 minutes before a meal</strong>, or using it as directed by your healthcare professional. Consistency matters more than timing, so pair it with a routine you can actually keep.</p>
        <p><strong>Important:</strong> Do not exceed the recommended dose. Consult a physician before use if you are pregnant, nursing, under 18, taking medication, or have a medical condition. Because moringa has been studied for glucose and blood-pressure effects, people using medications for either should speak with a healthcare professional before adding it to their routine.</p>
      `);
    }

    // 2) Make the top benefit grid accurate to the Moringa positioning.
    const benefitTexts = [
      'Daily Vitality Support†',
      'Healthy Aging Support†',
      'Heart Wellness Support†',
      'Healthy Glucose Metabolism†',
      'Joint & Active Lifestyle†',
      'Antioxidant Defense†'
    ];
    const benefitGrid = main.querySelector('.avonent-benefits-grid');
    if (benefitGrid) {
      const labels = [...benefitGrid.querySelectorAll('[class*="benefit"], p, span')]
        .filter(el => el.children.length === 0 && el.textContent.trim().length > 2);
      const seen = new Set();
      const candidates = labels.filter(el => {
        const t = el.textContent.trim();
        if (seen.has(t)) return false;
        if (/Wake Up|Feel Stronger|Heart Health|Metabolic Support|Joint Comfort|Antioxidant Defense/.test(t)) {
          seen.add(t); return true;
        }
        return false;
      });
      candidates.slice(0, 6).forEach((el, i) => { if (benefitTexts[i]) el.textContent = benefitTexts[i]; });
    }

    // 3) Blue research / proof section.
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
        ['CLINICAL RESEARCH', '20', 'Clinical studies analyzed in a 2026 systematic review'],
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

    // 4) Week-by-week section: turn guaranteed digestive outcomes into a credible Moringa routine roadmap.
    const journey = main.querySelector('.avonent-wellness-journey');
    if (journey) {
      const eyebrow = journey.querySelector('.avonent-wellness-journey__eyebrow');
      const heading = journey.querySelector('.avonent-wellness-journey__heading');
      const desc = journey.querySelector('.avonent-wellness-journey__description');
      if (eyebrow) eyebrow.textContent = 'BUILD YOUR ROUTINE';
      if (heading) heading.textContent = 'Your first month with Pure Moringa';
      if (desc) desc.innerHTML = '<p>Consistency first. This is a simple routine roadmap—not a promise that everyone feels the same change on the same timeline.</p>';

      const cards = journey.querySelectorAll('.avonent-wellness-journey__card, [class*="journey-step"], article');
      const steps = [
        ['Week 1', 'Start the Ritual', ['Make 2 capsules part of your daily routine', 'Begin consistent plant-based nutrient support', 'Give antioxidant support a regular place in your day']],
        ['Week 2', 'Build Momentum', ['Keep your routine consistent', 'Support everyday vitality and active-lifestyle wellness', 'Pay attention to how your normal energy and recovery feel']],
        ['Week 3', 'Think Whole-Body', ['Continue antioxidant and healthy-aging support', 'Support heart and metabolic wellness as part of a healthy lifestyle', 'Notice your own baseline rather than chasing overnight changes']],
        ['Week 4', 'Make It Your Baseline', ['Decide how Pure Moringa fits your long-term routine', 'Keep consistency simple with one featured botanical', 'Pair your supplement routine with sleep, movement, hydration, and balanced nutrition']]
      ];

      // Cards in this section contain a week label, title and benefit lines. Use text structure rather than brittle IDs.
      const actualCards = [...journey.querySelectorAll('[class*="__card"]')].filter(card => /Week\s*[1-4]/i.test(card.textContent));
      actualCards.slice(0, 4).forEach((card, i) => {
        const step = steps[i];
        const week = [...card.querySelectorAll('*')].find(el => el.children.length === 0 && /Week\s*[1-4]/i.test(el.textContent.trim()));
        const title = card.querySelector('h3, h4, [class*="title"]');
        if (week) week.textContent = step[0];
        if (title) title.textContent = step[1];

        const benefitEls = [...card.querySelectorAll('li, [class*="benefit"]')]
          .filter(el => el.children.length === 0 || el.tagName === 'LI');
        step[2].forEach((text, idx) => {
          if (benefitEls[idx]) benefitEls[idx].textContent = text;
        });
      });
    }

    // 5) The Moringa template still contains the old digestive ingredient breakdown
    // and digestive before/after story. Hide them until dedicated Moringa versions are built.
    main.querySelectorAll('.avonent-formula, .av-ba').forEach(section => {
      const wrapper = section.closest('.shopify-section') || section;
      wrapper.style.display = 'none';
    });
  });
})();
