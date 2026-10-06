import { REBECCA_DATA, formatSgd } from './data/rebecca-data.js';
import { REBECCA_IMAGES, imageVariant, imageSrcset } from './data/rebecca-images.js';

const esc=(value='')=>String(value)
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'",'&#039;');

const setText=(selector,value)=>{
  document.querySelectorAll(selector).forEach((el)=>{el.textContent=value;});
};

async function hydrateRuntimeData(){
  try{
    const response=await fetch('/api/public-content',{
      method:'GET',
      headers:{Accept:'application/json'},
      cache:'no-store'
    });
    if(!response.ok) return;
    const payload=await response.json();
    if(!payload?.data||typeof payload.data!=='object') return;
    Object.entries(payload.data).forEach(([key,value])=>{REBECCA_DATA[key]=value;});
  }catch{
    // Keep bundled canonical data as the safe fallback.
  }
}

function mediaPreviewMode(){
  const params=new URLSearchParams(window.location.search);
  const flag=params.get('rc_preview');
  if(flag==='1'){
    sessionStorage.setItem('rc-media-preview','1');
    return true;
  }
  if(flag==='0'){
    sessionStorage.removeItem('rc-media-preview');
    return false;
  }
  return sessionStorage.getItem('rc-media-preview')==='1';
}

function applyRuntimeMediaState(state){
  if(!state?.library||!state?.placements)return;
  const byId=new Map(state.library.map((item)=>[item.id,item]));
  Object.entries(state.placements).forEach(([key,ids])=>{
    if(!Array.isArray(ids))return;
    const urls=ids.map((id)=>byId.get(id)?.url).filter(Boolean);
    if(urls.length)REBECCA_IMAGES.curated[key]=urls;
  });
}

function renderDraftPreviewBanner(){
  if(document.querySelector('[data-rc-preview-banner]'))return;
  const banner=document.createElement('div');
  banner.className='rc-preview-banner';
  banner.dataset.rcPreviewBanner='true';
  banner.innerHTML='<strong>Rebecca Control preview</strong><span>Draft media · not live</span><button type="button" data-exit-rc-preview>Exit preview</button>';
  document.body.prepend(banner);
  document.body.classList.add('has-rc-preview-banner');
  banner.querySelector('[data-exit-rc-preview]')?.addEventListener('click',()=>{
    sessionStorage.removeItem('rc-media-preview');
    const url=new URL(window.location.href);
    url.searchParams.delete('rc_preview');
    window.location.href=url.pathname+url.search+url.hash;
  });
}

async function hydrateRuntimeMedia(){
  const preview=mediaPreviewMode();
  try{
    const response=await fetch('/api/media-content'+(preview?'?preview=1':''),{
      method:'GET',
      headers:{Accept:'application/json'},
      credentials:'same-origin',
      cache:'no-store'
    });
    if(!response.ok){
      if(preview&&response.status===401)sessionStorage.removeItem('rc-media-preview');
      return;
    }
    const payload=await response.json();
    applyRuntimeMediaState(payload?.state);
    window.__REBECCA_MEDIA__=payload?.state||null;
    if(preview)renderDraftPreviewBanner();
  }catch{
    // Existing curated images remain the safe fallback.
  }
}

function renderAvailability(){
  const availability=REBECCA_DATA.availability||{
    status:'accepting',
    label:'Accepting enquiries',
    message:'Currently accepting enquiries.'
  };
  document.querySelectorAll('[data-availability-status]').forEach((el)=>{
    el.dataset.status=availability.status||'accepting';
    el.innerHTML=`<span class="availability-dot" aria-hidden="true"></span><span>${esc(availability.label||'Availability')}</span>`;
    el.setAttribute('title',availability.message||availability.label||'Availability');
  });
}

function renderProfile(){
  const p=REBECCA_DATA.profile;
  setText('[data-profile-established]',p.establishedSince);
  setText('[data-profile-countries]',p.countriesVisited);
  setText('[data-profile-base-eyebrow]',`${p.base}-based + globally chased professional sweetheart`);

  document.querySelectorAll('[data-profile-hero-meta]').forEach((el)=>{
    el.innerHTML=[
      p.base,
      p.languages.join(' + '),
      `${p.countriesVisited} countries`
    ].map((value)=>`<span>${esc(value)}</span>`).join('');
  });

  document.querySelectorAll('[data-profile-home-facts]').forEach((el)=>{
    el.innerHTML=p.homeFacts.map((item)=>`<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('');
  });

  document.querySelectorAll('[data-profile-about-facts]').forEach((el)=>{
    el.innerHTML=p.aboutFacts.map((item)=>`<div class="fact-card"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join('');
  });

  document.querySelectorAll('[data-profile-fragments]').forEach((el)=>{
    el.innerHTML=p.fragments.map((item)=>`<article class="fragment-card"><span>${esc(item.label)}</span><p>${esc(item.value)}</p></article>`).join('');
  });

  document.querySelectorAll('[data-profile-faq]').forEach((el)=>{
    el.innerHTML=p.faq.map((item,index)=>`<details${index===0?' open':''}><summary>${esc(item.question)}</summary><div class="detail-body"><p>${esc(item.answer)}</p></div></details>`).join('');
  });
}

function singaporeTermRows(){
  const sg=REBECCA_DATA.singapore;
  return [
    ['Extensions',`SGD ${sg.extensionPerHour.toLocaleString('en-US')} per additional hour, subject to availability.`],
    ['Long private dates',`For dates of ${sg.terms.longPrivate.minHours} hours or longer where you prefer complete privacy, add a flat SGD ${sg.terms.longPrivate.surcharge.toLocaleString('en-US')} and please include room service.`],
    ['Hosting in Singapore',`Hosting starts from SGD ${sg.terms.hosting.from.toLocaleString('en-US')} with a ${sg.terms.hosting.minHours}-hour minimum. In Singapore, hosting is occasional and reserved for ${sg.terms.hosting.eligibility}.`],
    ['Couples',`Two-hour minimum. Please add SGD ${sg.terms.couples.surcharge.toLocaleString('en-US')}.`],
    ['Phone call before booking',`A ${sg.terms.phoneCall.minutes}-minute call is SGD ${sg.terms.phoneCall.fee.toLocaleString('en-US')}. Screening is required.${sg.terms.phoneCall.creditTowardBooking?' The amount can be credited toward the booking.':''}`],
    ['Bespoke additions',`Enhanced experiences are discussed privately and typically begin from +SGD ${sg.terms.bespokeAdditionsFrom.toLocaleString('en-US')} above standard rates.`]
  ];
}

function renderSingapore(){
  const sg=REBECCA_DATA.singapore;

  document.querySelectorAll('[data-singapore-rates]').forEach((el)=>{
    el.innerHTML=sg.rates.filter((rate)=>rate.visible!==false).map((rate)=>`
      <article class="rate-card${rate.featured?' featured':''}">
        <small>${esc(rate.category)}</small>
        <div>
          <h3>${esc(rate.label)}</h3>
          <div class="price">${esc(rate.display||formatSgd(rate.amount))}</div>
          <p>${esc(rate.note)}</p>
        </div>
      </article>`).join('');
  });

  document.querySelectorAll('[data-singapore-terms]').forEach((el)=>{
    el.innerHTML=singaporeTermRows().map(([title,body],index)=>`
      <details${index===0?' open':''}>
        <summary>${esc(title)}</summary>
        <div class="detail-body"><p>${esc(body)}</p></div>
      </details>`).join('');
  });

  const asia=REBECCA_DATA.travel.fmty.find((item)=>item.id==='selected-asia');
  document.querySelectorAll('[data-asia-promo]').forEach((el)=>{
    el.innerHTML=`
      <p>For ${esc(asia.destinations.join(', '))}, the current Asia promotion minimum is ${esc(asia.minimum)}.</p>
      <p>For other destinations and the current touring calendar, see the travel page.</p>
      <a class="button button-outline" href="/travel">Travel & touring →</a>`;
  });
}

function renderTravel(){
  const travel=REBECCA_DATA.travel;

  document.querySelectorAll('[data-travel-calendar]').forEach((el)=>{
    const cards=travel.calendar.filter((item)=>item.visible!==false).map((item)=>`
      <article class="travel-card${item.alt?' alt':''}">
        <div>
          <p class="page-kicker" style="color:${item.alt?'#d7ddd2':'#aeb8a7'}">${esc(item.kicker)}</p>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.body)}</p>
        </div>
        <div class="travel-meta">${item.meta.map((value)=>`<span>${esc(value)}</span>`).join('')}</div>
      </article>`).join('');
    el.innerHTML=`<div class="travel-board">${cards}</div><div class="notice" style="margin-top:18px">${esc(travel.northAmericaNotice)}</div>`;
  });

  document.querySelectorAll('[data-fmty-grid]').forEach((el)=>{
    const rows=travel.fmty.map((item)=>`<div class="fact-card"><span>${esc(item.label)}</span><strong>${esc(item.minimum)}</strong></div>`).join('');
    el.innerHTML=rows+
      `<div class="fact-card"><span>Comfort</span><strong>${esc(travel.comfort)}</strong></div>`+
      `<div class="fact-card"><span>Public dates</span><strong>${esc(travel.publicDatesNote)}</strong></div>`;
  });

  document.querySelectorAll('[data-touring-rates]').forEach((el)=>{
    el.innerHTML=Object.entries(travel.touringRates).map(([name,set],index)=>{
      const line=[set.minimum,...set.items.map(([duration,price])=>`${duration} — ${price}`),`Extensions: ${set.extension}`].filter(Boolean).join(' · ');
      return `<details${index===0?' open':''}><summary>${esc(name)}</summary><div class="detail-body"><p>${esc(line)}.</p></div></details>`;
    }).join('');
  });

  document.querySelectorAll('[data-travel-side-trips]').forEach((el)=>{
    const labels={londonToUkEurope:'From London → Greater UK / major Europe',hongKongToChinaJapanKorea:'From Hong Kong → China / Japan / Korea',domesticUsa:'Domestic USA',domesticChina:'Domestic China',domesticIndia:'Domestic India',indiaToSriLankaMaldives:'India → Sri Lanka / Maldives',domesticAustralia:'Domestic Australia',australiaToOceania:'Australia → other Oceania'};
    el.innerHTML=Object.entries(travel.tourSideMinimums).map(([key,value])=>`<article class="side-trip-card"><span>${esc(labels[key]||key)}</span><strong>${esc(value)}</strong></article>`).join('');
  });

  document.querySelectorAll('[data-travel-practicalities]').forEach((el)=>{
    el.innerHTML=travel.practicalities.map((paragraph)=>`<p>${esc(paragraph)}</p>`).join('');
  });
}

function renderPolicies(){
  const policies=REBECCA_DATA.policies;

  document.querySelectorAll('[data-screening-policy]').forEach((el)=>{
    el.innerHTML=policies.screening.paragraphs.map((paragraph)=>`<p>${esc(paragraph)}</p>`).join('')+
      `<div class="notice">${esc(policies.screening.conciergeNotice)}</div>`;
  });

  document.querySelectorAll('[data-deposit-grid]').forEach((el)=>{
    el.innerHTML=policies.deposits.map((item)=>`<div class="fact-card"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join('');
  });

  document.querySelectorAll('[data-cancellation-policy]').forEach((el)=>{
    el.innerHTML=policies.cancellations.map((item,index)=>`
      <details${index===0?' open':''}><summary>${esc(item.title)}</summary><div class="detail-body"><p>${esc(item.body)}</p></div></details>`).join('');
  });

  document.querySelectorAll('[data-boundaries-policy]').forEach((el)=>{
    el.innerHTML=policies.boundaries.map((paragraph)=>`<p>${esc(paragraph)}</p>`).join('');
  });

  document.querySelectorAll('[data-etiquette-more]').forEach((el)=>{
    el.innerHTML=policies.expanded.map((item,index)=>`<details${index===0?' open':''}><summary>${esc(item.title)}</summary><div class="detail-body"><p>${esc(item.body)}</p></div></details>`).join('');
  });
}


function renderPersonality(){
  const p=REBECCA_DATA.profile;

  document.querySelectorAll('[data-profile-philosophy]').forEach((el)=>{
    el.innerHTML=`
      <span>${esc(p.philosophy.label)}</span>
      <h2>${esc(p.philosophy.title)}</h2>
      <p>${esc(p.philosophy.body)}</p>`;
  });

  document.querySelectorAll('[data-profile-interview]').forEach((el)=>{
    el.innerHTML=p.interview.map((item,index)=>`
      <details${index===0?' open':''}>
        <summary>${esc(item.question)}</summary>
        <div class="detail-body"><p>${esc(item.answer)}</p></div>
      </details>`).join('');
  });
}

function renderReputation(){
  const reputation=REBECCA_DATA.reputation;

  document.querySelectorAll('[data-reputation-proof]').forEach((el)=>{
    el.innerHTML=reputation.proofPoints.map((item)=>`
      <article class="trust-proof-card">
        <span>${esc(item.label)}</span>
        <strong>${esc(item.value)}</strong>
        <p>${esc(item.note)}</p>
      </article>`).join('');
  });

  document.querySelectorAll('[data-reputation-reviews]').forEach((el)=>{
    const years=[...new Set(reputation.reviews.map((review)=>review.year))].sort((a,b)=>b-a);
    el.innerHTML=years.map((year)=>{
      const items=reputation.reviews.filter((review)=>review.year===year).map((review)=>`
        <article class="review-item">
          <p class="review-copy${review.type==='excerpt'?' quoted':''}">${esc(review.excerpt)}</p>
          <footer>${esc(review.source)} · ${esc(review.date)}</footer>
        </article>`).join('');
      return `<section class="review-year"><div class="review-year-label">${year}</div><div class="review-year-grid">${items}</div></section>`;
    }).join('');
  });

  document.querySelectorAll('[data-home-trust]').forEach((el)=>{
    el.innerHTML=reputation.proofPoints.map((item)=>`
      <div class="home-trust-item">
        <span>${esc(item.label)}</span>
        <strong>${esc(item.value)}</strong>
      </div>`).join('');
  });
}

function renderDateIdeas(){
  document.querySelectorAll('[data-date-categories]').forEach((el)=>{
    el.innerHTML=REBECCA_DATA.dateIdeas.categories.map((item)=>`
      <article class="taste-card">
        <span>${esc(item.label)}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.body)}</p>
        <div class="taste-notes">${item.notes.map((note)=>`<small>${esc(note)}</small>`).join('')}</div>
      </article>`).join('');
  });

  document.querySelectorAll('[data-wishlist-categories]').forEach((el)=>{
    el.innerHTML=REBECCA_DATA.wishlist.categories.map((item)=>`
      <article class="wishlist-card">
        <span>${esc(item.label)}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.body)}</p>
      </article>`).join('');
  });

  document.querySelectorAll('[data-wishlist-details]').forEach((el)=>{
    el.innerHTML=REBECCA_DATA.wishlist.details.map((group,index)=>`
      <details${index===0?' open':''}>
        <summary>${esc(group.title)}</summary>
        <div class="detail-body detail-chips">${group.items.map((item)=>`<span>${esc(item)}</span>`).join('')}</div>
      </details>`).join('');
  });

  document.querySelectorAll('[data-wishlist-links]').forEach((el)=>{
    el.innerHTML=`<a class="button button-outline" href="${esc(REBECCA_DATA.wishlist.throneUrl)}" target="_blank" rel="noreferrer">View Rebecca’s Throne wishlist ↗</a>`;
  });
}

function renderAuthority(){
  document.querySelectorAll('[data-press-appearances]').forEach((el)=>{
    el.innerHTML=REBECCA_DATA.press.appearances.map((item)=>`<article class="authority-card"><span>${esc(item.outlet)} · ${esc(item.year)}</span><h3>${esc(item.title)}</h3><p>${esc(item.note)}</p><a class="inline-link" href="${esc(item.url)}" target="_blank" rel="noreferrer">Read source <span aria-hidden="true">↗</span></a></article>`).join('');
  });
  document.querySelectorAll('[data-journal-entries]').forEach((el)=>{
    el.innerHTML=REBECCA_DATA.journal.entries.map((item)=>`<article class="journal-card"><span>${esc(item.outlet)} · ${esc(item.year)}</span><h3>${esc(item.title)}</h3><p>${esc(item.note)}</p><a class="inline-link" href="${esc(item.url)}" target="_blank" rel="noreferrer">Read the original <span aria-hidden="true">↗</span></a></article>`).join('');
  });
  document.querySelectorAll('[data-updates-card]').forEach((el)=>{
    const n=REBECCA_DATA.newsletter;
    el.innerHTML=`
      <p class="page-kicker">Stay in the loop</p>
      <h2>${esc(n.title)}</h2>
      <p>${esc(n.body)}</p>
      <form class="newsletter-form" data-newsletter-form>
        <div class="newsletter-name-row">
          <label><span>First name</span><input name="firstName" autocomplete="given-name" maxlength="80" placeholder="First name"></label>
          <label><span>Last name</span><input name="lastName" autocomplete="family-name" maxlength="80" placeholder="Last name (optional)"></label>
        </div>
        <label><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="180" placeholder="you@example.com" required></label>
        <button class="button button-dark" type="submit">Join updates</button>
        <p class="newsletter-status" data-newsletter-status aria-live="polite">Checking email-list connection…</p>
      </form>
      <p class="newsletter-privacy">${esc(n.privacy)}</p>
      <a class="inline-link newsletter-fallback" href="${esc(n.fallbackUrl)}" target="_blank" rel="noreferrer">Or join ${esc(n.fallbackLabel)} <span aria-hidden="true">↗</span></a>`;
  });
}


function renderFavourites(){
  const w=REBECCA_DATA.wishlist;
  const p=REBECCA_DATA.profile;
  const card=(label,title,items)=>`<article class="favourite-card"><span>${esc(label)}</span><h3>${esc(title)}</h3><div class="favourite-tags">${items.map((item)=>`<span>${esc(item)}</span>`).join('')}</div></article>`;

  document.querySelectorAll('[data-favourites-table]').forEach((el)=>{
    el.innerHTML=[
      card('Eat','At the table',w.food),
      card('Champagne','Bubbles worth opening',w.champagneHouses),
      card('Wine','Regions & curiosities',w.wineInterests),
      card('Pour','Beyond wine',w.drinks)
    ].join('');
  });

  document.querySelectorAll('[data-favourites-things]').forEach((el)=>{
    el.innerHTML=[
      card('Wear','Lingerie & details',[...w.lingerie,...w.fashion]),
      card('Flowers','Soft colours, big gestures',w.flowers),
      card('Experience','Useful indulgences',w.giftCards),
      card('Keepsake','Jewellery',[w.jewellery])
    ].join('');
  });

  document.querySelectorAll('[data-favourites-interests]').forEach((el)=>{
    el.innerHTML=p.interests.map((item)=>`<span>${esc(item)}</span>`).join('');
  });
}

function rotatingImagesMarkup(images,role,alt){
  return images.map((url,index)=>'<img data-rotating-image class="page-photo-slide'+(index===0?' is-active':'')+'" src="'+esc(imageVariant(url,index===0?1000:750))+'" srcset="'+esc(imageSrcset(url,[500,750,1000,1500]))+'" sizes="100vw" alt="'+(index===0?esc(alt):'')+'" loading="'+(index===0?'eager':'lazy')+'" decoding="async" data-image-role="'+esc(role)+'">').join('');
}

function renderPagePhotoHeroes(){
  const raw=(window.location.pathname.replace(/\/$/,'')||'/');
  const path=raw.replace(/^\/(zh|hi|fr|es)(?=\/|$)/,'')||'/';
  const sets={
    '/favourites':{key:'favouritesHero',role:'favourites-hero',alt:'Rebecca editorial portrait for Food & Favourites'},
    '/journal':{key:'journal',role:'journal-hero',alt:'Rebecca editorial portrait for the Journal'},
    '/press':{key:'press',role:'press-hero',alt:'Rebecca editorial portrait for Press and appearances'}
  };
  const cfg=sets[path],hero=document.querySelector('.page-hero');
  if(!cfg||!hero||hero.querySelector('[data-page-photo-hero]'))return;
  const images=REBECCA_IMAGES.curated[cfg.key]||[];
  if(images.length<2)return;
  hero.classList.add('page-hero-photo');
  hero.insertAdjacentHTML('afterbegin','<div class="page-photo-rotator" data-page-photo-hero data-image-rotator>'+rotatingImagesMarkup(images,cfg.role,cfg.alt)+'</div>');
}

function renderPageEditorialRotators(){
  const raw=(window.location.pathname.replace(/\/$/,'')||'/');
  const path=raw.replace(/^\/(zh|hi|fr|es)(?=\/|$)/,'')||'/';
  const key=path==='/about'?'aboutFeature':path.slice(1);
  const images=REBECCA_IMAGES.curated[key]||[];
  if(images.length<2)return;
  document.querySelectorAll('.page-editorial-shot').forEach((figure)=>{
    if(figure.dataset.imageRotatorReady)return;
    figure.dataset.imageRotatorReady='true';
    figure.setAttribute('data-image-rotator','');
    figure.innerHTML=rotatingImagesMarkup(images,'page-editorial','Rebecca editorial portrait');
  });
}

function renderGalleryCardRotators(){
  const raw=(window.location.pathname.replace(/\/$/,'')||'/');
  const path=raw.replace(/^\/(zh|hi|fr|es)(?=\/|$)/,'')||'/';
  if(path!=='/gallery')return;
  [
    {selector:'.archive-link-panel.professional',key:'galleryProfessional',alt:'Rebecca professional gallery preview'},
    {selector:'.archive-link-panel.candid',key:'galleryCandid',alt:'Rebecca candid gallery preview'}
  ].forEach(({selector,key,alt})=>{
    const card=document.querySelector(selector),images=REBECCA_IMAGES.curated[key]||[];
    if(!card||images.length<2||card.querySelector('[data-gallery-card-rotator]'))return;
    card.insertAdjacentHTML('afterbegin','<span class="archive-card-rotator" data-gallery-card-rotator data-image-rotator>'+rotatingImagesMarkup(images,'gallery-choice',alt)+'</span>');
  });
}

function renderEditorialBreaks(){
  const config={
    '/about':{key:'about',kicker:'A pause',title:'Curiosity makes better company.',body:'A beautiful room is a bonus. A conversation that keeps wandering is what makes an evening memorable.',anchor:'[data-profile-interview]',placement:'after',rotate:true},
    '/reviews':{key:'reviews',kicker:'Since 2015',title:'A reputation built slowly.',body:'Trust is more convincing when it accumulates over years rather than arriving as a marketing claim.',anchor:'[data-reputation-reviews]',placement:'before',rotate:true},
    '/travel':{key:'travel',kicker:'Somewhere else',title:'Bring me somewhere worth staying.',body:'A different city changes the rhythm. The invitation matters more when the destination has a point of view.',anchor:'[data-fmty-grid]',placement:'before',rotate:true},
    '/favourites':{key:'favourites',kicker:'Taste',title:'Good taste is part of the conversation.',body:'The table, the bottle, the room and the small details are all part of how a date feels.',anchor:'[data-favourites-things]',placement:'before',rotate:true},
    '/date-ideas':{key:'dateIdeas',kicker:'After dinner',title:'Make dinner the beginning.',body:'A good date has texture: something to taste, somewhere to wander, something neither of us needs to rush.',anchor:'[data-wishlist-categories]',placement:'before',rotate:true},
    '/etiquette':{key:'etiquette',kicker:'Discretion',title:'Privacy is part of the luxury.',body:'Clear expectations make everything else easier, warmer and considerably more relaxed.',anchor:'[data-etiquette-more]',placement:'before',rotate:true}
  };
  const raw=(window.location.pathname.replace(/\/$/,'')||'/');
  const path=raw.replace(/^\/(zh|hi|fr|es)(?=\/|$)/,'')||'/';
  const item=config[path];
  if(!item||document.querySelector(`[data-editorial-break="${item.key}"]`))return;
  const section=document.querySelector(item.anchor)?.closest('section');
  if(!section)return;
  const images=(REBECCA_IMAGES.curated[item.key]||REBECCA_IMAGES.curated.hero||[]).slice(0,item.rotate?3:1);
  const el=document.createElement('section');
  el.className='editorial-motion-break';el.dataset.editorialBreak=item.key;el.setAttribute('aria-label','Rebecca editorial interlude');
  const media=images.map((url,index)=>`<img data-rotating-image class="editorial-motion-slide${index===0?' is-active':''}" src="${esc(imageVariant(url,1000))}" srcset="${esc(imageSrcset(url,[500,750,1000,1500]))}" sizes="100vw" alt="Rebecca editorial portrait" loading="lazy" decoding="async" data-image-role="editorial-motion">`).join('');
  el.innerHTML=`<div class="editorial-motion-media${item.rotate?' is-rotating':''}" ${item.rotate?'data-image-rotator data-editorial-rotator':''} data-parallax>${media}</div><div class="editorial-motion-copy" data-reveal><p class="page-kicker">${esc(item.kicker)}</p><h2>${esc(item.title)}</h2><p>${esc(item.body)}</p></div>`;
  if(item.placement==='after')section.insertAdjacentElement('afterend',el);else section.insertAdjacentElement('beforebegin',el);
}

function renderContact(){
  const contact=REBECCA_DATA.contact;
  const policies=REBECCA_DATA.policies;

  document.querySelectorAll('[data-contact-channels]').forEach((el)=>{
    el.innerHTML=`
      <div class="contact-channel"><span>WhatsApp / iMessage / Signal</span><a href="${esc(contact.whatsappUrl)}" target="_blank" rel="noreferrer">${esc(contact.phoneDisplay)} ↗</a></div>
      <div class="contact-channel"><span>Telegram</span><a href="${esc(contact.telegramUrl)}" target="_blank" rel="noreferrer">${esc(contact.telegramHandle)} ↗</a></div>
      <div class="contact-channel"><span>Email</span><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>
      <div class="contact-channel"><span>Telegram channel</span><a href="${esc(contact.telegramChannelUrl)}" target="_blank" rel="noreferrer">${esc(contact.telegramChannelLabel)} ↗</a></div>
      <div class="notice" style="margin-top:30px"><strong>${esc(REBECCA_DATA.availability?.label||'Availability')}</strong><br>${esc(REBECCA_DATA.availability?.message||'Live availability is confirmed by Rebecca.')}<br><br>These are my only official contact routes. Final live availability is confirmed by me, not the concierge.</div>`;
  });

  document.querySelectorAll('[data-duration-options]').forEach((select)=>{
    const options=REBECCA_DATA.singapore.rates.filter((rate)=>rate.visible!==false).map((rate)=>`<option>${esc(rate.label.replace('Up to ',''))}</option>`).join('');
    select.innerHTML='<option value="">Choose</option>'+options;
  });

  document.querySelectorAll('[data-screening-options]').forEach((select)=>{
    select.innerHTML='<option value="">Choose</option>'+policies.screening.routes.map((route)=>`<option>${esc(route)}</option>`).join('');
  });

  document.querySelectorAll('[data-whatsapp-link]').forEach((link)=>{link.href=contact.whatsappUrl;});
  document.querySelectorAll('[data-telegram-link]').forEach((link)=>{link.href=contact.telegramUrl;});
}

await Promise.all([hydrateRuntimeData(),hydrateRuntimeMedia()]);

renderProfile();
renderPersonality();
renderReputation();
renderDateIdeas();
renderAuthority();
renderFavourites();
renderPagePhotoHeroes();
renderPageEditorialRotators();
renderGalleryCardRotators();
renderEditorialBreaks();
renderSingapore();
renderTravel();
renderPolicies();
renderContact();
renderAvailability();

window.__REBECCA_DATA__=REBECCA_DATA;
window.__REBECCA_IMAGES__=REBECCA_IMAGES;
document.documentElement.dataset.rebeccaDataVersion=REBECCA_DATA.meta.dataVersion;
document.documentElement.dataset.rebeccaContentReady='true';
document.dispatchEvent(new CustomEvent('rebecca:content-ready'));
