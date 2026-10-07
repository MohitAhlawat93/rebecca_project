import { readVisualEditorState } from './admin-store.js';
import { readConciergeControlState } from './concierge-control-store.js';
import { readNeedsRebeccaState } from './needs-rebecca-store.js';
import { getEffectiveMediaState, mediaHasDraftChanges, readMediaState } from './media-store.js';
import { evaluateQuickControlSchedules } from './schedule-engine.js';
import { readSystemState } from './system-store.js';

function ageInHours(value, now = new Date()) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round((now.getTime() - time) / 36e5));
}

function action(id, level, title, detail, tab, count = null) {
  return { id, level, title, detail, tab, count };
}

export async function buildOwnerInsights({ now = new Date() } = {}) {
  const [website, concierge, needs, media, system] = await Promise.all([
    readVisualEditorState(),
    readConciergeControlState(),
    readNeedsRebeccaState(),
    readMediaState(),
    readSystemState()
  ]);

  const schedule = evaluateQuickControlSchedules(website.published, { now }).schedule;
  const mediaEffective = getEffectiveMediaState(media, now);
  const openNeeds = needs.items.filter((item) => item.status === 'open');
  const draftedNeeds = needs.items.filter((item) => item.status === 'drafted');
  const recurring = openNeeds
    .filter((item) => Number(item.count) > 1)
    .sort((a, b) => Number(b.count) - Number(a.count) || String(b.lastSeen).localeCompare(String(a.lastSeen)))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      question: item.question,
      count: Number(item.count) || 1,
      page: item.page,
      lastSeen: item.lastSeen
    }));

  const actions = [];

  if (recurring.length) {
    actions.push(action(
      'recurring-questions',
      'high',
      recurring.length === 1 ? 'One recurring question needs an answer' : recurring.length + ' recurring questions need answers',
      'These are being asked repeatedly and are the clearest opportunities to improve Rebecca’s Desk.',
      'needs-rebecca',
      recurring.length
    ));
  } else if (openNeeds.length) {
    actions.push(action(
      'open-questions',
      'medium',
      openNeeds.length + ' question' + (openNeeds.length === 1 ? '' : 's') + ' need Rebecca',
      'No visitor identity is stored; review only the privacy-filtered grouped questions.',
      'needs-rebecca',
      openNeeds.length
    ));
  }

  if (draftedNeeds.length) {
    actions.push(action(
      'drafted-answers',
      'medium',
      draftedNeeds.length + ' answer draft' + (draftedNeeds.length === 1 ? '' : 's') + ' waiting',
      'Finish, test and publish the corresponding Trusted Answers when the wording is ready.',
      'concierge',
      draftedNeeds.length
    ));
  }

  if (website.hasDraftChanges) {
    actions.push(action(
      'website-draft',
      'medium',
      'Website Draft is ahead of live',
      'Review the Visual Editor Draft before deciding whether to publish or discard it.',
      'availability'
    ));
  }

  if (concierge.hasDraftChanges) {
    actions.push(action(
      'concierge-draft',
      'medium',
      'Concierge Draft is ahead of live',
      'Test Rebecca’s Desk privately before publishing the Draft.',
      'concierge-test'
    ));
  }

  if (mediaHasDraftChanges(media)) {
    actions.push(action(
      'media-draft',
      'medium',
      'Media Draft is ahead of live',
      'Photos or placements have unpublished changes waiting in Media & Publish.',
      'media'
    ));
  }

  if (mediaEffective.phase === 'pending') {
    actions.push(action(
      'media-scheduled',
      'info',
      'A media change is scheduled',
      'Review the scheduled snapshot and timing before it becomes live automatically.',
      'media'
    ));
  } else if (mediaEffective.phase === 'active') {
    actions.push(action(
      'media-active-schedule',
      'info',
      'Scheduled media is currently live',
      media.schedule?.expireAt
        ? 'It will revert automatically unless Rebecca chooses Keep live permanently.'
        : 'It has no automatic expiry.',
      'media'
    ));
  }

  if (schedule.nextChanges.length) {
    actions.push(action(
      'schedule-next',
      'info',
      schedule.nextChanges.length + ' automatic change' + (schedule.nextChanges.length === 1 ? '' : 's') + ' coming up',
      'Availability and travel lifecycle changes are already queued in Singapore time.',
      'schedule',
      schedule.nextChanges.length
    ));
  }

  if (concierge.published.enabled === false) {
    actions.push(action(
      'concierge-paused',
      'high',
      'Rebecca’s Desk is paused',
      'Visitors receive the paused message until AI Control is published live again.',
      'concierge'
    ));
  }

  const recentEvents = system.events.slice(0, 6);
  const lastPublish = system.events.find((item) => item.type === 'publish') || null;

  return {
    generatedAt: now.toISOString(),
    privacy: 'Operational insights only. No visitor identity, IP address, raw chat history or screening documents are included.',
    health: {
      openNeeds: openNeeds.length,
      recurringNeeds: recurring.length,
      draftedNeeds: draftedNeeds.length,
      websiteDraftAhead: Boolean(website.hasDraftChanges),
      conciergeDraftAhead: Boolean(concierge.hasDraftChanges),
      mediaDraftAhead: mediaHasDraftChanges(media),
      mediaSchedulePhase: mediaEffective.phase,
      upcomingAutomaticChanges: schedule.nextChanges.length,
      recoveryPoints: system.snapshots.length,
      activeTrustedAnswers: (concierge.published.trustedAnswers || []).filter((item) => item.enabled !== false).length,
      lastPublishAt: lastPublish?.at || null,
      hoursSinceLastPublish: ageInHours(lastPublish?.at, now)
    },
    attention: actions.slice(0, 10),
    recurringQuestions: recurring,
    upcoming: schedule.nextChanges.slice(0, 6),
    recentActivity: recentEvents,
    stores: {
      website: website.persistent,
      concierge: concierge.persistent,
      needsRebecca: needs.persistent,
      media: media.persistent,
      history: system.persistent
    }
  };
}
