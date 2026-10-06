import fs from 'node:fs';

const fail=(message)=>{console.error(`[Navigation/i18n validation] ${message}`);process.exitCode=1;};
const assert=(condition,message)=>{if(!condition)fail(message);};

const script=fs.readFileSync('script.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const favourites=fs.readFileSync('favourites.html','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const translateApi=fs.readFileSync('api/translate.js','utf8');
const conciergeApi=fs.readFileSync('api/concierge.js','utf8');
const knowledge=fs.readFileSync('lib/rebecca-knowledge.js','utf8');
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));

for(const path of ['/about','/rates','/travel','/gallery','/reviews','/favourites']){
  assert(script.includes(`'${path}'`),`primary navigation is missing ${path}`);
}
for(const path of ['/date-ideas','/etiquette','/journal','/press']){
  assert(script.includes(`'${path}'`),`More navigation is missing ${path}`);
}
assert(script.includes('nav-more-menu'),'desktop More menu is missing');
assert(css.includes('@media(max-width:1180px)'),'navigation does not collapse before it becomes crowded');
assert(css.includes('.language-picker'),'language picker styles are missing');

for(const code of ['zh-CN','hi','fr','es']){
  assert(script.includes(`${code}:`)||script.includes(`'${code}':`),`language option ${code} is missing`);
}
assert(script.includes("fetch('/api/translate'"),'client translation endpoint is not wired');
assert(script.includes("localStorage.setItem('rr-language'"),'language preference is not persisted');
assert(script.includes('requestTranslations([q],\'en\')'),'non-English concierge questions are not normalized for grounded planning');
assert(script.includes('Private concierge'),'launcher was not renamed');
assert(script.includes('Rebecca’s Private Concierge'),'concierge panel was not renamed');

for(const binding of ['data-favourites-table','data-favourites-things','data-favourites-interests']){
  assert(favourites.includes(binding),`favourites page is missing ${binding}`);
}
assert(sitemap.includes('/favourites</loc>'),'favourites page is missing from sitemap');
assert(knowledge.includes("id:'favourites'"),'RAG knowledge is missing favourites');

assert(translateApi.includes('Preserve all numbers, prices, currency symbols/codes, dates, durations'),'translator does not protect canonical booking facts');
assert(translateApi.includes("response_format:{type:'json_object'}"),'translation response is not constrained to JSON');
assert(conciergeApi.includes('Preferred response language'),'concierge API does not receive language guidance');
assert(vercel.functions?.['api/translate.js']?.maxDuration===30,'translation function Vercel configuration is missing');

if(!process.exitCode) console.log('Navigation and multilingual validation passed.');
