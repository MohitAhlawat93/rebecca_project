import fs from 'node:fs';
import { REBECCA_IMAGES } from '../data/rebecca-images.js';

const files=['index.html','about.html','contact.html','date-ideas.html','etiquette.html','gallery.html','professional.html','rates.html','reviews.html','selfies-of-risquerebecca.html','travel.html'];
const fail=(m)=>{console.error(`[Rebecca image validation] ${m}`);process.exitCode=1;};
let total=0,heroes=0,high=0;

for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  const images=html.match(/<img\b[^>]*>/g)||[];
  total+=images.length;
  for(const tag of images){
    const role=(tag.match(/data-image-role="([^"]+)"/)||[])[1]||'unknown';
    const sq=tag.includes('images.squarespace-cdn.com');
    if(sq&&!/src="[^"]+\?format=\d+w"/.test(tag))fail(`${file}: ${role} unbounded src`);
    if(sq&&!tag.includes('srcset="'))fail(`${file}: ${role} missing srcset`);
    if(sq&&!tag.includes('sizes="'))fail(`${file}: ${role} missing sizes`);
    if(!tag.includes('decoding="async"'))fail(`${file}: ${role} missing async decoding`);
    if(role==='hero'){
      heroes++;
      if(!tag.includes('loading="eager"'))fail('hero not eager');
      if(!tag.includes('fetchpriority="high"'))fail('hero not high priority');
    }else if(!tag.includes('loading="lazy"'))fail(`${file}: ${role} should be lazy`);
    if(tag.includes('fetchpriority="high"'))high++;
  }
}

const p=fs.readFileSync('professional.html','utf8').match(/data-image-role="archive-professional"/g)||[];
const c=fs.readFileSync('selfies-of-risquerebecca.html','utf8').match(/data-image-role="archive-candid"/g)||[];
if(p.length!==REBECCA_IMAGES.professional.length)fail(`professional expected ${REBECCA_IMAGES.professional.length}, found ${p.length}`);
if(c.length!==REBECCA_IMAGES.candid.length)fail(`candid expected ${REBECCA_IMAGES.candid.length}, found ${c.length}`);
if(new Set([...REBECCA_IMAGES.professional,...REBECCA_IMAGES.candid]).size!==REBECCA_IMAGES.archiveTotal)fail('canonical archive duplicates');
if(REBECCA_IMAGES.archiveTotal!==163)fail(`normalized archive expected 163, found ${REBECCA_IMAGES.archiveTotal}`);
if(REBECCA_IMAGES.audit.currentSiteUnique!==133)fail('original-site audit count drifted');
if(heroes!==1||high!==1)fail(`hero priority contract failed: heroes=${heroes}, high=${high}`);
if(total!==REBECCA_IMAGES.archiveTotal+23)fail(`expected ${REBECCA_IMAGES.archiveTotal+23} static image elements, found ${total}`);

const content=fs.readFileSync('content.js','utf8');
for(const key of ['about','reviews','travel','favourites','dateIdeas','etiquette']){
  if(!content.includes(`key:'${key}'`))fail(`motion config missing ${key}`);
}
const js=fs.readFileSync('script.js','utf8');
if(!js.includes('IntersectionObserver')||!js.includes('prefers-reduced-motion: reduce'))fail('motion accessibility contract missing');
for(const file of ['gallery.html','zh/gallery.html','hi/gallery.html','fr/gallery.html','es/gallery.html']){
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('professional archive — 81 public photographs')||!html.includes('candid archive — 82 public photographs'))fail(`${file}: gallery counts stale`);
}
// Phase 7H.1 visual checks
if(!fs.readFileSync('script.js','utf8').includes("Phase 7H.1 visual balance"))fail('7H.1 page enhancement hook missing');
if(!fs.readFileSync('script.js','utf8').includes('Browse professional gallery')||!fs.readFileSync('script.js','utf8').includes('Browse candid gallery'))fail('gallery destinations are not explicit');
if(!fs.readFileSync('styles.css','utf8').includes('.favourites-page .page-hero'))fail('Favourites photographic hero missing');
if(content.includes('imageVariant(url,1500)')||content.includes('[750,1000,1500,2500]'))fail('editorial motion still requests oversized default imagery');
// Phase 7H.2 rotation and scroll checks
const script72=fs.readFileSync('script.js','utf8');
const content72=fs.readFileSync('content.js','utf8');
const styles72=fs.readFileSync('styles.css','utf8');
if(!script72.includes("Phase 7H.2 global scroll rail"))fail('global scroll rail missing');
if(!script72.includes("},3000);")&&!script72.includes("},3000);"))fail('3-second rotator cadence missing');
if(!script72.includes("setInterval(rotate,3000)"))fail('homepage hero is not on 3-second cadence');
if(!content72.includes("Curiosity makes better company."))fail('About duplicate quote replacement missing');
if(content72.includes("title:'Luxury is ease, not theatre.'"))fail('About duplicate image quote still present');
for(const key of ['favouritesHero','journal','press','aboutFeature','galleryProfessional','galleryCandid']){
  if(!fs.readFileSync('data/rebecca-images.js','utf8').includes('"'+key+'"'))fail('image set missing: '+key);
}
if(!content72.includes("renderPagePhotoHeroes()"))fail('Journal/Press/Favourites photo heroes missing');
if(!styles72.includes(".page-scroll-rail"))fail('scroll rail styles missing');
if(!styles72.includes(".page-hero-photo"))fail('rotating page hero styles missing');
if(!process.exitCode)console.log(`Rebecca image validation passed: ${total} static responsive image elements, 3-second rotating editorial photography, global scroll rail, and 163 normalized archive images.`);
