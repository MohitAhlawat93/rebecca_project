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
if(!process.exitCode)console.log(`Rebecca image validation passed: ${total} static responsive image elements, 81 professional + 82 candid = 163 normalized archive images.`);
