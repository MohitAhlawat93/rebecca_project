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

function renderProfile(){
  const p=REBECCA_DATA.profile;
  setText('[data-profile-established]',p.establishedSince);
  setText('[data-profile-countries]',p.countriesVisited);

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
    el.innerHTML=sg.rates.map((rate)=>`
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
    const cards=travel.calendar.map((item)=>`
      <article class="travel-card${item.alt?' alt':''}">
        <div>
          <p class="page-kicker" style="color:${item.alt?'#d7ddd2':'#aeb8a7'}">${esc(item.kicker)}</p>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.body)}</p>
        </div>
        <div class="travel-meta">${item.meta.map((value)=>`<span>${esc(value)}</span>`).join('')}</div>
      </article>`).join('');
    el.innerHTML=cards+`<div class="notice" style="margin-top:18px">${esc(travel.northAmericaNotice)}</div>`;
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

function renderContact(){
  const contact=REBECCA_DATA.contact;
  const policies=REBECCA_DATA.policies;

  document.querySelectorAll('[data-contact-channels]').forEach((el)=>{
    el.innerHTML=`
      <div class="contact-channel"><span>WhatsApp / iMessage / Signal</span><a href="${esc(contact.whatsappUrl)}" target="_blank" rel="noreferrer">${esc(contact.phoneDisplay)} ↗</a></div>
      <div class="contact-channel"><span>Telegram</span><a href="${esc(contact.telegramUrl)}" target="_blank" rel="noreferrer">${esc(contact.telegramHandle)} ↗</a></div>
      <div class="contact-channel"><span>Email</span><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>
      <div class="contact-channel"><span>Telegram channel</span><a href="${esc(contact.telegramChannelUrl)}" target="_blank" rel="noreferrer">${esc(contact.telegramChannelLabel)} ↗</a></div>
      <div class="notice" style="margin-top:30px">These are my only official contact routes. Live availability is confirmed by me, not the concierge.</div>`;
  });

  document.querySelectorAll('[data-duration-options]').forEach((select)=>{
    const options=REBECCA_DATA.singapore.rates.map((rate)=>`<option>${esc(rate.label.replace('Up to ',''))}</option>`).join('');
    select.innerHTML='<option value="">Choose</option>'+options;
  });

  document.querySelectorAll('[data-screening-options]').forEach((select)=>{
    select.innerHTML='<option value="">Choose</option>'+policies.screening.routes.map((route)=>`<option>${esc(route)}</option>`).join('');
  });

  document.querySelectorAll('[data-whatsapp-link]').forEach((link)=>{link.href=contact.whatsappUrl;});
  document.querySelectorAll('[data-telegram-link]').forEach((link)=>{link.href=contact.telegramUrl;});
}

renderProfile();
renderSingapore();
renderTravel();
renderPolicies();
renderContact();

window.__REBECCA_DATA__=REBECCA_DATA;
document.documentElement.dataset.rebeccaDataVersion=REBECCA_DATA.meta.dataVersion;
