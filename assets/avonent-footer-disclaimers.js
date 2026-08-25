(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  ready(() => {
    const footer = document.querySelector('.avonent-footer');
    if (!footer) return;

    const disclaimer = footer.querySelector('.avonent-footer__disclaimer');
    if (!disclaimer) return;

    disclaimer.innerHTML = `
      <div class="avonent-footer__disclaimer-heading">Supplement &amp; Results Disclaimers</div>
      <div class="avonent-footer__disclaimer-list" aria-label="Supplement disclaimers">
        <div class="avonent-footer__disclaimer-row" id="avonent-disclaimer-fda" tabindex="-1">
          <span class="avonent-footer__disclaimer-symbol" aria-hidden="true">†</span>
          <p>These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.</p>
        </div>
        <div class="avonent-footer__disclaimer-row" id="avonent-disclaimer-results" tabindex="-1">
          <span class="avonent-footer__disclaimer-symbol" aria-hidden="true">*</span>
          <p>Individual results may vary. Testimonials, reviews, and wellness timelines reflect individual experiences or illustrative routines and are not guaranteed outcomes.</p>
        </div>
        <div class="avonent-footer__disclaimer-row" id="avonent-disclaimer-medical" tabindex="-1">
          <span class="avonent-footer__disclaimer-symbol" aria-hidden="true">‡</span>
          <p>Consult a qualified healthcare professional before starting any dietary supplement, especially if you are pregnant, nursing, taking medication, or have a medical condition.</p>
        </div>
      </div>
    `;

    if (!document.getElementById('avonent-footer-disclaimer-styles')) {
      const style = document.createElement('style');
      style.id = 'avonent-footer-disclaimer-styles';
      style.textContent = `
        .avonent-footer__disclaimer {
          max-width: 980px !important;
          padding: 34px 0 30px !important;
          text-align: left !important;
        }
        .avonent-footer__disclaimer-heading {
          margin-bottom: 16px !important;
          text-align: center;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: .12em !important;
          text-transform: uppercase;
          color: var(--av-footer-accent) !important;
        }
        .avonent-footer__disclaimer-list {
          display: grid;
          gap: 0;
          border: 1px solid var(--av-footer-border);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(255,255,255,.025);
        }
        .avonent-footer__disclaimer-row {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 12px;
          align-items: start;
          padding: 14px 16px;
          scroll-margin-top: 110px;
          border-bottom: 1px solid var(--av-footer-border);
          transition: background .2s ease, border-color .2s ease;
        }
        .avonent-footer__disclaimer-row:last-child { border-bottom: 0; }
        .avonent-footer__disclaimer-row:target,
        .avonent-footer__disclaimer-row.avonent-disclaimer--highlight {
          background: color-mix(in srgb, var(--av-footer-accent) 11%, transparent);
        }
        .avonent-footer__disclaimer-symbol {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border: 1px solid color-mix(in srgb, var(--av-footer-accent) 55%, transparent);
          border-radius: 50%;
          color: var(--av-footer-accent);
          font: 800 16px/1 var(--font-body--family);
        }
        .avonent-footer__disclaimer-row p {
          margin: 2px 0 0 !important;
          color: var(--av-footer-muted);
          font: 400 12px/1.58 var(--font-body--family);
        }
        .avonent-claim-marker {
          margin-left: 2px;
          font-size: .68em;
          font-weight: 800;
          line-height: 0;
          vertical-align: super;
        }
        .avonent-claim-marker a {
          color: inherit;
          text-decoration: none;
          border-bottom: 0;
        }
        .avonent-claim-marker a:hover { color: #02c6ea; }
        @media screen and (max-width: 749px) {
          .avonent-footer__disclaimer {
            padding: 26px 0 !important;
          }
          .avonent-footer__disclaimer-list { border-radius: 12px; }
          .avonent-footer__disclaimer-row {
            grid-template-columns: 28px minmax(0, 1fr);
            gap: 10px;
            padding: 13px 12px;
          }
          .avonent-footer__disclaimer-symbol {
            width: 26px;
            height: 26px;
            font-size: 14px;
          }
          .avonent-footer__disclaimer-row p {
            font-size: 11px;
            line-height: 1.55;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#avonent-disclaimer-"]');
      if (!link) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      setTimeout(() => {
        target.classList.add('avonent-disclaimer--highlight');
        setTimeout(() => target.classList.remove('avonent-disclaimer--highlight'), 1800);
      }, 350);
    });
  });
})();
