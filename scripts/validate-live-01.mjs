import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REBECCA_DATA } from '../data/rebecca-data.js';
import { buildDefaultQuickControlState, normalizeQuickControlState, applyQuickControlState } from '../lib/admin-store.js';
import { activeNotices, mapLocationsForDisplay, travelGroups } from '../lib/live-content.js';

const favouriteNames=['Uzbekistan','Japan','Bolivia','Czech Republic'];
assert.deepEqual(REBECCA_DATA.profile.favouriteCountriesMentioned,favouriteNames,'Favourite countries must match the verified public list.');

const locations=REBECCA_DATA.travel.mapLocations||[];
assert(locations.length>0&&locations.length<52,'Map must contain verified named places, never fabricated pins for all 52 countries.');
assert.equal(new Set(locations.map((item)=>item.id)).size,locations.length,'Map location ids must be unique.');
for(const item of locations){
  assert(item.name&&Number.isFinite(item.lat)&&Number.isFinite(item.lng),`Map location ${item.id} needs a name and coordinates.`);
  assert(item.lat>=-90&&item.lat<=90&&item.lng>=-180&&item.lng<=180,`Map location ${item.id} coordinates are invalid.`);
  assert(Array.isArray(item.categories)&&item.categories.length,`Map location ${item.id} needs a verified category.`);
}
for(const country of favouriteNames){
  assert(locations.some((item)=>item.name===country&&item.categories.includes('favourite')),`Verified favourite ${country} needs a favourite map pin.`);
}
assert(locations.some((item)=>item.name==='Singapore'&&item.categories.includes('lived-studied-worked')),'Singapore verified base must be represented.');

const tours=REBECCA_DATA.travel.calendar;
for(const tour of tours){
  for(const city of tour.cities||[]){
    assert(locations.some((item)=>item.name===city&&item.tourId===tour.id),`Published tour city ${city} needs a linked map pin.`);
  }
}

const today=new Date('2026-10-07T04:00:00Z');
const groups=travelGroups(REBECCA_DATA.travel,today);
assert.equal(groups.upcoming.length,2,'Both verified 2026 tour windows should be upcoming on 7 Oct 2026.');
assert.equal(groups.interest.length,1,'North America expression of interest should be structured.');
assert.equal(groups.past.length,1,'Hong Kong 23–27 September should be retained as verified Past travel.');
const afterTours=travelGroups(REBECCA_DATA.travel,new Date('2026-12-10T04:00:00Z'));
assert.equal(afterTours.past.length,3,'All completed public windows should move to Past history rather than disappear.');

const homeNotices=activeNotices(REBECCA_DATA.notices,{now:today,pathname:'/'});
assert(homeNotices.some((item)=>item.id==='india-tour-2026'&&item.surface==='bar'),'India notice should be active on Home.');
assert(homeNotices.some((item)=>item.id==='rebecca-afterhours'&&item.surface==='card'),'Afterhours card should be active on Home.');
const ratesNotices=activeNotices(REBECCA_DATA.notices,{now:today,pathname:'/rates'});
assert(!ratesNotices.some((item)=>item.id==='rebecca-afterhours'),'Page targeting must keep Afterhours off Rates by default.');
const expiredTravel=activeNotices(REBECCA_DATA.notices,{now:new Date('2026-12-10T04:00:00Z'),pathname:'/'});
assert(!expiredTravel.some((item)=>item.type==='travel'),'Expired travel notices must automatically stop rendering.');
assert(expiredTravel.some((item)=>item.id==='rebecca-afterhours'),'Evergreen Afterhours card should remain available.');

const mapAfterTours=mapLocationsForDisplay(REBECCA_DATA.travel,new Date('2026-12-10T04:00:00Z'));
assert(!mapAfterTours.some((item)=>item.categories.includes('upcoming-tour')),'Past tour pins must not continue presenting as upcoming.');
assert(mapAfterTours.some((item)=>item.name==='Hong Kong'&&item.categories.includes('visited')),'Verified historical Hong Kong should remain visible as travel history after its tour window.');

const defaults=buildDefaultQuickControlState();
const normalized=normalizeQuickControlState(defaults);
assert.equal(normalized.mapLocations.length,locations.length,'Quick Control must own map locations.');
assert.equal(normalized.notices.length,REBECCA_DATA.notices.length,'Quick Control must own live notices.');
assert.equal(normalized.travelInterests.length,REBECCA_DATA.travel.expressionsOfInterest.length,'Quick Control must own expressions of interest.');
const effective=applyQuickControlState(REBECCA_DATA,normalized,{now:today});
assert.equal(effective.notices.length,REBECCA_DATA.notices.length,'Published effective data must include notices.');
assert.equal(effective.travel.mapLocations.length,locations.length,'Published effective data must include map locations.');

assert(REBECCA_DATA.profile.homeFacts.length>=10,'At a Glance must contain useful populated facts.');
assert(REBECCA_DATA.profile.homeFacts.every((item)=>item.label&&item.value),'At a Glance must not contain empty values.');
assert(Object.keys(REBECCA_DATA.travel.touringRates).length>=6,'International touring rate tables must remain populated.');
assert(REBECCA_DATA.travel.practicalities.some((item)=>/unlisted|not listed/i.test(item)),'Verified guidance for unlisted destinations must remain present.');
assert(!REBECCA_DATA.travel.practicalities.some((item)=>/four- or five-star hotels|4.?star|5.?star/i.test(item)),'Unverified hotel-tier rules must not be introduced.');

const publicPages=['index.html','about.html','rates.html','travel.html','gallery.html','date-ideas.html','reviews.html','journal.html','press.html','contact.html','etiquette.html','favourites.html'];
for(const file of publicPages){
  const html=fs.readFileSync(path.join(process.cwd(),file),'utf8');
  assert(!/placeholder photography|demo text|lorem ipsum/i.test(html),`${file} still contains demo/placeholder language.`);
}
const travelHtml=fs.readFileSync(path.join(process.cwd(),'travel.html'),'utf8');
assert(travelHtml.includes('data-rebecca-travel-map'),'Travel page must include the lazy interactive map mount.');
assert(travelHtml.includes('data-live-notices'),'Travel page must include the reusable inline notice slot.');
const adminHtml=fs.readFileSync(path.join(process.cwd(),'admin.html'),'utf8');
assert(adminHtml.includes('data-tab="live"')&&adminHtml.includes('data-live-notice-list')&&adminHtml.includes('data-map-location-list'),'Rebecca Control must expose LIVE-01 editing surfaces.');

function apiEntries(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap((entry)=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?apiEntries(full):(entry.isFile()&&/\.(?:js|mjs|ts)$/.test(entry.name)?[full]:[]);
  });
}
const functions=apiEntries(path.join(process.cwd(),'api'));
assert(functions.length<=12,`Hobby deployment limit exceeded: found ${functions.length} API entry files.`);
assert(fs.existsSync(path.join(process.cwd(),'api/admin/[route].js')),'Admin API dispatcher is missing.');
for(const legacy of ['login','logout','session','quick-control','media','media-upload','visual-editor','concierge-control','concierge-test','needs-rebecca','assistant-propose','assistant-apply','system','insights']){
  assert(!fs.existsSync(path.join(process.cwd(),`api/admin/${legacy}.js`)),`Legacy function api/admin/${legacy}.js should be consolidated.`);
}

console.log('LIVE-01 validation passed: verified map, travel lifecycle, notices, Admin ownership, business completeness, RAG-safe data and Vercel function budget.');
