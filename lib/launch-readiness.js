import { buildPublishingOverview } from './publishing-overview.js';
import { readSystemState } from './system-store.js';

// Read-only, privacy-preserving dashboard. Never return secrets, content,
// messages, snapshot payloads, account identifiers or an owner signoff.
export function summarizeLaunchReadiness({ publishing, system, aiConfigured = false }, now = new Date()) {
  const publication = publishing?.overview || {};
  const connected = Number(publication.connectedCount || 0);
  const backupsAvailable = Boolean(system?.persistent);
  const snapshotCount = backupsAvailable && Array.isArray(system.snapshots) ? system.snapshots.length : 0;
  const checks = [
    {
      id:'content-stores',label:'Content editor connections',
      status:connected === 3 ? 'pass' : 'block',
      detail:connected+' of 3 Website, Photos and Concierge stores report connected.'
    },
    {
      id:'history-storage',label:'Recovery history storage',
      status:backupsAvailable ? 'pass' : 'block',
      detail:backupsAvailable ? 'History storage is responding. This does not prove a restore works.'
        : 'Recovery storage is unavailable; launch acceptance cannot proceed.'
    },
    {
      id:'recovery-points',label:'Available recovery points',
      status:snapshotCount > 0 ? 'pass' : 'pending',
      detail:snapshotCount > 0
        ? snapshotCount+' recovery point(s) are stored. Supervised restore still needs proof.'
        : 'No recovery points are visible. Create and verify one before handoff.'
    },
    {
      id:'ai-configuration',label:'AI provider configuration',
      status:aiConfigured ? 'pending' : 'block',
      detail:aiConfigured ? 'An AI key is configured, but live answer quality, quotas and error handling are not yet verified.'
        : 'No Groq key is configured; broader AI responses may use fallback only.'
    },
    {
      id:'search-launch',label:'Domain, indexing and search launch',
      status:'pending',
      detail:'Verify the target domain, indexing, canonical URLs, robots and sitemap after written approval. Never infer launch from Vercel READY.'
    },
    {
      id:'owner-approval',label:'Owner acceptance and handoff',
      status:'pending',
      detail:'Real login, mobile/desktop acceptance, contact accuracy, backup restore, ownership, MFA and privacy approval require Rebecca.'
    }
  ];
  const blocked=checks.filter(c=>c.status==='block').length;
  const pending=checks.filter(c=>c.status==='pending').length;
  return {
    generatedAt:now.toISOString(),
    decision:'NOT_SIGNED_OFF',
    launchAuthorized:false,
    summary:{blocked,pending,passed:checks.filter(c=>c.status==='pass').length},
    checks
  };
}
export async function buildLaunchReadiness(now = new Date()) {
  const [publication, system] = await Promise.allSettled([
    buildPublishingOverview(now),
    readSystemState()
  ]);
  return summarizeLaunchReadiness({
    publishing:publication.status==='fulfilled' ? publication.value : null,
    system:system.status==='fulfilled' ? system.value : null,
    aiConfigured:Boolean(String(process.env.GROQ_API_KEY || '').trim())
  },now);
}
