import { REBECCA_DATA, formatSgd } from './data/rebecca-data.js';

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
    // Canonical bundled data remains the safe fallback.
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
}

function singaporeTermRows(){
  const sg=REBECCA_DATA.singapore;
  return [
    ['Extensions',`SGD ${sg.extensionPerHour.toLocaleString('en-US')} per additional hour, subject to availability.`],
    ['Long private dates',`For dates of ${sg.terms.longPrivate.minHours} hours or longer where you prefer complete privacy, add a flat SGD ${sg.terms.longPrivate.surcharge.toLocaleString('en-US')} and please include room service.`],
    ['Hosting in Singapore',`Hosting starts from SGD ${sg.terms.hosting.from.toLocaleString('en-US')} with a ${sg.terms.hosting.minHours}-hour minimum. In Singapore, hosting is occasional and reserved for ${sg.terms.hosting.eligibility}.`],
    ['Couples',`Two-hour minimum. Please add SGD ${sg.terms.couples.surcharge.toLocaleString('en-US')}.`],
    ['Phone call before booking',`A ${sg.terms.phoneCall.minutes}-minute call is SGD ${sg.terms.phoneCall.fee.toLocaleString('en-US')}. Screening is required.`],
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
    el.innerHTML=reputation.reviews.map((review)=>`
      <article class="review-item">
        <blockquote>“${esc(review.excerpt)}”</blockquote>
        <footer>${esc(review.source)} · ${esc(review.date)}</footer>
      </article>`).join('');
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

await hydrateRuntimeData();

renderProfile();
renderPersonality();
renderReputation();
renderDateIdeas();
renderSingapore();
renderTravel();
renderPolicies();
renderContact();
renderAvailability();

window.__REBECCA_DATA__=REBECCA_DATA;
document.documentElement.dataset.rebeccaDataVersion=REBECCA_DATA.meta.dataVersion;
