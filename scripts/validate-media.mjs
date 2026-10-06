import assert from 'node:assert/strict';
import {
  applyMediaStateToImages,
  buildDefaultMediaState,
  mediaHasDraftChanges,
  normalizeMediaState,
  readMediaState
} from '../lib/media-store.js';
import { REBECCA_IMAGES } from '../data/rebecca-images.js';

delete process.env.RC_SUPABASE_URL;
delete process.env.RC_SUPABASE_PUBLISHABLE_KEY;
delete process.env.RC_STORE_SECRET;

const defaults = buildDefaultMediaState();
assert.ok(defaults.library.length > 10);
assert.ok(defaults.placements.hero.length >= 1);
assert.ok(defaults.placements.about.length >= 1);

const uploaded = {
  id: 'upload-test',
  url: 'https://example.com/rebecca-test.jpg',
  pathname: 'rebecca-media/rebecca-test.jpg',
  name: 'Rebecca test.jpg',
  alt: 'Rebecca testing the RC-03 media workflow',
  source: 'upload',
  createdAt: '2026-10-06T00:00:00.000Z'
};

const edited = normalizeMediaState({
  library: [uploaded, ...defaults.library],
  placements: {
    ...defaults.placements,
    hero: ['upload-test', ...defaults.placements.hero].slice(0, 6)
  }
}, defaults);

assert.equal(edited.library[0].source, 'upload');
assert.equal(edited.placements.hero[0], 'upload-test');

const effective = applyMediaStateToImages(REBECCA_IMAGES, edited);
assert.equal(effective.curated.hero[0], uploaded.url);
assert.ok(REBECCA_IMAGES.curated.hero[0] !== uploaded.url);

assert.equal(mediaHasDraftChanges({ draft: edited, published: defaults }), true);
assert.equal(mediaHasDraftChanges({ draft: defaults, published: defaults }), false);

const fallback = await readMediaState();
assert.equal(fallback.persistent, false);
assert.equal(fallback.storeMode, 'canonical-fallback');
assert.ok(fallback.published.library.length > 10);

console.log('RC-03 media validation passed.');
