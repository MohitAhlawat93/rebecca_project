import { mapLocationsForDisplay } from './lib/live-content.js';

const CATEGORY = {
  'visited': { label: 'Visited', className: 'is-visited' },
  'favourite': { label: 'Favourite', className: 'is-favourite' },
  'upcoming-tour': { label: 'Upcoming tour', className: 'is-upcoming' },
  'lived-studied-worked': { label: 'Lived / studied / worked', className: 'is-lived' }
};
const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const xy=(lat,lng)=>({x:((Number(lng)+180)/360)*100,y:((90-Number(lat))/180)*100});
const primaryCategory=(categories=[])=>['upcoming-tour','lived-studied-worked','favourite','visited'].find((key)=>categories.includes(key))||'visited';

function mapBase(){
  return `<svg class="rr-world-svg" viewBox="0 0 1000 500" role="img" aria-label="Stylised world map">
    <path d="M63 96 130 52 238 61 285 99 267 145 214 154 176 191 116 171 79 133Z"/>
    <path d="M247 204 294 232 316 293 298 364 268 430 232 367 215 293Z"/>
    <path d="M434 82 489 60 541 78 572 110 553 145 502 147 473 126Z"/>
    <path d="M472 157 535 154 573 207 561 279 526 350 481 289 457 223Z"/>
    <path d="M553 91 638 64 739 82 820 123 849 169 793 203 714 188 674 225 620 193 572 145Z"/>
    <path d="M772 302 827 282 880 315 868 358 811 374 772 345Z"/>
    <path d="M908 223 928 218 940 239 925 251Z"/>
  </svg>`;
}

export function mountRebeccaTravelMap(root, data = window.__REBECCA_DATA__) {
  if (!root || root.dataset.mapReady === 'true') return;
  root.dataset.mapReady = 'true';
  const locations = mapLocationsForDisplay(data?.travel || {});
  if (!locations.length) {
    root.innerHTML='<div class="rr-map-empty">No verified map locations are published yet.</div>';
    return;
  }

  const filters=['all',...Object.keys(CATEGORY)];
  root.innerHTML=`
    <div class="rr-map-toolbar" role="group" aria-label="Filter Rebecca travel map">
      ${filters.map((key)=>`<button type="button" class="rr-map-filter${key==='all'?' is-active':''}" data-map-filter="${key}">${key==='all'?'All verified':CATEGORY[key].label}</button>`).join('')}
    </div>
    <div class="rr-map-layout">
      <div class="rr-map-canvas">
        ${mapBase()}
        <div class="rr-map-pins" data-map-pins></div>
      </div>
      <aside class="rr-map-detail" data-map-detail aria-live="polite">
        <span class="page-kicker">Verified only</span>
        <h3>Rebecca around the world</h3>
        <p>Choose a pin. The map shows only places supported by Rebecca’s public information or published tour calendar—not all 52 countries and never a live location.</p>
      </aside>
    </div>`;

  const pins=root.querySelector('[data-map-pins]');
  let activeFilter='all';

  const renderPins=()=>{
    pins.innerHTML=locations.filter((item)=>activeFilter==='all'||(item.categories||[]).includes(activeFilter)).map((item)=>{
      const pos=xy(item.lat,item.lng);
      const primary=primaryCategory(item.categories||[]);
      const label=(item.categories||[]).map((key)=>CATEGORY[key]?.label).filter(Boolean).join(' · ');
      return `<button type="button" class="rr-map-pin ${CATEGORY[primary]?.className||''}" style="left:${pos.x.toFixed(3)}%;top:${pos.y.toFixed(3)}%" data-map-location="${esc(item.id)}" aria-label="${esc(item.name)} — ${esc(label)}"><span></span></button>`;
    }).join('');
  };

  const show=(id)=>{
    const item=locations.find((entry)=>entry.id===id);
    if(!item)return;
    const labels=(item.categories||[]).map((key)=>CATEGORY[key]?.label).filter(Boolean);
    root.querySelectorAll('[data-map-location]').forEach((pin)=>pin.classList.toggle('is-selected',pin.dataset.mapLocation===id));
    root.querySelector('[data-map-detail]').innerHTML=`
      <div class="rr-map-detail-tags">${labels.map((label)=>`<span>${esc(label)}</span>`).join('')}</div>
      <h3>${esc(item.name)}</h3>
      <p>${esc(item.summary||'Verified public travel reference.')}</p>
      <small>${esc(item.evidence||'Verified public information.')}</small>`;
  };

  root.addEventListener('click',(event)=>{
    const filter=event.target.closest('[data-map-filter]');
    if(filter){
      activeFilter=filter.dataset.mapFilter||'all';
      root.querySelectorAll('[data-map-filter]').forEach((button)=>button.classList.toggle('is-active',button===filter));
      renderPins();
      return;
    }
    const pin=event.target.closest('[data-map-location]');
    if(pin)show(pin.dataset.mapLocation);
  });

  renderPins();
}
