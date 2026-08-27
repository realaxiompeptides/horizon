(function(){
  function polishRealStories(root){
    if(!root || root.dataset.avrsPolished==='true') return;
    root.dataset.avrsPolished='true';

    var ratings=['4.8','4.9','5.0'];
    root.querySelectorAll('[data-avrs-card]').forEach(function(card,index){
      var number=card.querySelector('.avrs__rating-number');
      var stars=card.querySelector('.avrs__card-stars');
      var rating=ratings[index % ratings.length];
      if(number) number.textContent=rating;
      if(stars) stars.setAttribute('aria-label','Rated '+rating+' out of 5');
    });
  }

  function init(){
    document.querySelectorAll('[data-avrs]').forEach(polishRealStories);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

  document.addEventListener('shopify:section:load',init);
})();
