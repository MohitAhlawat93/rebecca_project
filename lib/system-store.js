import { readVisualEditorState, saveVisualEditorDraft } from './admin-store.js';
import { readConciergeControlState, saveConciergeDraft } from './concierge-control-store.js';
import { readMediaState, saveMediaDraft } from './media-store.js';

const STORE_ID='current';
const MAX_EVENTS=250;
const MAX_SNAPSHOTS=10;
const clone=(value)=>JSON.parse(JSON.stringify(value));
const DASHBOARD_TABS=new Set(['insights','search','assistant','publishing','availability','travel','schedule','rates','contact','profile','concierge','needs-rebecca','concierge-test','media','history','export','settings']);

export const DEFAULT_SYSTEM_SETTINGS={
  dashboardStartTab:'insights',
  aiAssistantEnabled:true,
  needsRebeccaCaptureEnabled:true,
  automaticRecoveryEnabled:true
};

export function normalizeSystemSettings(input={}){
  const source=input&&typeof input==='object'?input:{};
  const dashboardStartTab=DASHBOARD_TABS.has(source.dashboardStartTab)
    ? source.dashboardStartTab
    : DEFAULT_SYSTEM_SETTINGS.dashboardStartTab;
  return {
    dashboardStartTab,
    aiAssistantEnabled:source.aiAssistantEnabled!==false,
    needsRebeccaCaptureEnabled:source.needsRebeccaCaptureEnabled!==false,
    automaticRecoveryEnabled:source.automaticRecoveryEnabled!==false
  };
}

function cleanText(value,max=300){return String(value??'').trim().slice(0,max)}
function configured(){
  return Boolean(
    String(process.env.RC_SUPABASE_URL||'').trim() &&
    String(process.env.RC_SUPABASE_PUBLISHABLE_KEY||'').trim() &&
    String(process.env.RC_STORE_SECRET||'').trim()
  );
}
function headers(extra={}){
  return {
    apikey:String(process.env.RC_SUPABASE_PUBLISHABLE_KEY||'').trim(),
    'x-rc-control-secret':String(process.env.RC_STORE_SECRET||'').trim(),
    'Content-Type':'application/json',
    ...extra
  };
}
async function request(path,options={}){
  const root=String(process.env.RC_SUPABASE_URL||'').trim().replace(/\/$/,'');
  const response=await fetch(root+path,{...options,headers:headers(options.headers||{}),cache:'no-store'});
  if(!response.ok){
    const details=await response.text().catch(()=> '');
    throw new Error('Rebecca system store failed ('+response.status+')'+(details?': '+details.slice(0,220):''));
  }
  if(response.status===204)return null;
  const text=await response.text();
  return text?JSON.parse(text):null;
}
function normalizeEvents(value){
  if(!Array.isArray(value))return [];
  return value.slice(0,MAX_EVENTS).map((item)=>({
    id:cleanText(item?.id,90),
    at:cleanText(item?.at,80),
    area:cleanText(item?.area,80),
    type:cleanText(item?.type,80),
    summary:cleanText(item?.summary,300),
    source:cleanText(item?.source,120)||'Rebecca Control'
  })).filter((item)=>item.id&&item.at&&item.summary);
}
function normalizeSnapshots(value){
  if(!Array.isArray(value))return [];
  return value.slice(0,MAX_SNAPSHOTS).filter((item)=>item&&typeof item==='object'&&item.id&&item.at);
}
export async function readSystemState(){
  if(!configured())return {events:[],snapshots:[],settings:normalizeSystemSettings(),version:0,updatedAt:null,persistent:false,storeMode:'not-configured'};
  try{
    const rows=await request('/rest/v1/rebecca_system_api?id=eq.'+STORE_ID+'&select=id,version,events,snapshots,updated_at,settings&limit=1',{method:'GET'});
    const row=Array.isArray(rows)?rows[0]:null;
    if(!row)throw new Error('System ledger row is not visible.');
    return {
      events:normalizeEvents(row.events),
      snapshots:normalizeSnapshots(row.snapshots),
      settings:normalizeSystemSettings(row.settings),
      version:Number(row.version)||0,
      updatedAt:row.updated_at||null,
      persistent:true,
      storeMode:'supabase-rls'
    };
  }catch(error){
    console.error('RC-09 system read fallback:',error?.message||error);
    return {events:[],snapshots:[],settings:normalizeSystemSettings(),version:0,updatedAt:null,persistent:false,storeMode:'store-error'};
  }
}
async function patch(current,patch,updatedBy='Rebecca Control'){
  const nextVersion=(Number(current.version)||0)+1;
  const now=new Date().toISOString();
  const rows=await request('/rest/v1/rebecca_system_api?id=eq.'+STORE_ID+'&version=eq.'+encodeURIComponent(String(current.version)),{
    method:'PATCH',
    headers:{Prefer:'return=representation'},
    body:JSON.stringify({
      version:nextVersion,
      ...patch,
      updated_by:cleanText(updatedBy,120)||'Rebecca Control',
      updated_at:now
    })
  });
  const row=Array.isArray(rows)?rows[0]:null;
  if(!row){
    const error=new Error('History changed in another request.');
    error.code='STORE_CONFLICT';
    throw error;
  }
  return {
    events:normalizeEvents(row.events),
    snapshots:normalizeSnapshots(row.snapshots),
    settings:normalizeSystemSettings(row.settings),
    version:Number(row.version)||nextVersion,
    updatedAt:row.updated_at||now,
    persistent:true,
    storeMode:'supabase-rls'
  };
}
function id(prefix='evt'){
  return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
}
export async function readSystemSettings(){
  const state=await readSystemState();
  return {
    settings:normalizeSystemSettings(state.settings),
    persistent:state.persistent,
    version:state.version,
    updatedAt:state.updatedAt
  };
}

export async function saveSystemSettings(input,updatedBy='Rebecca'){
  const current=await readSystemState();
  if(!current.persistent){
    const error=new Error('Settings storage is unavailable.');
    error.code='STORE_UNAVAILABLE';
    throw error;
  }
  const settings=normalizeSystemSettings(input);
  const event={
    id:id('evt'),
    at:new Date().toISOString(),
    area:'System',
    type:'settings',
    summary:'Rebecca Control safety settings were updated.',
    source:'Settings'
  };
  return patch(current,{
    settings,
    events:[event,...current.events].slice(0,MAX_EVENTS)
  },updatedBy);
}

export async function recordSystemEvent({area='System',type='update',summary='',source='Rebecca Control'}={}){
  const message=cleanText(summary,300);
  if(!message||!configured())return null;
  for(let attempt=0;attempt<3;attempt+=1){
    const current=await readSystemState();
    if(!current.persistent)return null;
    const event={id:id('evt'),at:new Date().toISOString(),area:cleanText(area,80),type:cleanText(type,80),summary:message,source:cleanText(source,120)};
    try{
      return await patch(current,{events:[event,...current.events].slice(0,MAX_EVENTS)});
    }catch(error){
      if(error?.code!=='STORE_CONFLICT'||attempt===2)throw error;
    }
  }
  return null;
}
async function currentSnapshot(label='Recovery point'){
  const [website,concierge,media]=await Promise.all([
    readVisualEditorState(),
    readConciergeControlState(),
    readMediaState()
  ]);
  if(!website.persistent||!concierge.persistent||!media.persistent){
    const error=new Error('One or more Rebecca Control stores are unavailable.');
    error.code='STORE_UNAVAILABLE';
    throw error;
  }
  return {
    id:id('snap'),
    at:new Date().toISOString(),
    label:cleanText(label,180)||'Recovery point',
    website:{
      published:clone(website.published),
      draft:clone(website.draft),
      version:Number(website.version)||0
    },
    concierge:{
      published:clone(concierge.published),
      draft:clone(concierge.draft),
      publishedVersion:Number(concierge.publishedVersion)||0
    },
    media:{
      published:clone(media.published),
      draft:clone(media.draft),
      publishedVersion:Number(media.publishedVersion)||0,
      schedule:clone(media.schedule)
    }
  };
}
export async function captureRecoverySnapshot(label='Before important change',source='Rebecca Control'){
  if(!configured())return null;
  const snapshot=await currentSnapshot(label);
  for(let attempt=0;attempt<3;attempt+=1){
    const current=await readSystemState();
    if(!current.persistent)return null;
    const event={
      id:id('evt'),at:new Date().toISOString(),area:'System',type:'recovery-point',
      summary:'Recovery point created: '+snapshot.label,source:cleanText(source,120)
    };
    try{
      return await patch(current,{
        snapshots:[snapshot,...current.snapshots].slice(0,MAX_SNAPSHOTS),
        events:[event,...current.events].slice(0,MAX_EVENTS)
      },source);
    }catch(error){
      if(error?.code!=='STORE_CONFLICT'||attempt===2)throw error;
    }
  }
  return null;
}
export async function safeCaptureRecoverySnapshot(label,source='Rebecca Control'){
  try{
    const current=await readSystemState();
    if(current.persistent&&current.settings?.automaticRecoveryEnabled===false)return null;
    return await captureRecoverySnapshot(label,source)
  }
  catch(error){
    console.error('RC-09 recovery snapshot skipped:',error?.message||error);
    return null;
  }
}
export async function buildExportBundle(){
  const snapshot=await currentSnapshot('Manual export');
  return {
    format:'rebecca-control-backup',
    version:1,
    exportedAt:new Date().toISOString(),
    note:'Owner-managed website, concierge and media configuration. Visitor-derived Needs Rebecca inbox is intentionally excluded.',
    data:{
      website:snapshot.website,
      concierge:snapshot.concierge,
      media:snapshot.media
    }
  };
}
function invalidBundle(message){
  const error=new Error(message);
  error.code='BACKUP_INVALID';
  throw error;
}
const plainRecord=(value)=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
export function validateBundle(bundle){
  if(!plainRecord(bundle)||bundle.format!=='rebecca-control-backup'||bundle.version!==1||!plainRecord(bundle.data)){
    invalidBundle('This is not a supported Rebecca Control backup.');
  }
  let bytes=0;
  try{bytes=Buffer.byteLength(JSON.stringify(bundle),'utf8');}
  catch{invalidBundle('Backup data is malformed.');}
  if(bytes>8*1024*1024)invalidBundle('Backup exceeds the safe 8 MB import limit.');

  const {website,concierge,media}=bundle.data;
  if(!plainRecord(website)||!plainRecord(website.published)||
    !plainRecord(website.published.availability)||!plainRecord(website.published.profile)||
    !Array.isArray(website.published.rates)||!Array.isArray(website.published.travel)||
    !plainRecord(website.published.contact)||
    !plainRecord(concierge)||!plainRecord(concierge.published)||
    !Array.isArray(concierge.published.trustedAnswers)||
    !plainRecord(media)||!plainRecord(media.published)||
    !Array.isArray(media.published.library)||!plainRecord(media.published.placements)){
    invalidBundle('Backup is incomplete or contains invalid Website, Concierge or Photos data.');
  }
  return bundle;
}

async function restoreDataToDraft(data,source){
  // Recovery covers three independent versioned stores, not an atomic DB
  // transaction. Protect the existing drafts with a recovery point FIRST.
  const protectedPoint=await captureRecoverySnapshot('Before owner recovery restore',source);
  if(!protectedPoint){
    const error=new Error('Cannot protect current Drafts before restoring. Recovery was not started.');
    error.code='STORE_UNAVAILABLE';
    throw error;
  }
  const completed=[];
  try{
    await saveVisualEditorDraft(data.website.published,source);
    completed.push('Website');
    await saveConciergeDraft(data.concierge.published,source);
    completed.push('Concierge');
    await saveMediaDraft(data.media.published,source);
    completed.push('Photos');
  }catch(error){
    console.error('RC-09 restore stopped after:',completed.join(', ')||'none',error?.code||'STORE_ERROR');
    const failure=new Error(
      'Restore stopped after updating '+(completed.join(' and ')||'no')+
      ' Drafts. Nothing was published. Do not publish. Review all three Drafts and the pre-restore recovery point before retrying.'
    );
    failure.code='RESTORE_PARTIAL';
    throw failure;
  }
  try{
    await recordSystemEvent({
      area:'System',type:'restore-to-draft',
      summary:'Recovery data restored to Website, Concierge and Media Drafts. Nothing was published.',
      source
    });
  }catch(error){
    console.error('RC-09 restore event logging failed:',error?.code||'STORE_ERROR');
  }
  return true;
}
export async function restoreSnapshotToDraft(snapshotId,source='Rebecca Recovery'){
  const current=await readSystemState();
  if(!current.persistent)throw Object.assign(new Error('Recovery storage is unavailable.'),{code:'STORE_UNAVAILABLE'});
  const snapshot=current.snapshots.find((item)=>item.id===cleanText(snapshotId,90));
  if(!snapshot)throw Object.assign(new Error('That recovery point is no longer available.'),{code:'SNAPSHOT_NOT_FOUND'});
  const safe=validateBundle({format:'rebecca-control-backup',version:1,data:snapshot});
  return restoreDataToDraft(safe.data,source);
}
export async function restoreBundleToDraft(bundle,source='Rebecca Backup Import'){
  const safe=validateBundle(bundle);
  return restoreDataToDraft(safe.data,source);
}
