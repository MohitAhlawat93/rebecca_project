import fs from 'node:fs';

const files = [
  'index.html',
  'about.html',
  'contact.html',
  'date-ideas.html',
  'etiquette.html',
  'gallery.html',
  'professional.html',
  'rates.html',
  'reviews.html',
  'selfies-of-risquerebecca.html',
  'travel.html'
];

const fail = (message) => {
  console.error(`[Rebecca image validation] ${message}`);
  process.exitCode = 1;
};

let totalImages = 0;
let heroCount = 0;
let highPriorityCount = 0;

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const images = html.match(/<img\b[^>]*>/g) || [];
  totalImages += images.length;

  for (const tag of images) {
    const role = (tag.match(/data-image-role="([^"]+)"/) || [])[1] || 'unknown';
    const isSquarespace = tag.includes('images.squarespace-cdn.com');

    if (isSquarespace && !/src="[^"]+\?format=\d+w"/.test(tag)) {
      fail(`${file}: ${role} still uses an unbounded original src`);
    }
    if (isSquarespace && !tag.includes('srcset="')) {
      fail(`${file}: ${role} is missing srcset`);
    }
    if (isSquarespace && !tag.includes('sizes="')) {
      fail(`${file}: ${role} is missing sizes`);
    }
    if (!tag.includes('decoding="async"')) {
      fail(`${file}: ${role} is missing async decoding`);
    }

    if (role === 'hero') {
      heroCount += 1;
      if (!tag.includes('loading="eager"')) fail(`${file}: hero must load eagerly`);
      if (!tag.includes('fetchpriority="high"')) fail(`${file}: hero must have high fetch priority`);
    } else if (!tag.includes('loading="lazy"')) {
      fail(`${file}: ${role} should be lazy loaded`);
    }

    if (tag.includes('fetchpriority="high"')) highPriorityCount += 1;
  }
}

const professional = fs.readFileSync('professional.html', 'utf8').match(/data-image-role="archive-professional"/g) || [];
const candid = fs.readFileSync('selfies-of-risquerebecca.html', 'utf8').match(/data-image-role="archive-candid"/g) || [];

if (professional.length !== 67) fail(`professional archive expected 67 responsive images, found ${professional.length}`);
if (candid.length !== 44) fail(`candid archive expected 44 responsive images, found ${candid.length}`);
if (heroCount !== 1) fail(`expected exactly one LCP hero image, found ${heroCount}`);
if (highPriorityCount !== 1) fail(`expected exactly one high-priority image, found ${highPriorityCount}`);
if (totalImages !== 132) fail(`expected 132 rendered public image elements, found ${totalImages}`);

if (!process.exitCode) {
  console.log(`Rebecca image validation passed: ${totalImages} responsive image elements, 1 prioritized hero, 111 archive images.`);
}
