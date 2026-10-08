// RC-QA-03 — private, client-side owner guidance. This file never sends or stores content.
const RC_OWNER_GUIDE_KEY = 'rc-owner-guide-seen-v1';
const RC_OWNER_HELP_KEY = 'rc-owner-help-collapsed-v1';

const RC_OWNER_HELP = {
  insights: {
    title: 'Your daily overview',
    summary: 'Start here to see what needs attention. These numbers help you decide where to go next; they do not change the website.',
    steps: ['Check the items needing attention.', 'Choose an action to open its feature. Review any proposed edits before publishing.'],
    publishing: 'Read-only overview: no public changes.',
    caution: 'Search traffic and rankings live in Growth, not this overview.'
  },
  publishing: {
    title: 'Review everything before it goes live',
    summary: 'Publishing Center shows saved draft and live status across your website, photos and AI concierge without publishing anything itself.',
    steps: ['Refresh status to see which saved drafts are waiting.', 'Open the matching editor or preview, review the change, then publish only that area.', 'Return here and refresh again to verify the new saved status.'],
    publishing: 'This screen is read-only. Website facts use Save & apply; Website, Photos and Concierge Drafts publish separately from their own editors.',
    caution: 'Unsaved browser edits are not included. Scheduled photo releases can block manual publishing, and long-form page copy is not yet editable here.'
  },
  availability: {
    title: 'Update your availability',
    summary: 'Tell visitors whether you are accepting enquiries, taking a break or travelling.',
    steps: ['Choose the current status and write a short visitor-facing message.', 'Optionally set an end date and what the status should become next.', 'Select Save & apply at the bottom, then check the public website.'],
    publishing: 'Save & apply updates the live website and the concierge’s public facts.',
    caution: 'If an unpublished Website Draft exists, finish that Draft first. Never list live availability unless it is confirmed.',
    preview: '/'
  },
  travel: {
    title: 'Manage travel plans',
    summary: 'Keep your public travel calendar current without needing a developer.',
    steps: ['Add or edit the city and public dates.', 'Check the date range, visibility and public wording.', 'Select Save & apply and review the Travel page.'],
    publishing: 'Save & apply publishes public travel details; dated trips change lifecycle automatically.',
    caution: 'Keep private addresses, hotel details and unpublished travel plans out of public fields.',
    preview: '/travel'
  },
  live: {
    title: 'Share important updates',
    summary: 'Create time-sensitive notices and approved public map entries.',
    steps: ['Write a short notice and choose how prominently visitors should see it.', 'Set appropriate visibility and dates, or edit public map details.', 'Save & apply, then check how it appears on the website.'],
    publishing: 'Save & apply updates the public notice/map content; expired notices stop displaying.',
    caution: 'Use large pop-ups sparingly, and never publish real-time private locations.',
    preview: '/'
  },
  schedule: {
    title: 'Let dates manage themselves',
    summary: 'Configure when approved availability and other scheduled content should change.',
    steps: ['Check the dates, timezone and revert behaviour.', 'Save the changes and confirm the displayed summary.', 'Review the public result at the scheduled time.'],
    publishing: 'Approved Quick Control changes are live after Save & apply; configured transitions happen automatically.',
    caution: 'Dates in Rebecca Control are interpreted using Singapore time; review expiry and fallback states.',
    preview: '/'
  },
  rates: {
    title: 'Keep public rates accurate',
    summary: 'Change what visitors see without editing the website source code.',
    steps: ['Review each listed amount, label and visibility setting.', 'Check currencies and short descriptions.', 'Select Save & apply and verify the public information.'],
    publishing: 'Save & apply updates the website and approved facts available to the concierge.',
    caution: 'Double-check prices before applying; do not rely on old figures from previous announcements.',
    preview: '/'
  },
  contact: {
    title: 'Choose public contact methods',
    summary: 'Decide where visitors should send enquiries.',
    steps: ['Check every visible link and contact label.', 'Remove outdated public details and confirm spelling.', 'Save & apply, then open the contact page to test links.'],
    publishing: 'Save & apply updates the public contact information.',
    caution: 'Use only public-facing contact details, not private accounts or login credentials.',
    preview: '/contact'
  },
  profile: {
    title: 'Update your public profile',
    summary: 'Keep basic profile details, languages and public descriptions current.',
    steps: ['Edit only the details you want visitors to know.', 'Review names, locations, languages and spelling.', 'Save & apply and check About.'],
    publishing: 'Save & apply updates the structured public profile.',
    caution: 'This editor does not control every editorial paragraph. Other page copy may still require a separate content edit.',
    preview: '/about'
  },
  media: {
    title: 'Change photographs safely',
    summary: 'Choose images, arrange their placement and publish only when the draft looks right.',
    steps: ['Upload or select a photo and place it in the correct section.', 'Save Draft, then use Preview to check what visitors would see.', 'Choose Publish only after approval, or schedule a verified image change.'],
    publishing: 'Save Draft is private. Preview is private. Publish or an active schedule changes the live website.',
    caution: 'Use approved photographs; publishing can replace existing live placements. Check the mobile crop.',
    preview: '/'
  },
  concierge: {
    title: 'Manage the AI concierge',
    summary: 'Control its visible introduction and trusted answers without editing model code.',
    steps: ['Update the public greeting or an approved Trusted Answer.', 'Save Draft and use Test AI with realistic questions.', 'Publish Concierge only when the answers are correct.'],
    publishing: 'Save Draft remains private. Publish Concierge updates the live assistant.',
    caution: 'Do not add private screening requirements, credentials, exact locations or unverified promises.'
  },
  'concierge-test': {
    title: 'Test before going live',
    summary: 'Ask realistic questions and inspect how the saved AI Draft responds.',
    steps: ['Choose a relevant page and ask a visitor-style question.', 'Check factual accuracy, tone, links and when it says it does not know.', 'Return to AI Concierge to improve, test again and then publish.'],
    publishing: 'Tests are private. Running a test never publishes the Draft.',
    caution: 'The assistant cannot confirm real-time availability without a connected authoritative source.'
  },
  'needs-rebecca': {
    title: 'Review questions needing your answer',
    summary: 'See grouped questions the public concierge could not confidently resolve.',
    steps: ['Review recurring unanswered topics.', 'Write an accurate, public-safe Trusted Answer if appropriate.', 'Test and publish it in AI Concierge; close the question when resolved.'],
    publishing: 'Reviewing or closing questions does not automatically publish a new AI answer.',
    caution: 'Only privacy-filtered summaries are intended here. Do not put visitors’ personal details in Trusted Answers.'
  },
  assistant: {
    title: 'Ask Control to prepare an edit',
    summary: 'Describe the change in everyday language and review its suggested action.',
    steps: ['Type a specific request such as “Limit availability until Friday.”', 'Read each proposed change carefully before applying it to Draft.', 'Open the relevant feature to preview or test, and publish separately.'],
    publishing: 'Ask Control only prepares proposals and drafts; it cannot silently publish or deploy.',
    caution: 'If a request is unsupported, use the original feature control or ask your site administrator.'
  },
  search: {
    title: 'Understand how people find you',
    summary: 'Review available search data, connected providers and technical opportunities.',
    steps: ['Check whether Google and Bing are connected and when they last synced.', 'Review impressions, queries and pages only where real data exists.', 'Approve useful improvements after checking their evidence.'],
    publishing: 'Read-only search insights here: connecting a provider or importing a report does not rewrite live pages.',
    caution: 'Missing provider credentials or recent data can result in empty reports. Rankings and indexing are never guaranteed.'
  },
  settings: {
    title: 'Choose your preferences',
    summary: 'Decide which screen opens first and which optional helpers are enabled.',
    steps: ['Review the first screen and optional safety toggles.', 'Save Settings and confirm the success message.', 'Visit History & Backups before major content revisions.'],
    publishing: 'Settings change private owner tools only; they do not publish content.',
    caution: 'Password reset, owner access and API secrets are not editable through these toggles.'
  },
  history: {
    title: 'Check recent owner activity',
    summary: 'See the recorded events and changes made through Rebecca Control.',
    steps: ['Review the date, action and area for any change.', 'If something looks unexpected, check the relevant Draft or published state.', 'Use History & Backups to create or inspect recovery points.'],
    publishing: 'Activity History is read-only.',
    caution: 'The log is operational evidence, not a replacement for full security monitoring.'
  },
  export: {
    title: 'Back up and recover safely',
    summary: 'Keep a copy of approved content and restore older versions to private Drafts.',
    steps: ['Export a backup before major changes.', 'If needed, inspect the backup and import or restore it to Draft.', 'Check each Website, Photos and Concierge Draft before publishing anything.'],
    publishing: 'Restoring fills private Drafts; it does not immediately change the live website.',
    caution: 'Store exports securely, verify their origin and review every section before publishing a restored copy.'
  }
};

function rcGuideStorageRead(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function rcGuideStorageWrite(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* optional preference */ }
}

let rcWelcomeDismissedThisPage = false;
let rcCurrentGuideTab = 'insights';
let rcGuideCollapsed = rcGuideStorageRead(RC_OWNER_HELP_KEY) === '1';

function rcShowOwnerWelcome(force = false) {
  const panel = document.querySelector('[data-owner-onboarding]');
  if (!panel) return;
  const seen = rcGuideStorageRead(RC_OWNER_GUIDE_KEY) === '1';
  if (force || (!seen && !rcWelcomeDismissedThisPage)) panel.hidden = false;
}

function rcDismissOwnerWelcome() {
  rcWelcomeDismissedThisPage = true;
  rcGuideStorageWrite(RC_OWNER_GUIDE_KEY, '1');
  const panel = document.querySelector('[data-owner-onboarding]');
  if (panel) panel.hidden = true;
}

function rcRenderOwnerHelp(tab) {
  rcCurrentGuideTab = Object.prototype.hasOwnProperty.call(RC_OWNER_HELP, tab) ? tab : 'insights';
  const data = RC_OWNER_HELP[rcCurrentGuideTab];
  const panel = document.querySelector('[data-owner-guidance]');
  if (!panel) return;
  panel.hidden = false;
  const title = panel.querySelector('[data-guidance-title]');
  const summary = panel.querySelector('[data-guidance-summary]');
  const steps = panel.querySelector('[data-guidance-steps]');
  const publishing = panel.querySelector('[data-guidance-publishing]');
  const caution = panel.querySelector('[data-guidance-caution]');
  const preview = panel.querySelector('[data-guidance-preview]');
  if (title) title.textContent = data.title;
  if (summary) summary.textContent = data.summary;
  if (steps) {
    steps.replaceChildren();
    for (const instruction of data.steps) {
      const item = document.createElement('li');
      item.textContent = instruction;
      steps.appendChild(item);
    }
  }
  if (publishing) publishing.textContent = 'Draft & publishing: ' + data.publishing;
  if (caution) caution.textContent = 'Remember: ' + data.caution;
  if (preview) {
    preview.hidden = !data.preview;
    if (data.preview) preview.href = data.preview;
  }
  rcSetOwnerHelpCollapsed(rcGuideCollapsed, false);
}

function rcSetOwnerHelpCollapsed(collapsed, save = true) {
  rcGuideCollapsed = Boolean(collapsed);
  const body = document.querySelector('[data-guidance-body]');
  const toggle = document.querySelector('[data-guidance-toggle]');
  if (body) body.hidden = rcGuideCollapsed;
  if (toggle) {
    toggle.textContent = rcGuideCollapsed ? 'Show guidance' : 'Hide guidance';
    toggle.setAttribute('aria-expanded', rcGuideCollapsed ? 'false' : 'true');
  }
  if (save) rcGuideStorageWrite(RC_OWNER_HELP_KEY, rcGuideCollapsed ? '1' : '0');
}

document.addEventListener('rc:admin-tab', (event) => {
  rcRenderOwnerHelp(event.detail?.tab || 'insights');
});
document.addEventListener('rc:admin-ready', () => {
  rcShowOwnerWelcome();
  rcRenderOwnerHelp(rcCurrentGuideTab);
});
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-guide-dismiss]')) {
    rcDismissOwnerWelcome();
    return;
  }
  if (event.target.closest('[data-guide-reopen]')) {
    rcShowOwnerWelcome(true);
    return;
  }
  if (event.target.closest('[data-guidance-toggle]')) {
    rcSetOwnerHelpCollapsed(!rcGuideCollapsed);
    return;
  }
  const jump = event.target.closest('[data-guide-jump]');
  if (jump) {
    const tab = jump.dataset.guideJump;
    const control = [...document.querySelectorAll('[data-tab]')].find((button) => button.dataset.tab === tab);
    rcDismissOwnerWelcome();
    if (control) control.click();
  }
});
