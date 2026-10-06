(() => {
  const header=document.querySelector('[data-header]');
  const onScroll=()=>header?.classList.toggle('is-scrolled',window.scrollY>24);
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});
  const currentPath=(window.location.pathname.replace(/\/$/,'')||'/');

  const SUPPORTED_LANGUAGES={
    en:{label:'EN',name:'English',htmlLang:'en'},
    'zh-CN':{label:'中文',name:'简体中文',htmlLang:'zh-CN'},
    hi:{label:'हिंदी',name:'हिंदी',htmlLang:'hi'},
    fr:{label:'FR',name:'Français',htmlLang:'fr'},
    es:{label:'ES',name:'Español',htmlLang:'es'}
  };
  const savedLanguage=(()=>{try{return localStorage.getItem('rr-language')||'en'}catch{return 'en'}})();
  let preferredLanguage=SUPPORTED_LANGUAGES[savedLanguage]?savedLanguage:'en';

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
  const linkMarkup=(items)=>items.map(([href,label])=>`<a href="${href}">${label}</a>`).join('');
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
    const href=(new URL(link.href,window.location.origin)).pathname.replace(/\/$/,'')||'/';
    if(href===currentPath) link.setAttribute('aria-current','page');
  });
  document.querySelectorAll('.nav-more').forEach((menu)=>{
    if(menu.querySelector('a[aria-current="page"]')) menu.classList.add('has-current');
  });

  const menuToggle=document.querySelector('[data-menu-toggle]');
  const mobileMenu=document.querySelector('[data-mobile-menu]');
  const setMenu=(open)=>{if(!menuToggle||!mobileMenu)return;mobileMenu.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));menuToggle.textContent=open?'Close':'Menu';document.body.classList.toggle('menu-open',open);};
  menuToggle?.addEventListener('click',()=>setMenu(mobileMenu?.hidden??true));
  mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){setMenu(false);if(!document.querySelector('[data-concierge-panel]')?.hidden)setConcierge(false);}});

  const reviews=[...document.querySelectorAll('[data-review]')],counter=document.querySelector('[data-review-count]'); let current=0;
  const showReview=(i)=>{if(!reviews.length)return;current=(i+reviews.length)%reviews.length;reviews.forEach((r,n)=>{r.hidden=n!==current;r.classList.toggle('is-active',n===current)});if(counter)counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(reviews.length).padStart(2,'0')}`;};
  document.querySelector('[data-review-prev]')?.addEventListener('click',()=>showReview(current-1));
  document.querySelector('[data-review-next]')?.addEventListener('click',()=>showReview(current+1)); showReview(0);

  const escapeHtml=(text)=>{const d=document.createElement('div');d.textContent=text;return d.innerHTML};
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
  const conciergeConfig=conciergePageConfig[currentPath]||{intro:'Ask me about Rebecca’s public rates, travel, etiquette or how to enquire.',prompts:[['Singapore rates',"What are Rebecca's Singapore rates?"],['Screening','How does screening work?'],['Travel','Can Rebecca travel to me?']]};
  document.body.insertAdjacentHTML('beforeend',`
    <button class="concierge-launcher" type="button" data-open-concierge aria-label="Open Rebecca's concierge" aria-expanded="false" aria-controls="rebecca-concierge"><span class="spark" aria-hidden="true">✦</span><span>Private concierge</span></button>
    <aside class="concierge-panel" id="rebecca-concierge" data-concierge-panel hidden role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="rebecca-concierge-title">
      <div class="concierge-panel-head"><div><strong id="rebecca-concierge-title">Rebecca’s Private Concierge</strong><small>Plans, rates & practicalities.</small></div><button class="concierge-close" type="button" data-close-concierge aria-label="Close concierge">×</button></div>
      <div class="concierge-thread" data-concierge-thread aria-live="polite"><div class="chat-message assistant"><p>Hi ✦ I’m Rebecca’s concierge.</p><p>${escapeHtml(conciergeConfig.intro)}</p></div></div>
      <div class="concierge-chips" data-concierge-chips></div>
      <form class="concierge-form" data-concierge-form><input type="text" maxlength="600" autocomplete="off" placeholder="Ask something discreetly…" aria-label="Message Rebecca's concierge" required><button class="concierge-send" type="submit" aria-label="Send">↗</button></form>
      <p class="concierge-disclaimer">Please don’t send ID documents, employer details or other sensitive screening information here. Use Rebecca’s official channels for screening.</p>
    </aside>`);

  const panel=document.querySelector('[data-concierge-panel]'),thread=document.querySelector('[data-concierge-thread]'),form=document.querySelector('[data-concierge-form]'),input=form?.querySelector('input'),send=form?.querySelector('[type="submit"]'),chips=document.querySelector('[data-concierge-chips]');let conciergeReturnFocus=null;
  conciergeConfig.prompts.forEach(([label,prompt])=>{const button=document.createElement('button');button.className='concierge-chip';button.type='button';button.textContent=label;button.setAttribute('data-chat-prompt',prompt);chips?.appendChild(button);});
  const setConcierge=(open)=>{if(!panel)return;const launcher=document.querySelector('.concierge-launcher');if(open)conciergeReturnFocus=document.activeElement;panel.hidden=!open;panel.setAttribute('aria-hidden',String(!open));launcher?.toggleAttribute('hidden',open);launcher?.setAttribute('aria-expanded',String(open));document.body.classList.toggle('concierge-open',open);if(open&&!window.matchMedia('(max-width: 640px)').matches)setTimeout(()=>input?.focus(),60);else if(!open&&conciergeReturnFocus instanceof HTMLElement)conciergeReturnFocus.focus()};
  document.querySelectorAll('[data-open-concierge]').forEach(b=>b.addEventListener('click',()=>setConcierge(true)));
  document.querySelector('[data-close-concierge]')?.addEventListener('click',()=>setConcierge(false));
  panel?.addEventListener('keydown',(event)=>{if(event.key!=='Tab')return;const focusable=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
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
  const I18N_VERSION='7F1';
  const originalTextNodes=new WeakMap();
  const originalAttributes=new WeakMap();

  async function requestTranslations(texts,targetLanguage){
    const source=texts.map((value)=>String(value??''));
    if(!source.length) return [];
    const translated=[];
    for(let i=0;i<source.length;i+=60){
      const batch=source.slice(i,i+60);
      try{
        const response=await fetch('/api/translate',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({language:targetLanguage,texts:batch})
        });
        const payload=await response.json();
        if(!response.ok||!Array.isArray(payload?.translations)||payload.translations.length!==batch.length) throw new Error('translation unavailable');
        translated.push(...payload.translations);
      }catch{
        translated.push(...batch);
      }
    }
    return translated;
  }

  function collectTranslatablePageContent(){
    const records=[];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const parent=node.parentElement;
        if(!parent) return NodeFilter.FILTER_REJECT;
        if(parent.closest('script,style,noscript,select,option,.language-picker,.chat-message.user')) return NodeFilter.FILTER_REJECT;
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
      records.forEach((record)=>{
        if(record.type==='text') record.node.nodeValue=record.raw;
        else record.element.setAttribute(record.attr,record.raw);
      });
      picker?.classList.remove('is-loading');
      return;
    }

    const unique=[...new Set(records.map((record)=>record.source))];
    let translations=null;
    const cacheKey=`rr-i18n:${I18N_VERSION}:${language}:${currentPath}`;
    try{
      const cached=JSON.parse(sessionStorage.getItem(cacheKey)||'null');
      if(cached&&JSON.stringify(cached.source)===JSON.stringify(unique)&&Array.isArray(cached.translations)) translations=cached.translations;
    }catch{}
    if(!translations){
      translations=await requestTranslations(unique,language);
      try{sessionStorage.setItem(cacheKey,JSON.stringify({source:unique,translations}))}catch{}
    }
    const map=new Map(unique.map((source,index)=>[source,translations[index]||source]));
    records.forEach((record)=>{
      const translated=map.get(record.source)||record.source;
      if(record.type==='text'){
        const leading=record.raw.match(/^\s*/)?.[0]||'';
        const trailing=record.raw.match(/\s*$/)?.[0]||'';
        record.node.nodeValue=leading+translated+trailing;
      }else{
        record.element.setAttribute(record.attr,translated);
      }
    });
    picker?.classList.remove('is-loading');
  }

  document.querySelector('[data-language-select]')?.addEventListener('change',(event)=>applyLanguage(event.target.value));
  if(preferredLanguage!=='en') setTimeout(()=>applyLanguage(preferredLanguage),80);

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
})();