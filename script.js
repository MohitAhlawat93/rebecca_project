(async() => {
  const header=document.querySelector('[data-header]');
  const onScroll=()=>header?.classList.toggle('is-scrolled',window.scrollY>24);
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});
  const rawPath=(window.location.pathname.replace(/\/$/,'')||'/');
  const LOCALE_PREFIXES={zh:'zh-CN',hi:'hi',fr:'fr',es:'es'};
  const LOCALE_SLUGS={'zh-CN':'zh',hi:'hi',fr:'fr',es:'es'};
  const localizedMatch=rawPath.match(/^\/(zh|hi|fr|es)(?:\/(.*))?$/);
  const routeLocale=localizedMatch?LOCALE_PREFIXES[localizedMatch[1]]:null;
  const currentPath=localizedMatch?('/'+(localizedMatch[2]||'')).replace(/\/$/,'')||'/':rawPath;
  // Phase 7H.1 visual balance and clearer destinations.
  document.body.classList.toggle('favourites-page',currentPath==='/favourites');

  if(currentPath==='/gallery'){
    const panels=[...document.querySelectorAll('.archive-link-panel')];
    const galleryCopy=[
      {label:'Professional gallery',title:'Editorial portraits & polished shoots',body:'Styled portraits, commissioned shoots and Rebecca’s more polished portfolio photography.',cta:'Browse professional gallery',href:'/professional',alt:'Rebecca professional gallery preview',images:[
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/79b7180c-8aeb-4491-9a59-58bff4d2d69e/processed_I62A3592+copy.jpeg',
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/07dae98f-dd47-4faa-b37b-cd2624955ae0/processed__DSC9066.jpeg',
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/aa8270ef-b44f-4140-8de2-7a539c3166ed/processed_REO_0304+copy.jpeg']},
      {label:'Candid gallery',title:'Selfies, travel & everyday moments',body:'Less-produced photographs, selfies and candid moments from Rebecca’s public collection.',cta:'Browse candid gallery',href:'/selfies-of-risquerebecca',alt:'Rebecca candid gallery preview',images:[
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/9b5f9b93-122a-428f-bf1f-cf697df4c4e1/photo_2026-02-28+00.40.18.jpeg',
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/d97fc01e-c8ab-47c0-b6a2-e8aaf2f98534/photo_2026-02-28+00.38.47.jpeg',
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/8e7f0798-c0a2-4b0b-81f1-159427df66da/photo_2026-02-28+00.38.36.jpeg']}
    ];
    panels.slice(0,2).forEach((panel,index)=>{
      const item=galleryCopy[index]; if(!item)return;
      panel.classList.add(index===0?'professional':'candid');
      panel.href=item.href;
      const media=item.images.map((image,imageIndex)=>`<img data-rotating-image class="page-photo-slide${imageIndex===0?' is-active':''}" src="${image}?format=${imageIndex===0?'750':'500'}w" alt="${imageIndex===0?item.alt:''}" loading="lazy" decoding="async" srcset="${image}?format=500w 500w, ${image}?format=750w 750w, ${image}?format=1000w 1000w" sizes="(max-width: 640px) 100vw, 50vw">`).join('');
      panel.innerHTML=`<span class="archive-card-rotator" data-image-rotator>${media}</span><span>${item.label}</span><strong>${item.title}</strong><p>${item.body}</p><em>${item.cta} <b aria-hidden="true">→</b></em>`;
    });
  }

  if(currentPath==='/'&&document.querySelector('.authority-preview-grid')){
    const cards=[...document.querySelectorAll('.authority-preview-card')];
    const previews=[
      {href:'/journal',label:'Journal',title:'Essays, notes & Rebecca in her own words.',body:'Read selected public writing on travel, taste, work, relationships and the things that keep her curious.',cta:'Read the journal',alt:'Rebecca editorial portrait for the Journal',images:[
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/0880df2d-3552-4896-a01e-c4cee47c0b14/_DSC9200-copy.jpg',
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/5123b6bb-49ba-49d0-a517-bd6b0f78f568/_DSC7850-censored.jpg',
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/2380b139-2528-4e3f-993b-10b08b4d8675/_DSC8453-copy.jpg']},
      {href:'/press',label:'Press & appearances',title:'Interviews, profiles & public appearances.',body:'Explore interviews, profiles and independent coverage from Rebecca’s public record.',cta:'View press & appearances',alt:'Rebecca editorial portrait for Press and appearances',images:[
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/2b883ed8-ef4a-42f8-b957-35734cdacf80/_DSC8677-copy.jpg',
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/ede1df29-536a-4398-8511-98d26c3187b8/_DSC8011-copy.jpg',
        'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/2ca283eb-d85a-4d40-9c6e-53b38d339d81/_DSC8859-copy.jpg']}
    ];
    cards.slice(0,2).forEach((card,index)=>{
      const item=previews[index]; if(!item)return;
      card.classList.add('has-image'); card.href=item.href;
      const media=item.images.map((image,imageIndex)=>`<img data-rotating-image class="authority-preview-image${imageIndex===0?' is-active':''}" src="${image}?format=${imageIndex===0?'750':'500'}w" alt="${imageIndex===0?item.alt:''}" loading="lazy" decoding="async" srcset="${image}?format=500w 500w, ${image}?format=750w 750w, ${image}?format=1000w 1000w" sizes="(max-width: 900px) 100vw, 50vw">`).join('');
      card.innerHTML=`<div class="authority-card-rotator" data-image-rotator>${media}</div><span>${item.label}</span><h2>${item.title}</h2><p>${item.body}</p><em>${item.cta} <b aria-hidden="true">→</b></em>`;
    });
  }
  const SEO_LOCALIZED_PATHS=new Set(['/','/about','/rates','/travel','/date-ideas','/favourites','/gallery','/etiquette','/reviews','/journal','/press','/contact']);

  const SUPPORTED_LANGUAGES={
    en:{label:'EN · English',name:'English',htmlLang:'en'},
    'zh-CN':{label:'中文 · 简体中文',name:'简体中文',htmlLang:'zh-CN'},
    hi:{label:'HI · हिंदी',name:'हिंदी',htmlLang:'hi'},
    fr:{label:'FR · Français',name:'Français',htmlLang:'fr'},
    es:{label:'ES · Español',name:'Español',htmlLang:'es'}
  };
  const queryLanguage=new URLSearchParams(window.location.search).get('lang');
  const savedLanguage=(()=>{try{return localStorage.getItem('rr-language')||'en'}catch{return 'en'}})();
  let preferredLanguage=routeLocale||(SUPPORTED_LANGUAGES[queryLanguage]?queryLanguage:null)||(SUPPORTED_LANGUAGES[savedLanguage]?savedLanguage:'en');
  const basePathOf=(pathname)=>{
    const cleaned=(pathname.replace(/\/$/,'')||'/');
    const match=cleaned.match(/^\/(zh|hi|fr|es)(?:\/(.*))?$/);
    return match?('/'+(match[2]||'')).replace(/\/$/,'')||'/':cleaned;
  };
  const localizedHref=(href,language=preferredLanguage)=>{
    if(!href||!href.startsWith('/')) return href;
    const url=new URL(href,window.location.origin);
    const base=basePathOf(url.pathname);
    if(language==='en') return base+(url.search||'')+(url.hash||'');
    if(SEO_LOCALIZED_PATHS.has(base)){
      const slug=LOCALE_SLUGS[language];
      return `/${slug}${base==='/'?'/':base}${url.search||''}${url.hash||''}`;
    }
    const params=new URLSearchParams(url.search);
    params.set('lang',language);
    return base+'?'+params.toString()+(url.hash||'');
  };

  const primaryNavigation=[
    ['/about','About'],
    ['/rates','Rates'],
    ['/travel','Travel'],
    ['/gallery','Gallery'],
    ['/reviews','Reviews'],
    ['/favourites','Favourites']
  ];
  const moreNavigation=[
    ['/date-ideas','Date ideas'],
    ['/etiquette','Etiquette'],
    ['/journal','Journal'],
    ['/press','Press']
  ];
  const footerNavigation=[
    ...primaryNavigation.slice(0,3),
    ['/date-ideas','Date ideas'],
    ['/gallery','Gallery'],
    ['/reviews','Reviews'],
    ['/favourites','Favourites'],
    ['/etiquette','Etiquette'],
    ['/journal','Journal'],
    ['/press','Press'],
    ['/contact','Contact']
  ];
  const linkMarkup=(items)=>items.map(([href,label])=>`<a href="${localizedHref(href)}">${label}</a>`).join('');
  const desktopNav=document.querySelector('.desktop-nav');
  if(desktopNav){
    desktopNav.innerHTML=linkMarkup(primaryNavigation)+`<details class="nav-more"><summary>More</summary><div class="nav-more-menu">${linkMarkup(moreNavigation)}</div></details>`;
  }
  const mobileNav=document.querySelector('.mobile-menu nav');
  if(mobileNav) mobileNav.innerHTML=linkMarkup(footerNavigation);
  document.querySelectorAll('.footer-links').forEach((nav)=>{nav.innerHTML=linkMarkup(footerNavigation);});

  const headerActions=document.querySelector('.header-actions');
  const headerCta=headerActions?.querySelector('.header-cta');
  if(headerActions&&!headerActions.querySelector('[data-language-select]')){
    const languageHtml=`<label class="language-picker"><span class="language-symbol" aria-hidden="true">Aa</span><span class="sr-only">Language</span><select data-language-select aria-label="Choose language">${Object.entries(SUPPORTED_LANGUAGES).map(([code,item])=>`<option value="${code}">${item.label}</option>`).join('')}</select></label>`;
    if(headerCta) headerCta.insertAdjacentHTML('beforebegin',languageHtml);
    else headerActions.insertAdjacentHTML('afterbegin',languageHtml);
    const selector=headerActions.querySelector('[data-language-select]');
    if(selector) selector.value=preferredLanguage;
  }
  document.querySelectorAll('.desktop-nav a,.mobile-menu a,.footer-links a').forEach((link)=>{
    const href=basePathOf((new URL(link.href,window.location.origin)).pathname);
    if(href===currentPath) link.setAttribute('aria-current','page');
  });
  document.querySelectorAll('.nav-more').forEach((menu)=>{
    if(menu.querySelector('a[aria-current="page"]')) menu.classList.add('has-current');
  });
  const rewriteInternalLinks=()=>{
    document.querySelectorAll('a[href^="/"]').forEach((link)=>{
      const raw=link.getAttribute('href');
      if(!raw||raw.startsWith('/api/')) return;
      link.setAttribute('href',localizedHref(raw));
    });
  };
  rewriteInternalLinks();
  setTimeout(rewriteInternalLinks,0);

  const menuToggle=document.querySelector('[data-menu-toggle]');
  const mobileMenu=document.querySelector('[data-mobile-menu]');
  const setMenu=(open)=>{if(!menuToggle||!mobileMenu)return;mobileMenu.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));menuToggle.textContent=open?'Close':'Menu';document.body.classList.toggle('menu-open',open);};
  menuToggle?.addEventListener('click',()=>setMenu(mobileMenu?.hidden??true));
  mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){setMenu(false);if(!document.querySelector('[data-concierge-panel]')?.hidden)setConcierge(false);}});

  const initHeroRotator=()=>{
    const heroRotator=document.querySelector('[data-hero-rotator]');
    if(!heroRotator||heroRotator.dataset.rcRotatorReady==='true'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    heroRotator.dataset.rcRotatorReady='true';

    const slides=[...heroRotator.querySelectorAll('.hero-slide')];
    const fallback=[
      'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/65d6926c-8342-4873-9532-2d809b0dccc1/processed__DSC9552-censored.jpeg',
      'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/43fe8123-bcbe-4a80-88f5-a1f1a063a5fa/_DSC9244-copy.jpg',
      'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/c4bcb8eb-8070-4c6e-95b7-98767443e03d/_DSC7015-copy.jpg',
      'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/309ccac6-1cbe-4065-bc1e-0d139478d446/processed__DSC7889.jpeg'
    ];
    const runtime=window.__REBECCA_IMAGES__?.curated?.hero;
    const source=Array.isArray(runtime)&&runtime.length?runtime:fallback;
    const images=source.map((base,index)=>({
      base,
      alt:index===0?'Rebecca in an editorial portrait':'Rebecca editorial portrait'
    }));
    if(!images.length)return;

    const isSquarespace=(url)=>String(url).includes('images.squarespace-cdn.com');
    const setImage=(img,item)=>{
      img.src=isSquarespace(item.base)?item.base+'?format=1500w':item.base;
      img.srcset=isSquarespace(item.base)
        ? [750,1000,1500,2500].map((w)=>item.base+'?format='+w+'w '+w+'w').join(', ')
        : item.base;
      img.sizes='(max-width: 760px) 100vw, 50vw';
      img.alt=item.alt;
    };

    setImage(slides[0],images[0]);
    if(slides[1])setImage(slides[1],images[Math.min(1,images.length-1)]);

    let activeSlide=0,imageIndex=0,rotating=false;
    const rotate=async()=>{
      if(rotating||document.hidden||images.length<2)return;
      rotating=true;
      const nextImage=(imageIndex+1)%images.length,nextSlide=1-activeSlide,incoming=slides[nextSlide],outgoing=slides[activeSlide];
      if(!incoming||!outgoing){rotating=false;return}
      setImage(incoming,images[nextImage]);
      try{await incoming.decode?.()}catch{}
      incoming.classList.add('is-active');
      outgoing.classList.remove('is-active');
      imageIndex=nextImage;
      activeSlide=nextSlide;
      setTimeout(()=>{rotating=false},1300);
    };
    setInterval(rotate,3000);
  };

  if(document.documentElement.dataset.rebeccaContentReady==='true')initHeroRotator();
  else{
    document.addEventListener('rebecca:content-ready',initHeroRotator,{once:true});
    setTimeout(initHeroRotator,1800);
  }

  // Phase 7H.2 global scroll rail + elegant back-to-top control.
  document.body.insertAdjacentHTML('beforeend','<aside class="page-scroll-rail" data-scroll-rail aria-hidden="true"><span class="page-scroll-track"><i data-scroll-progress></i></span><button type="button" data-scroll-top aria-label="Back to top">↑</button></aside>');
  const scrollRail=document.querySelector('[data-scroll-rail]'),scrollFill=document.querySelector('[data-scroll-progress]'),scrollTopButton=document.querySelector('[data-scroll-top]');
  const updateScrollRail=()=>{
    const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    const ratio=max?Math.min(1,Math.max(0,scrollY/max)):0;
    if(scrollFill)scrollFill.style.height=Math.round(ratio*100)+'%';
    scrollRail?.classList.toggle('is-active',max>320);
    scrollRail?.classList.toggle('has-scrolled',scrollY>260);
  };
  updateScrollRail();
  addEventListener('scroll',updateScrollRail,{passive:true});
  addEventListener('resize',updateScrollRail,{passive:true});
  scrollTopButton?.addEventListener('click',()=>scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));

  const reviews=[...document.querySelectorAll('[data-review]')],counter=document.querySelector('[data-review-count]'); let current=0;
  const showReview=(i)=>{if(!reviews.length)return;current=(i+reviews.length)%reviews.length;reviews.forEach((r,n)=>{r.hidden=n!==current;r.classList.toggle('is-active',n===current)});if(counter)counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(reviews.length).padStart(2,'0')}`;};
  document.querySelector('[data-review-prev]')?.addEventListener('click',()=>showReview(current-1));
  document.querySelector('[data-review-next]')?.addEventListener('click',()=>showReview(current+1)); showReview(0);

  const escapeHtml=(text)=>{const d=document.createElement('div');d.textContent=text;return d.innerHTML};
  const conciergePublicDefaults={
    enabled:true,
    displayName:'Rebecca’s Desk',
    subtitle:'Plans, rates & practicalities.',
    welcome:'Hi ✦ I’m Rebecca’s Desk assistant.',
    defaultIntro:'Ask me about Rebecca’s public rates, travel, etiquette or how to enquire.',
    pausedMessage:'Rebecca’s Desk is taking a short pause. Please use the Contact page for anything time-sensitive.'
  };
  let conciergePublic={...conciergePublicDefaults};
  try{
    const response=await fetch('/api/concierge-config',{headers:{Accept:'application/json'},cache:'no-store'});
    const payload=await response.json();
    if(response.ok&&payload?.config) conciergePublic={...conciergePublicDefaults,...payload.config};
  }catch{
    // Keep the bundled public-safe concierge presentation if owner controls are unavailable.
  }

  const conciergePageConfig={
    '/about':{intro:'I can help you get a quick sense of Rebecca before you read the full page.',prompts:[['At a glance','Tell me about Rebecca in a few lines.'],['Interests','What does Rebecca enjoy talking about?'],['First meeting','What should I know before a first meeting?']]},
    '/reviews':{intro:'I can help you navigate Rebecca’s public review history and reputation.',prompts:[['Recent reviews','What do Rebecca’s recent public reviews say?'],['Review sources','Where are Rebecca’s reviews from?'],['Since 2015','How long has Rebecca been established?']]},
    '/favourites':{intro:'Food, wine, flowers, gifts and little obsessions — ask away.',prompts:[['Food & wine','What food and wine does Rebecca like?'],['Gifts','What gifts does Rebecca like?'],['Date ideas','Suggest a date using Rebecca’s public favourites.']]},
    '/journal':{intro:'I can point you to Rebecca’s public writing and the themes she has written about.',prompts:[['What she writes','What has Rebecca written about?'],['Press','Where has Rebecca appeared in the media?'],['About Rebecca','Tell me about Rebecca.']]},
    '/press':{intro:'I can summarise Rebecca’s public media record and point you to the source pages.',prompts:[['Media record','Where has Rebecca appeared in the media?'],['Reviews','Show me Rebecca’s review history.'],['About Rebecca','Tell me about Rebecca.']]},
    '/rates':{intro:'Tell me the city and duration you have in mind.',prompts:[['Choose a duration','Help me choose a duration for a first meeting.'],['Couples','What are the published terms for couples?'],['Singapore rates',"What are Rebecca's Singapore rates?"]]},
    '/travel':{intro:'Tell me your city and approximate dates. I’ll match the public travel guidance.',prompts:[['Plan my city','I want Rebecca to visit my city. What details do you need?'],['India','What are Rebecca’s India rates?'],['FMTY','Explain Rebecca’s fly-me-to-you minimums.']]},
    '/date-ideas':{intro:'Tell me the mood you want and I’ll use Rebecca’s public preferences.',prompts:[['Food-focused','Suggest a food-focused date using Rebecca’s public preferences.'],['Relaxed','Suggest a relaxed date using Rebecca’s public preferences.'],['Playful','Suggest a playful date using Rebecca’s public preferences.']]},
    '/etiquette':{intro:'I can make the practical rules easier to understand.',prompts:[['Screening','Explain screening simply.'],['Deposits','Explain Rebecca’s deposits.'],['Cancellations','Explain Rebecca’s cancellation policy.']]},
    '/contact':{intro:'I can help turn your details into a complete enquiry.',prompts:[['Draft enquiry','Help me draft a complete enquiry.'],['What to include','What should I include in my enquiry?'],['Screening','How does screening work?']]}
  };
  const conciergeConfig=conciergePageConfig[currentPath]||{intro:conciergePublic.defaultIntro,prompts:[['Singapore rates',"What are Rebecca's Singapore rates?"],['Screening','How does screening work?'],['Travel','Can Rebecca travel to me?']]};
  const conciergeEnabled=conciergePublic.enabled!==false;
  const conciergeIntro=conciergeEnabled?conciergeConfig.intro:conciergePublic.pausedMessage;
  document.body.insertAdjacentHTML('beforeend',`
    <button class="concierge-launcher" type="button" data-open-concierge aria-label="Open ${escapeHtml(conciergePublic.displayName)}" aria-expanded="false" aria-controls="rebecca-concierge"><span class="spark" aria-hidden="true">✦</span><span>${escapeHtml(conciergePublic.displayName)}</span></button>
    <aside class="concierge-panel" id="rebecca-concierge" data-concierge-panel hidden role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="rebecca-concierge-title">
      <div class="concierge-panel-head"><div><strong id="rebecca-concierge-title">${escapeHtml(conciergePublic.displayName)}</strong><small>${escapeHtml(conciergePublic.subtitle)}</small></div><button class="concierge-close" type="button" data-close-concierge aria-label="Close concierge">×</button></div>
      <div class="concierge-thread" data-concierge-thread aria-live="polite"><div class="chat-message assistant"><p>${escapeHtml(conciergePublic.welcome)}</p><p>${escapeHtml(conciergeIntro)}</p></div></div>
      <div class="concierge-chips" data-concierge-chips${conciergeEnabled?'':' hidden'}></div>
      <form class="concierge-form" data-concierge-form${conciergeEnabled?'':' hidden'}><input type="text" maxlength="600" autocomplete="off" placeholder="Ask something discreetly…" aria-label="Message concierge" required><button class="concierge-send" type="submit" aria-label="Send">↗</button></form>
      <p class="concierge-disclaimer">${conciergeEnabled?'Please don’t send ID documents, employer details or other sensitive screening information here. Use Rebecca’s official channels for screening.':'For anything time-sensitive, please use Rebecca’s official Contact page.'}</p>
    </aside>`);

  const panel=document.querySelector('[data-concierge-panel]'),thread=document.querySelector('[data-concierge-thread]'),form=document.querySelector('[data-concierge-form]'),input=form?.querySelector('input'),send=form?.querySelector('[type="submit"]'),chips=document.querySelector('[data-concierge-chips]');let conciergeReturnFocus=null;
  if(conciergeEnabled) conciergeConfig.prompts.forEach(([label,prompt])=>{const button=document.createElement('button');button.className='concierge-chip';button.type='button';button.textContent=label;button.setAttribute('data-chat-prompt',prompt);chips?.appendChild(button);});
  const setConcierge=(open)=>{if(!panel)return;const launcher=document.querySelector('.concierge-launcher');if(open)conciergeReturnFocus=document.activeElement;panel.hidden=!open;panel.setAttribute('aria-hidden',String(!open));launcher?.toggleAttribute('hidden',open);launcher?.setAttribute('aria-expanded',String(open));document.body.classList.toggle('concierge-open',open);if(open&&!window.matchMedia('(max-width: 640px)').matches)setTimeout(()=>input?.focus(),60);else if(!open&&conciergeReturnFocus instanceof HTMLElement)conciergeReturnFocus.focus()};
  document.querySelectorAll('[data-open-concierge]').forEach(b=>b.addEventListener('click',()=>setConcierge(true)));
  document.querySelector('[data-close-concierge]')?.addEventListener('click',()=>setConcierge(false));
  panel?.addEventListener('keydown',(event)=>{if(event.key!=='Tab')return;const focusable=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});


  // First-visit discovery: auto-open Rebecca's Desk once per session and keep Afterhours discoverable.
  const RR_CONCIERGE_AUTO_KEY='rr-concierge-autoshown-v2';
  const safeSessionGet=(key)=>{try{return sessionStorage.getItem(key)}catch{return null}};
  const safeSessionSet=(key,value)=>{try{sessionStorage.setItem(key,value)}catch{}};

  const ensureFirstVisitStyles=()=>{
    if(document.querySelector('[data-first-visit-styles]'))return;
    const style=document.createElement('style');
    style.dataset.firstVisitStyles='true';
    style.textContent=`
      .concierge-panel:not([hidden]){animation:rr-concierge-arrive .34s cubic-bezier(.2,.8,.2,1) both}
      @keyframes rr-concierge-arrive{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      .concierge-launcher{animation:rr-concierge-nudge 5s ease-in-out 2}
      @keyframes rr-concierge-nudge{0%,72%,100%{transform:translateY(0);box-shadow:0 12px 35px rgba(0,0,0,.2)}80%{transform:translateY(-4px);box-shadow:0 16px 42px rgba(0,0,0,.26)}88%{transform:translateY(0)}}
      .afterhours-launcher{position:fixed;z-index:72;left:22px;bottom:22px;display:flex;align-items:center;gap:9px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:var(--wine);color:#fff;padding:8px 14px 8px 8px;box-shadow:0 14px 38px rgba(48,27,30,.24);cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}
      .afterhours-launcher:hover{transform:translateY(-2px);box-shadow:0 18px 46px rgba(48,27,30,.3)}
      .afterhours-launcher .afterhours-spark{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.14);font-size:.8rem}
      .afterhours-launcher .afterhours-copy{display:grid;text-align:left;line-height:1.05}.afterhours-launcher small{font-size:.52rem;letter-spacing:.13em;text-transform:uppercase;opacity:.68}.afterhours-launcher strong{margin-top:3px;font-family:var(--serif);font-size:1rem;font-weight:500}
      .official-links-backdrop{position:fixed;inset:0;z-index:95;display:grid;place-items:center;padding:22px;background:rgba(22,20,18,.34);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity .22s ease}
      .official-links-backdrop.is-visible{opacity:1}
      .official-links-card{position:relative;width:min(470px,100%);max-height:min(680px,calc(100svh - 44px));overflow:auto;border:1px solid rgba(61,51,44,.15);border-radius:30px;background:#f8f3eb;padding:clamp(28px,5vw,42px);box-shadow:0 32px 90px rgba(25,20,17,.28);transform:translateY(12px) scale(.985);transition:transform .28s cubic-bezier(.2,.8,.2,1)}
      .official-links-backdrop.is-visible .official-links-card{transform:translateY(0) scale(1)}
      .official-links-close{position:absolute;top:15px;right:16px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(31,42,37,.07);color:var(--ink);font:300 25px/1 var(--sans);cursor:pointer}
      .official-links-card h2{margin:8px 42px 8px 0;font-family:var(--serif);font-size:clamp(2.35rem,6vw,3.35rem);font-weight:400;line-height:.96;letter-spacing:-.035em}
      .official-links-intro{margin:0 0 22px;max-width:42ch;color:var(--ink-soft);font-size:.84rem;line-height:1.65}
      .official-links-primary{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 19px;border-radius:18px;background:var(--ink);color:var(--white);text-decoration:none;transition:transform .18s ease,background .18s ease}
      .official-links-primary:hover{transform:translateY(-2px);background:var(--wine)}
      .official-links-primary span{display:grid;gap:3px}.official-links-primary small{font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;opacity:.68}.official-links-primary strong{font-family:var(--serif);font-size:1.35rem;font-weight:500}.official-links-primary b{font-size:1.2rem;font-weight:400}
      .official-links-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}
      .official-links-grid a{position:relative;min-height:84px;padding:14px 34px 14px 15px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.46);display:flex;flex-direction:column;justify-content:center;text-decoration:none;transition:background .18s ease,transform .18s ease}
      .official-links-grid a:hover{background:#fff;transform:translateY(-1px)}
      .official-links-grid span{font-size:.76rem;font-weight:600}.official-links-grid small{margin-top:4px;color:var(--ink-soft);font-size:.66rem;overflow-wrap:anywhere}.official-links-grid b{position:absolute;right:13px;top:13px;font-weight:400}
      .official-links-note{margin:16px 2px 0;color:var(--ink-soft);font-size:.64rem;line-height:1.5}
      @media(max-width:640px){
        .concierge-panel{right:10px;bottom:10px;width:calc(100vw - 20px);height:min(560px,calc(100svh - 84px));border-radius:22px 22px 8px 8px;overflow:hidden}
        .afterhours-launcher{left:14px;bottom:14px;padding-right:11px}.afterhours-launcher small{display:none}.afterhours-launcher strong{font-size:.9rem}
        .official-links-backdrop{align-items:end;padding:0;background:rgba(22,20,18,.3)}
        .official-links-card{width:100%;max-height:82svh;border-radius:26px 26px 0 0;border-bottom:0;padding:28px 20px max(24px,env(safe-area-inset-bottom))}
        .official-links-card h2{font-size:2.65rem}
        .official-links-grid{grid-template-columns:1fr 1fr}
      }
      @media(max-width:390px){.official-links-grid{grid-template-columns:1fr}.official-links-grid a{min-height:68px}}
      @media(prefers-reduced-motion:reduce){.concierge-panel:not([hidden]),.concierge-launcher,.official-links-card{animation:none!important;transition:none!important}}
    `;
    document.head.appendChild(style);
  };
  ensureFirstVisitStyles();

  const closeOfficialLinksPopup=()=>{
    const popup=document.querySelector('[data-official-links-popup]');
    if(!popup)return;
    popup.classList.remove('is-visible');
    window.setTimeout(()=>popup.remove(),220);
  };

  const showOfficialLinksPopup=async()=>{
    if(document.querySelector('[data-official-links-popup]'))return;
    if(!panel?.hidden)setConcierge(false);
    let data=window.__REBECCA_DATA__;
    if(!data){
      try{data=(await import('/data/rebecca-data.js')).REBECCA_DATA}catch{return}
    }
    const contact=data?.contact||{};
    const channelUrl=contact.telegramChannelUrl||'https://tinyurl.com/rebecca-afterhours';
    const links=[
      {label:'Telegram',detail:contact.telegramHandle||'@forkmerebecca',href:contact.telegramUrl||'https://t.me/forkmerebecca',external:true},
      {label:'WhatsApp',detail:contact.phoneDisplay||'Official contact',href:contact.whatsappUrl||'https://wa.me/6585282912',external:true},
      {label:'Email',detail:contact.email||'Email Rebecca',href:'mailto:'+(contact.email||'risquerebeccaxo@protonmail.com'),external:false},
      {label:'Favourites',detail:'Wishlist, tastes & date ideas',href:'/favourites',external:false}
    ];
    const popup=document.createElement('div');
    popup.className='official-links-backdrop';
    popup.dataset.officialLinksPopup='true';
    popup.innerHTML=`<aside class="official-links-card" role="dialog" aria-modal="true" aria-labelledby="official-links-title">
      <button class="official-links-close" type="button" data-close-official-links aria-label="Close official links">×</button>
      <span class="page-kicker">Stay close</span>
      <h2 id="official-links-title">Rebecca Afterhours</h2>
      <p class="official-links-intro">Tour notes, new public posts and Rebecca’s verified ways to stay in touch — all in one place.</p>
      <a class="official-links-primary" href="${escapeHtml(channelUrl)}" target="_blank" rel="noopener noreferrer"><span><small>Telegram channel</small><strong>${escapeHtml(contact.telegramChannelLabel||'Rebecca Afterhours')}</strong></span><b aria-hidden="true">↗</b></a>
      <div class="official-links-grid">${links.map((item)=>`<a href="${escapeHtml(item.href)}"${item.external?' target="_blank" rel="noopener noreferrer"':''}><span>${escapeHtml(item.label)}</span><small>${escapeHtml(item.detail)}</small><b aria-hidden="true">↗</b></a>`).join('')}</div>
      <p class="official-links-note">Rebecca’s public site currently lists WhatsApp/iMessage/Signal, Telegram, Rebecca Afterhours and email as official contact routes. Instagram is suspended.</p>
    </aside>`;
    document.body.appendChild(popup);
    requestAnimationFrame(()=>popup.classList.add('is-visible'));
    popup.querySelector('[data-close-official-links]')?.addEventListener('click',closeOfficialLinksPopup);
    popup.addEventListener('click',(event)=>{if(event.target===popup)closeOfficialLinksPopup();});
  };

  const ensureAfterhoursLauncher=()=>{
    if(document.querySelector('[data-afterhours-launcher]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='afterhours-launcher';
    button.dataset.afterhoursLauncher='true';
    button.setAttribute('aria-label','Open Rebecca Afterhours and official links');
    button.innerHTML='<span class="afterhours-spark" aria-hidden="true">✦</span><span class="afterhours-copy"><small>Stay close</small><strong>Afterhours</strong></span>';
    document.body.appendChild(button);
    button.addEventListener('click',showOfficialLinksPopup);
  };

  let firstVisitPromptsStarted=false;
  const startFirstVisitPrompts=()=>{
    if(firstVisitPromptsStarted)return;
    firstVisitPromptsStarted=true;
    ensureAfterhoursLauncher();
    const conciergeAlreadyShown=safeSessionGet(RR_CONCIERGE_AUTO_KEY)==='1';
    if(conciergeEnabled&&!conciergeAlreadyShown){
      window.setTimeout(()=>{
        if(document.hidden){
          firstVisitPromptsStarted=false;
          document.addEventListener('visibilitychange',()=>{if(!document.hidden)startFirstVisitPrompts()},{once:true});
          return;
        }
        safeSessionSet(RR_CONCIERGE_AUTO_KEY,'1');
        setConcierge(true);
      },900);
    }
  };
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape')closeOfficialLinksPopup();});
  if(document.documentElement.dataset.rebeccaContentReady==='true')startFirstVisitPrompts();
  else{
    document.addEventListener('rebecca:content-ready',startFirstVisitPrompts,{once:true});
    window.setTimeout(startFirstVisitPrompts,2200);
  }

  const chatHistory=[];
  const formatChatText=(text='')=>{
    const normalized=String(text)
      .replace(/\\n/g,'\n')
      .replace(/\\\s*\n/g,'\n')
      .replace(/\\([*_-])/g,'$1')
      .replace(/\r\n/g,'\n')
      .trim();
    const safe=escapeHtml(normalized);
    const lines=safe.split('\n');
    const out=[];
    let inList=false;
    const closeList=()=>{if(inList){out.push('</ul>');inList=false;}};
    for(const rawLine of lines){
      const line=rawLine.trim();
      if(!line){closeList();continue;}
      const bullet=line.match(/^[-•]\s+(.*)$/);
      if(bullet){
        if(!inList){out.push('<ul>');inList=true;}
        out.push('<li>'+bullet[1].replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</li>');
        continue;
      }
      closeList();
      out.push('<p>'+line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</p>');
    }
    closeList();
    return out.join('');
  };
  const addMessage=(role,text,extra='')=>{if(!thread)return null;const el=document.createElement('div');el.className=`chat-message ${role} ${extra}`.trim();el.innerHTML=formatChatText(text);thread.appendChild(el);thread.scrollTop=thread.scrollHeight;return el};
  const remember=(role,content)=>{chatHistory.push({role,content:String(content).slice(0,800)});if(chatHistory.length>8)chatHistory.splice(0,chatHistory.length-8);};
  const safeActionHref=(href='')=>/^\/(?!\/)|^https:\/\/(?:wa\.me|t\.me)\/|^mailto:/i.test(href)?href:'';
  const renderChatActions=(actions=[])=>{
    if(!thread||!Array.isArray(actions)||!actions.length)return;
    const wrap=document.createElement('div');wrap.className='chat-actions';
    actions.slice(0,4).forEach((action)=>{
      if(action?.type==='prompt'&&action.prompt){
        const button=document.createElement('button');button.type='button';button.className='chat-action';button.textContent=action.label||'Continue';button.addEventListener('click',()=>askConcierge(action.prompt));wrap.appendChild(button);return;
      }
      if(action?.type==='copy'&&action.text){
        const button=document.createElement('button');button.type='button';button.className='chat-action';button.textContent=action.label||'Copy';button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(action.text);button.textContent='Copied ✓'}catch{button.textContent='Copy unavailable'}});wrap.appendChild(button);return;
      }
      if(action?.type==='link'&&action.href){
        const href=safeActionHref(action.href);if(!href)return;
        const link=document.createElement('a');link.className='chat-action';link.href=href;link.textContent=(action.label||'Open')+' →';
        if(action.external&&/^https:/i.test(href)){link.target='_blank';link.rel='noopener noreferrer'}
        wrap.appendChild(link);
      }
    });
    if(wrap.childElementCount){thread.appendChild(wrap);thread.scrollTop=thread.scrollHeight}
  };
  const I18N_VERSION='7G1';
  const originalTextNodes=new WeakMap();
  const originalAttributes=new WeakMap();

  async function requestTranslations(texts,targetLanguage){
    const source=texts.map((value)=>String(value??''));
    if(!source.length) return [];
    const chunks=[];
    for(let i=0;i<source.length;i+=42) chunks.push(source.slice(i,i+42));
    const results=await Promise.all(chunks.map(async(batch)=>{
      try{
        const response=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:targetLanguage,texts:batch})});
        const payload=await response.json();
        if(!response.ok||!Array.isArray(payload?.translations)||payload.translations.length!==batch.length) throw new Error('translation unavailable');
        return payload.translations;
      }catch{return batch;}
    }));
    return results.flat();
  }

  function collectTranslatablePageContent(){
    const records=[];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const parent=node.parentElement;
        if(!parent) return NodeFilter.FILTER_REJECT;
        if(parent.closest('script,style,noscript,select,option,.language-picker,.chat-message.user')) return NodeFilter.FILTER_REJECT;
        if(routeLocale===preferredLanguage&&parent.closest('[data-i18n-static]')) return NodeFilter.FILTER_REJECT;
        const value=(originalTextNodes.get(node)??node.nodeValue??'').trim();
        if(value.length<2||!/[A-Za-zÀ-ÿ\u0400-\u04FF\u0900-\u097F\u4E00-\u9FFF]/.test(value)) return NodeFilter.FILTER_REJECT;
        if(!originalTextNodes.has(node)) originalTextNodes.set(node,node.nodeValue||'');
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while((node=walker.nextNode())){
      const raw=originalTextNodes.get(node)||node.nodeValue||'';
      records.push({type:'text',node,raw,source:raw.trim()});
    }
    document.querySelectorAll('input[placeholder],textarea[placeholder],[aria-label]').forEach((element)=>{
      if(element.closest('.language-picker,.chat-message.user')) return;
      let originals=originalAttributes.get(element);
      if(!originals){originals={};originalAttributes.set(element,originals);}
      for(const attr of ['placeholder','aria-label']){
        if(!element.hasAttribute(attr)) continue;
        if(!(attr in originals)) originals[attr]=element.getAttribute(attr)||'';
        const source=(originals[attr]||'').trim();
        if(source.length<2||!/[A-Za-zÀ-ÿ\u0400-\u04FF\u0900-\u097F\u4E00-\u9FFF]/.test(source)) continue;
        records.push({type:'attr',element,attr,raw:originals[attr],source});
      }
    });
    return records;
  }

  async function applyLanguage(language){
    if(!SUPPORTED_LANGUAGES[language]) language='en';
    preferredLanguage=language;
    try{localStorage.setItem('rr-language',language)}catch{}
    document.documentElement.lang=SUPPORTED_LANGUAGES[language].htmlLang;
    document.body.dataset.language=language;
    const selector=document.querySelector('[data-language-select]');
    if(selector) selector.value=language;
    const picker=selector?.closest('.language-picker');
    picker?.classList.add('is-loading');
    const records=collectTranslatablePageContent();
    if(language==='en'){
      records.forEach((record)=>{if(record.type==='text')record.node.nodeValue=record.raw;else record.element.setAttribute(record.attr,record.raw);});
      picker?.classList.remove('is-loading');return;
    }
    const unique=[...new Set(records.map((record)=>record.source))];
    const cacheKey=`rr-i18n:${I18N_VERSION}:${language}`;
    let cache={};try{cache=JSON.parse(localStorage.getItem(cacheKey)||'{}')||{}}catch{}
    const applyMap=()=>records.forEach((record)=>{
      const translated=cache[record.source]||record.source;
      if(record.type==='text'){const leading=record.raw.match(/^\s*/)?.[0]||'';const trailing=record.raw.match(/\s*$/)?.[0]||'';record.node.nodeValue=leading+translated+trailing;}
      else record.element.setAttribute(record.attr,translated);
    });
    applyMap();
    const missing=unique.filter((source)=>!cache[source]);
    if(missing.length){
      const translated=await requestTranslations(missing,language);
      missing.forEach((source,index)=>{cache[source]=translated[index]||source;});
      try{localStorage.setItem(cacheKey,JSON.stringify(cache))}catch{}
      applyMap();
    }
    picker?.classList.remove('is-loading');
  }

  document.querySelector('[data-language-select]')?.addEventListener('change',(event)=>{
    const language=event.target.value;
    try{localStorage.setItem('rr-language',language)}catch{}
    if(SEO_LOCALIZED_PATHS.has(currentPath)){window.location.href=localizedHref(currentPath,language);return;}
    applyLanguage(language);
  });
  if(!routeLocale&&preferredLanguage!=='en'&&SEO_LOCALIZED_PATHS.has(currentPath)) window.location.replace(localizedHref(currentPath,preferredLanguage));
  else if(preferredLanguage!=='en') setTimeout(()=>applyLanguage(preferredLanguage),35);

  async function localizeConciergePayload(data){
    const answer=String(data?.answer||'');
    const actions=Array.isArray(data?.actions)?data.actions.map((item)=>({...item})):[];
    const suggestion=data?.suggestion?{...data.suggestion}:null;
    if(preferredLanguage==='en') return {answer,actions,suggestion};
    const labels=[answer,...actions.map((item)=>String(item.label||'')),suggestion?.label||''];
    const translated=await requestTranslations(labels,preferredLanguage);
    let cursor=0;
    const localizedAnswer=translated[cursor++]||answer;
    actions.forEach((item)=>{const value=translated[cursor++];if(value)item.label=value;});
    if(suggestion){const value=translated[cursor++];if(value)suggestion.label=value;}
    return {answer:localizedAnswer,actions,suggestion};
  }

  async function askConcierge(message,displayMessage=message){
    const q=message.trim();if(!q)return;
    const visibleMessage=String(displayMessage||message).trim()||q;
    addMessage('user',visibleMessage);
    let normalizedQuestion=q;
    if(preferredLanguage!=='en'&&displayMessage===message){
      const translated=await requestTranslations([q],'en');
      normalizedQuestion=translated[0]||q;
    }
    remember('user',normalizedQuestion);
    const pending=addMessage('assistant','Just a moment ✦','pending');
    if(input)input.disabled=true;if(send)send.disabled=true;
    try{
      const r=await fetch('/api/concierge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:normalizedQuestion,history:chatHistory.slice(0,-1),page:currentPath,language:preferredLanguage})});
      const data=await r.json();if(!r.ok)throw new Error(data?.error||'Concierge unavailable');
      pending?.remove();
      const localized=await localizeConciergePayload(data);
      addMessage('assistant',localized.answer);
      remember('assistant',data.answer);
      renderChatActions(localized.actions);
      if(localized.suggestion?.path){const link=document.createElement('a');link.className='chat-suggestion';link.href=localized.suggestion.path;link.textContent=localized.suggestion.label+' →';thread?.appendChild(link);if(thread)thread.scrollTop=thread.scrollHeight}
    }catch{
      pending?.remove();
      let errorMessage='I’m having a little trouble right now. Try again in a moment, or use Rebecca’s official contact page.';
      if(preferredLanguage!=='en') errorMessage=(await requestTranslations([errorMessage],preferredLanguage))[0]||errorMessage;
      addMessage('assistant',errorMessage,'error');remember('assistant','I’m having a little trouble right now. Try again in a moment, or use Rebecca’s official contact page.')
    }finally{
      if(send)send.disabled=false;
      if(input){input.disabled=false;input.value='';if(!window.matchMedia('(max-width: 640px)').matches)input.focus()}
    }
  }
  form?.addEventListener('submit',e=>{e.preventDefault();if(input)askConcierge(input.value)});

  async function hydrateNewsletter(){
    const forms=[...document.querySelectorAll('[data-newsletter-form]')];if(!forms.length)return;
    let configured=false;try{const response=await fetch('/api/newsletter',{headers:{Accept:'application/json'}});const payload=await response.json();configured=Boolean(payload?.configured)}catch{}
    forms.forEach((newsletterForm)=>{
      const status=newsletterForm.querySelector('[data-newsletter-status]'),button=newsletterForm.querySelector('button[type="submit"]');
      newsletterForm.dataset.configured=String(configured);
      if(!configured){if(button){button.disabled=true;button.textContent='Email list coming soon'}if(status)status.textContent='Provider connection is ready; account details still need to be added. Rebecca Afterhours remains available below.'}
      else{if(button){button.disabled=false;button.textContent='Join updates'}if(status)status.textContent='Low-volume updates. You can unsubscribe through the newsletter provider at any time.'}
    });
  }
  setTimeout(hydrateNewsletter,0);
  window.addEventListener('load',hydrateNewsletter,{once:true});
  document.addEventListener('submit',async(event)=>{
    const newsletterForm=event.target.closest?.('[data-newsletter-form]');if(!newsletterForm)return;event.preventDefault();
    const status=newsletterForm.querySelector('[data-newsletter-status]'),button=newsletterForm.querySelector('button[type="submit"]');
    if(newsletterForm.dataset.configured!=='true'){if(status)status.textContent='The email-list provider is not connected yet. Please use Rebecca Afterhours for now.';return}
    const formData=new FormData(newsletterForm);if(button)button.disabled=true;if(status)status.textContent='Joining…';
    try{
      const response=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:formData.get('firstName'),lastName:formData.get('lastName'),email:formData.get('email'),locale:preferredLanguage,sourcePath:window.location.pathname})});
      const payload=await response.json();if(!response.ok||!payload?.ok)throw new Error(payload?.error||payload?.message||'Unable to join');
      newsletterForm.reset();if(status)status.textContent=payload.message||'You’re on the list.';
    }catch(error){if(status)status.textContent=error.message||'The email list is temporarily unavailable.'}
    finally{if(button)button.disabled=false}
  });
  document.querySelectorAll('[data-chat-prompt]').forEach(b=>b.addEventListener('click',()=>{const prompt=b.getAttribute('data-chat-prompt')||'';askConcierge(prompt,b.textContent||prompt)}));


  const galleryImages=[...document.querySelectorAll('.archive-gallery-grid img,.selfie-archive-grid img')];
  if(galleryImages.length){
    document.body.insertAdjacentHTML('beforeend',`
      <div class="gallery-lightbox" data-gallery-lightbox hidden role="dialog" aria-modal="true" aria-label="Photo viewer">
        <button class="gallery-lightbox-close" type="button" data-gallery-close aria-label="Close photo viewer">×</button>
        <button class="gallery-lightbox-prev" type="button" data-gallery-prev aria-label="Previous photo">←</button>
        <img class="gallery-lightbox-image" data-gallery-image alt="">
        <button class="gallery-lightbox-next" type="button" data-gallery-next aria-label="Next photo">→</button>
        <div class="gallery-lightbox-count" data-gallery-count></div>
      </div>`);
    const lightbox=document.querySelector('[data-gallery-lightbox]');
    const lightboxImage=lightbox?.querySelector('[data-gallery-image]');
    const lightboxCount=lightbox?.querySelector('[data-gallery-count]');
    const lightboxClose=lightbox?.querySelector('[data-gallery-close]');
    let galleryIndex=0;
    let galleryReturnFocus=null;
    const renderGallery=()=>{
      const source=galleryImages[galleryIndex];
      if(!source||!lightboxImage)return;
      lightboxImage.src=source.currentSrc||source.src;
      lightboxImage.alt=source.alt||'Rebecca photograph';
      if(lightboxCount)lightboxCount.textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(galleryImages.length).padStart(2,'0')}`;
    };
    const openGallery=(index)=>{
      galleryIndex=(index+galleryImages.length)%galleryImages.length;
      galleryReturnFocus=document.activeElement;
      renderGallery();
      lightbox.hidden=false;
      document.body.classList.add('gallery-lightbox-open');
      lightboxClose?.focus();
    };
    const closeGallery=()=>{
      if(!lightbox||lightbox.hidden)return;
      lightbox.hidden=true;
      document.body.classList.remove('gallery-lightbox-open');
      if(galleryReturnFocus instanceof HTMLElement)galleryReturnFocus.focus();
    };
    const stepGallery=(delta)=>{galleryIndex=(galleryIndex+delta+galleryImages.length)%galleryImages.length;renderGallery();};
    galleryImages.forEach((img,index)=>{
      const figure=img.closest('figure');
      if(!figure)return;
      figure.tabIndex=0;
      figure.setAttribute('role','button');
      figure.setAttribute('aria-label',`Open ${img.alt||'Rebecca photograph'} full screen`);
      figure.addEventListener('click',()=>openGallery(index));
      figure.addEventListener('keydown',(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openGallery(index)}});
    });
    lightbox?.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>stepGallery(-1));
    lightbox?.querySelector('[data-gallery-next]')?.addEventListener('click',()=>stepGallery(1));
    lightboxClose?.addEventListener('click',closeGallery);
    lightbox?.addEventListener('click',(event)=>{if(event.target===lightbox)closeGallery()});
    document.addEventListener('keydown',(event)=>{
      if(!lightbox||lightbox.hidden)return;
      if(event.key==='Escape')closeGallery();
      if(event.key==='ArrowLeft')stepGallery(-1);
      if(event.key==='ArrowRight')stepGallery(1);
    });
  }

  const getRebeccaData=async()=>window.__REBECCA_DATA__||(await import('/data/rebecca-data.js')).REBECCA_DATA;

  const enquiry=document.querySelector('[data-enquiry-form]');
  if(enquiry){const status=enquiry.querySelector('[data-form-status]');const build=()=>{const d=new FormData(enquiry);return ['Hello Rebecca,','','I’d like to introduce myself and enquire about a date.','',`Name / alias: ${d.get('name')||''}`,`Current city: ${d.get('city')||''}`,`Preferred date / window: ${d.get('date')||''}`,`Preferred duration: ${d.get('duration')||''}`,`Location / travel request: ${d.get('location')||''}`,`New or returning: ${d.get('relationship')||''}`,`Screening route I can provide privately: ${d.get('screening')||''}`,'',`Note: ${d.get('note')||''}`,'','I understand screening details and ID documents should be sent privately through Rebecca’s official channel, not through this website form.'].join('\n')};
    enquiry.querySelector('[data-email-enquiry]')?.addEventListener('click',async()=>{if(!enquiry.reportValidity())return;const data=await getRebeccaData();window.location.href=`mailto:${data.contact.email}?subject=${encodeURIComponent('Date enquiry for Risqué Rebecca')}&body=${encodeURIComponent(build())}`});
    enquiry.querySelector('[data-whatsapp-enquiry]')?.addEventListener('click',async()=>{if(!enquiry.reportValidity())return;const data=await getRebeccaData();window.open(data.contact.whatsappUrl+'?text='+encodeURIComponent(build()),'_blank','noopener,noreferrer')});
    enquiry.querySelector('[data-copy-enquiry]')?.addEventListener('click',async()=>{if(!enquiry.reportValidity())return;try{await navigator.clipboard.writeText(build());if(status)status.textContent='Enquiry copied. Paste it into Rebecca’s verified WhatsApp, Telegram or email.'}catch{if(status)status.textContent='Copy was blocked by your browser. Use the email button instead.'}});
  }
  // Phase 7H editorial motion: restrained reveals, slow crossfades and desktop-only parallax.
  const initEditorialMotion=()=>{
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealItems=[...document.querySelectorAll('[data-reveal]')].filter((el)=>!el.dataset.motionReady);
    revealItems.forEach((el)=>{el.dataset.motionReady='true';});
    if(reducedMotion){revealItems.forEach((el)=>el.classList.add('is-visible'));}
    else if('IntersectionObserver' in window){
      const observer=new IntersectionObserver((entries)=>entries.forEach((entry)=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.18,rootMargin:'0px 0px -8%'});
      revealItems.forEach((el)=>observer.observe(el));
    }else revealItems.forEach((el)=>el.classList.add('is-visible'));
    if(reducedMotion)return;
    document.querySelectorAll('[data-image-rotator]').forEach((rotator)=>{
      if(rotator.dataset.rotationReady)return;
      rotator.dataset.rotationReady='true';
      const slides=[...rotator.querySelectorAll('[data-rotating-image]')];
      if(slides.length<2)return;
      let active=Math.max(0,slides.findIndex((slide)=>slide.classList.contains('is-active')));
      setInterval(async()=>{
        if(document.hidden)return;
        const next=(active+1)%slides.length,incoming=slides[next];
        try{if(!incoming.complete)await incoming.decode?.();}catch{}
        slides[active].classList.remove('is-active');
        incoming.classList.add('is-active');
        active=next;
      },3000);
    });
    if(!window.__rrParallaxBound&&window.matchMedia('(min-width: 900px)').matches){
      const parallax=[...document.querySelectorAll('[data-parallax]')];
      if(parallax.length){window.__rrParallaxBound=true;let ticking=false;const paint=()=>{const mid=innerHeight/2;parallax.forEach((el)=>{const r=el.parentElement?.getBoundingClientRect();if(!r)return;const d=((r.top+r.height/2)-mid)/innerHeight;el.style.transform=`translate3d(0,${Math.max(-18,Math.min(18,-d*16))}px,0)`;});ticking=false;};addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(paint);ticking=true;}},{passive:true});paint();}
    }
  };
  initEditorialMotion();
  document.addEventListener('rebecca:content-ready',initEditorialMotion,{once:true});

})();