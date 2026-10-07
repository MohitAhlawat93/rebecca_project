import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildDefaultQuickControlState } from '../lib/admin-store.js';
import { buildDefaultConciergeControl } from '../lib/concierge-control-store.js';
import {
  applyAssistantChange,
  deterministicAssistantProposal,
  normalizeAssistantProposal
} from '../lib/admin-assistant.js';

const websiteDraft=buildDefaultQuickControlState();
const conciergeDraft=buildDefaultConciergeControl();

const availability=deterministicAssistantProposal(
  'Make my availability limited until 15 October.',
  {websiteDraft,conciergeDraft},
  new Date('2026-10-07T00:00:00Z')
);
assert.equal(availability.changes.length,1);
assert.equal(availability.changes[0].target,'website');
assert.equal(availability.changes[0].kind,'availability');
assert.match(availability.changes[0].basisHash,/^[a-f0-9]{20}$/);

const applied=applyAssistantChange(availability.changes[0],{
  websiteDraft,
  conciergeDraft,
  enforceBasis:true
});
assert.equal(applied.websiteDraft.availability.status,'limited');
assert.equal(applied.websiteDraft.availability.until,'2026-10-15');
assert.equal(websiteDraft.availability.status,'accepting');

const changedWebsite=structuredClone(websiteDraft);
changedWebsite.availability.message='A newer manual edit.';
assert.throws(
  ()=>applyAssistantChange(availability.changes[0],{
    websiteDraft:changedWebsite,
    conciergeDraft,
    enforceBasis:true
  }),
  (error)=>error?.code==='ASSISTANT_PROPOSAL_STALE'
);

const rate=websiteDraft.rates.find((item)=>String(item.label).includes('3')||String(item.short).includes('3'));
if(rate){
  const rateProposal=normalizeAssistantProposal({
    summary:'Rate change',
    changes:[{target:'website',kind:'rate',id:rate.id,patch:{amount:3333},summary:'Update rate'}]
  },{websiteDraft,conciergeDraft});
  assert.equal(rateProposal.changes.length,1);
  const next=applyAssistantChange(rateProposal.changes[0],{websiteDraft,conciergeDraft,enforceBasis:true});
  assert.equal(next.websiteDraft.rates.find((item)=>item.id===rate.id).amount,3333);
}

const trusted=normalizeAssistantProposal({
  summary:'Trusted Answer',
  changes:[{
    target:'concierge',
    kind:'trusted-answer-add',
    item:{
      question:'How quickly do you reply?',
      answer:'Rebecca replies personally as soon as practical.',
      keywords:['reply time'],
      linkPath:'/contact',
      linkLabel:'Contact Rebecca',
      enabled:true
    }
  }]
},{websiteDraft,conciergeDraft});
assert.equal(trusted.changes.length,1);
const trustedApplied=applyAssistantChange(trusted.changes[0],{
  websiteDraft,
  conciergeDraft,
  enforceBasis:true
});
assert.equal(trustedApplied.conciergeDraft.trustedAnswers.length,1);

const unsafe=normalizeAssistantProposal({
  summary:'Unsafe',
  changes:[
    {target:'website',kind:'delete-page',id:'about',summary:'Delete About'},
    {target:'concierge',kind:'publish',summary:'Publish everything'}
  ]
},{websiteDraft,conciergeDraft});
assert.equal(unsafe.changes.length,0);

const pause=deterministicAssistantProposal(
  'Pause Rebecca’s Desk for now.',
  {websiteDraft,conciergeDraft}
);
assert.equal(pause.changes[0].kind,'concierge-config');
const paused=applyAssistantChange(pause.changes[0],{websiteDraft,conciergeDraft,enforceBasis:true});
assert.equal(paused.conciergeDraft.enabled,false);

const admin=fs.readFileSync(new URL('../admin.html',import.meta.url),'utf8');
const adminJs=fs.readFileSync(new URL('../admin.js',import.meta.url),'utf8');
const proposeApi=fs.readFileSync(new URL('../server/admin/assistant-propose.js',import.meta.url),'utf8');
const applyApi=fs.readFileSync(new URL('../server/admin/assistant-apply.js',import.meta.url),'utf8');

assert.match(admin,/data-tab="assistant"/);
assert.match(admin,/Approval boundary/);
assert.match(admin,/Apply to Draft/);
assert.match(adminJs,/\/api\/admin\/assistant-propose/);
assert.match(adminJs,/\/api\/admin\/assistant-apply/);
assert.match(proposeApi,/publishesNothing:true/);
assert.match(proposeApi,/writesNothing:true/);
assert.doesNotMatch(applyApi,/publishVisualEditorDraft/);
assert.doesNotMatch(applyApi,/publishConciergeDraft/);
assert.match(applyApi,/saveVisualEditorDraft/);
assert.match(applyApi,/saveConciergeDraft/);
assert.match(applyApi,/enforceBasis:true/);

console.log('RC-08 AI Admin Assistant validation passed.');
