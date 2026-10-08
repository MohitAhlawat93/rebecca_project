import { readVisualEditorState } from './admin-store.js';
import { readMediaState, mediaHasDraftChanges, getEffectiveMediaState } from './media-store.js';
import { readConciergeControlState } from './concierge-control-store.js';

// Status-only aggregation: never return draft/published payloads, credentials, or sensitive events.
// Stores remain independent; no cross-store publish, discard, or write operation is permitted.
const missing = (name) => ({
  name, connected: false, status: 'unavailable', message: 'Storage is not available. No publishing action is available.'
});

export function summarizePublishingStates({ website, media, concierge }, now = new Date()) {
  const websiteOk = Boolean(website?.persistent);
  const mediaOk = Boolean(media?.persistent);
  const conciergeOk = Boolean(concierge?.persistent);
  const mediaEffective = mediaOk ? getEffectiveMediaState(media, now) : null;

  return {
    generatedAt: now.toISOString(),
    overview: {
      connectedCount: [websiteOk, mediaOk, conciergeOk].filter(Boolean).length,
      savedDraftsWaiting: Number(websiteOk && website.hasDraftChanges)
        + Number(mediaOk && mediaHasDraftChanges(media))
        + Number(conciergeOk && concierge.hasDraftChanges),
      allConnected: websiteOk && mediaOk && conciergeOk
    },
    websiteFacts: websiteOk ? {
      name: 'Website facts',
      connected: true,
      status: 'live',
      message: 'Availability, rates, travel, public profile and contacts are saved directly to the live website.',
      version: website.version,
      lastUpdatedAt: website.updatedAt || null
    } : missing('Website facts'),
    websiteDraft: websiteOk ? {
      name: 'Visual Website Draft',
      connected: true,
      status: website.hasDraftChanges ? 'draft' : 'current',
      message: website.hasDraftChanges
        ? 'Private website changes are saved. Review and publish them in Edit Website.'
        : 'The saved Visual Editor Draft matches the published website.',
      version: website.version,
      lastUpdatedAt: website.updatedAt || null
    } : missing('Visual Website Draft'),
    photos: mediaOk ? {
      name: 'Photos & placements',
      connected: true,
      status: mediaHasDraftChanges(media) ? 'draft' : 'current',
      message: mediaHasDraftChanges(media)
        ? 'A saved photo Draft differs from the published version.'
        : 'Photo Draft and the normal published version match.',
      publishedVersion: media.publishedVersion,
      lastPublishedAt: media.publishedAt || null,
      lastUpdatedAt: media.updatedAt || null,
      schedule: ['pending', 'active', 'expired'].includes(mediaEffective?.phase) ? mediaEffective.phase : 'none',
      scheduledPublishAt: media.schedule?.publishAt || null,
      scheduledExpireAt: media.schedule?.expireAt || null
    } : { ...missing('Photos & placements'), schedule: 'unknown' },
    concierge: conciergeOk ? {
      name: 'AI Concierge',
      connected: true,
      status: concierge.hasDraftChanges ? 'draft' : 'current',
      message: concierge.hasDraftChanges
        ? 'The saved Concierge Draft differs from the live assistant. Test it before publishing.'
        : 'The saved Concierge Draft matches the live assistant.',
      publishedVersion: concierge.publishedVersion,
      lastPublishedAt: concierge.publishedAt || null,
      lastUpdatedAt: concierge.updatedAt || null
    } : missing('AI Concierge')
  };
}

export async function buildPublishingOverview(now = new Date()) {
  // Promise.allSettled means a temporary outage in one store does not hide the others.
  const settled = await Promise.allSettled([
    readVisualEditorState(),
    readMediaState(),
    readConciergeControlState()
  ]);
  return summarizePublishingStates({
    website: settled[0].status === 'fulfilled' ? settled[0].value : null,
    media: settled[1].status === 'fulfilled' ? settled[1].value : null,
    concierge: settled[2].status === 'fulfilled' ? settled[2].value : null
  }, now);
}
