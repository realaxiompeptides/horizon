(function(){
  var realStoriesReviews = [
    {
      rating: '4.8',
      title: 'My energy feels steadier without adding another coffee',
      body: 'By mid-afternoon I used to feel completely drained. After keeping Pure Moringa in my morning routine for a few weeks, my days started feeling more even and I was not reaching for another coffee as often. I also like getting a nutrient-dense botanical and antioxidant support in two simple capsules.',
      tag1: 'Daily Energy',
      tag2: 'Antioxidant Support'
    },
    {
      rating: '4.9',
      title: 'My joints feel better supported on training days',
      body: 'I am active most days, and recovery matters more to me than it used to. Since I started taking Pure Moringa consistently, movement feels easier and my joints feel better supported after workouts and long days on my feet. The capsules are simple, and the quality feels much better than the cheap moringa powders I have tried.',
      tag1: 'Joint Comfort',
      tag2: 'Active Recovery'
    },
    {
      rating: '5.0',
      title: 'This is the kind of healthy-aging support I wanted',
      body: 'I wanted one simple plant-based supplement that covered more than one box. Pure Moringa fits my routine for healthy aging, metabolic wellness, antioxidant support, and everyday immune nutrition without making me keep a cabinet full of bottles. It is easy to take, feels premium, and is one of the few supplements I actually remember every day.',
      tag1: 'Healthy Aging',
      tag2: 'Metabolic Wellness'
    }
  ];

  var bottomReviews = [
    {
      rating: '5.0',
      title: 'The afternoon crash is what I noticed first',
      body: 'I started Pure Moringa because I wanted something simple and plant-based instead of another complicated supplement stack. After staying consistent, my energy felt steadier through the afternoon and I was not leaning on coffee as much. The capsules are easy to take, the formula feels clean and straightforward, and this is one I actually want to keep in my routine.',
      tag1: 'Steady Energy',
      tag2: 'Clean Formula'
    },
    {
      rating: '4.9',
      title: 'My movement feels better supported',
      body: 'At this point I pay a lot more attention to how my joints and recovery feel after workouts and long days. After making Pure Moringa part of my routine, I started noticing that movement felt easier and I did not feel as beat up after active days. I like that it gives me plant-based support without adding another complicated powder or drink.',
      tag1: 'Joint Comfort',
      tag2: 'Active Lifestyle'
    },
    {
      rating: '5.0',
      title: 'Exactly what I wanted for healthy aging',
      body: 'I am trying to be proactive about how I feel as I get older, so the antioxidant and nutrient profile is what caught my attention. I like having one simple Moringa habit that supports healthy aging, everyday resilience, and immune nutrition. After a few weeks of being consistent, I just felt more on top of my routine and more like I was doing something useful for myself every day.',
      tag1: 'Healthy Aging',
      tag2: 'Antioxidants'
    },
    {
      rating: '4.8',
      title: 'One simple habit for whole-body wellness',
      body: 'I originally looked at Moringa for metabolic and heart-wellness support, but I ended up liking how broad the routine feels. Energy, antioxidant support, healthy aging, and overall wellness all matter to me, and I would rather stay consistent with one quality botanical than keep buying a different bottle for every goal. Two capsules is easy enough that I actually stick with it.',
      tag1: 'Metabolic Wellness',
      tag2: 'Daily Vitality'
    },
    {
      rating: '4.9',
      title: 'This feels like a premium Moringa, not cheap green powder',
      body: 'I have bought inexpensive moringa before and never stayed with it. Avonent feels completely different. The capsules are clean and easy to take, the bottle and label are straightforward, and I like the focus on quality and testing. It fits into my morning in seconds, and I am getting the plant nutrition and antioxidant support I wanted without mixing another greens powder.',
      tag1: 'Premium Quality',
      tag2: 'Easy Routine'
    }
  ];

  function ensureStyles(){
    if(document.getElementById('avonent-moringa-review-polish-styles')) return;
    var style=document.createElement('style');
    style.id='avonent-moringa-review-polish-styles';
    style.textContent=`
      main[data-template*="product.moringa"] .av-moringa-journey-cta-wrap{
        width:min(100%,600px);margin:22px auto 0;display:flex;flex-direction:column;align-items:center;gap:10px;
      }
      main[data-template*="product.moringa"] .av-moringa-journey-cta{
        width:100%;min-height:54px;display:flex;align-items:center;justify-content:center;gap:14px;
        padding:14px 22px;border-radius:14px;background:#02c6ea;color:#07181d;text-decoration:none;
        font-size:16px;font-weight:850;line-height:1.1;box-shadow:0 10px 28px rgba(2,198,234,.16);
        transition:transform .18s ease,box-shadow .18s ease,background .18s ease;
      }
      main[data-template*="product.moringa"] .av-moringa-journey-cta svg{width:20px;height:20px;flex:0 0 auto}
      main[data-template*="product.moringa"] .av-moringa-journey-guarantee{
        display:flex;align-items:center;justify-content:center;gap:7px;color:#526168;font-size:12px;font-weight:700;text-align:center;
      }
      main[data-template*="product.moringa"] .av-moringa-journey-guarantee svg{width:17px;height:17px;color:#02c6ea;flex:0 0 auto}
      main[data-template*="product.moringa"] .avonent-reviews__date{display:none!important}
      @media(hover:hover){
        main[data-template*="product.moringa"] .av-moringa-journey-cta:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(2,198,234,.22)}
      }
      @media(max-width:749px){
        main[data-template*="product.moringa"] .av-moringa-journey-cta-wrap{width:100%;margin-top:18px;gap:9px}
        main[data-template*="product.moringa"] .av-moringa-journey-cta{min-height:52px;border-radius:13px;font-size:15px}
        main[data-template*="product.moringa"] .av-moringa-journey-guarantee{font-size:11.5px}
      }
    `;
    document.head.appendChild(style);
  }

  function addJourneyCTA(){
    var main=document.querySelector('main[data-template*="product.moringa"]');
    if(!main) return;
    main.querySelectorAll('.avonent-journey').forEach(function(section){
      var header=section.querySelector('.avonent-journey__header');
      if(!header || header.querySelector('.av-moringa-journey-cta-wrap')) return;
      var wrap=document.createElement('div');
      wrap.className='av-moringa-journey-cta-wrap';
      wrap.innerHTML=`
        <a class="av-moringa-journey-cta" href="#avonent-bottom-offer">
          <span>Start My Journey</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
        <div class="av-moringa-journey-guarantee">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.8-2.9 8-7 10-4.1-2-7-5.2-7-10V6l7-3Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>30-day money-back guarantee</span>
        </div>`;
      header.appendChild(wrap);
    });
  }

  function setText(el,text){if(el) el.textContent=text;}

  function polishRealStories(root){
    if(!root) return;
    var heading=root.querySelector('.avrs__heading');
    var subheading=root.querySelector('.avrs__subheading');
    setText(heading,'Pure Moringa stories. Different reasons people keep it.');
    setText(subheading,'Illustrative review examples for layout testing — replace with verified customer feedback before publishing.');

    root.querySelectorAll('[data-avrs-card]').forEach(function(card,index){
      var review=realStoriesReviews[index % realStoriesReviews.length];
      setText(card.querySelector('.avrs__rating-number'),review.rating);
      var stars=card.querySelector('.avrs__card-stars');
      if(stars) stars.setAttribute('aria-label','Rated '+review.rating+' out of 5');
      setText(card.querySelector('.avrs__review-title'),review.title);
      setText(card.querySelector('.avrs__review-copy'),review.body);
      var tags=card.querySelectorAll('.avrs__tags span');
      if(tags[0]) tags[0].textContent=review.tag1;
      if(tags[1]) tags[1].textContent=review.tag2;
      var verified=card.querySelector('.avrs__verified span');
      if(verified) verified.textContent='Example Review';
    });
  }

  function polishBottomReviews(section){
    if(!section) return;
    setText(section.querySelector('.avonent-reviews__eyebrow'),'PURE MORINGA REVIEW EXAMPLES');
    setText(section.querySelector('.avonent-reviews__heading'),'Why people keep Pure Moringa in their routine.');
    var desc=section.querySelector('.avonent-reviews__description');
    if(desc) desc.innerHTML='<p>Illustrative review examples for layout testing — replace with verified customer feedback before publishing.</p>';
    var trust=section.querySelector('.avonent-reviews__trust-line');
    if(trust){
      var trusted=trust.querySelectorAll('span');
      var strong=trust.querySelector('strong');
      if(strong) strong.textContent='Example review layout';
      trusted.forEach(function(el){
        if(!el.classList.contains('avonent-reviews__trust-stars') && !el.classList.contains('avonent-reviews__trust-divider')) el.textContent='';
      });
      var divider=trust.querySelector('.avonent-reviews__trust-divider');
      if(divider) divider.style.display='none';
    }

    section.querySelectorAll('.avonent-reviews__card').forEach(function(card,index){
      var review=bottomReviews[index % bottomReviews.length];
      setText(card.querySelector('.avonent-reviews__card-title'),review.title);
      var copy=card.querySelector('.avonent-reviews__card-copy');
      if(copy) copy.textContent=review.body;
      var ratingText=card.querySelector('.avonent-reviews__card-rating > span:last-child');
      if(ratingText) ratingText.textContent=review.rating;
      var stars=card.querySelector('.avonent-reviews__card-stars');
      if(stars) stars.setAttribute('aria-label','Rated '+review.rating+' out of 5');
      var tags=card.querySelectorAll('.avonent-reviews__tags span');
      if(tags[0]) tags[0].textContent=review.tag1;
      if(tags[1]) tags[1].textContent=review.tag2;
      var verified=card.querySelector('.avonent-reviews__verified span:not(.avonent-reviews__date)');
      if(verified) verified.textContent='Example Review';
    });
  }

  function hideDuplicateRealStories(){
    var roots=Array.from(document.querySelectorAll('[data-avrs]'));
    roots.forEach(function(root,index){
      var wrapper=root.closest('.shopify-section') || root;
      wrapper.style.display=index===0?'':'none';
    });
  }

  function init(){
    if(!document.querySelector('main[data-template*="product.moringa"]')) return;
    ensureStyles();
    addJourneyCTA();
    hideDuplicateRealStories();
    document.querySelectorAll('[data-avrs]').forEach(polishRealStories);
    document.querySelectorAll('.avonent-reviews').forEach(polishBottomReviews);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

  document.addEventListener('shopify:section:load',function(){window.setTimeout(init,0)});
  document.addEventListener('shopify:section:reorder',function(){window.setTimeout(init,0)});
})();
