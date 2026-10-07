import { getAdminSession } from '../../lib/admin-auth.js';
import {
  readVisualEditorState,
  saveVisualEditorDraft
} from '../../lib/admin-store.js';
import {
  readConciergeControlState,
  saveConciergeDraft
} from '../../lib/concierge-control-store.js';
import { applyAssistantChange } from '../../lib/admin-assistant.js';
import { recordSystemEvent } from '../../lib/system-store.js';

function noCache(res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
}

function bodyOf(req){
  if(req.body&&typeof req.body==='object') return req.body;
  if(typeof req.body==='string'){
    try{return JSON.parse(req.body)}catch{return {}}
  }
  return {};
}

export default async function handler(req,res){
  noCache(res);
  if(!getAdminSession(req)) return res.status(401).json({error:'Owner session required.'});
  if(req.method!=='POST') return res.status(405).json({error:'Use POST.'});

  const body=bodyOf(req);
  const change=body.change;
  if(!change||typeof change!=='object') return res.status(400).json({error:'Choose a proposal to apply.'});

  try{
    const [website,concierge]=await Promise.all([
      readVisualEditorState(),
      readConciergeControlState()
    ]);
    if(!website.persistent||!concierge.persistent){
      return res.status(503).json({error:'Draft storage is temporarily unavailable.'});
    }

    const applied=applyAssistantChange(change,{
      websiteDraft:website.draft,
      conciergeDraft:concierge.draft,
      enforceBasis:true
    });

    if(applied.change.target==='website'){
      const saved=await saveVisualEditorDraft(applied.websiteDraft,'Rebecca AI Admin Assistant');
      try{await recordSystemEvent({area:'Website',type:'draft',summary:'AI Admin Assistant applied a proposal to Website Draft only.',source:'AI Admin Assistant'});}catch{}
      return res.status(200).json({
        ok:true,
        target:'website',
        destination:'Website Draft',
        hasDraftChanges:saved.hasDraftChanges,
        message:'Applied to Website Draft only. Nothing was published.'
      });
    }

    const saved=await saveConciergeDraft(applied.conciergeDraft,'Rebecca AI Admin Assistant');
    try{await recordSystemEvent({area:'Concierge',type:'draft',summary:'AI Admin Assistant applied a proposal to Concierge Draft only.',source:'AI Admin Assistant'});}catch{}
    return res.status(200).json({
      ok:true,
      target:'concierge',
      destination:'Concierge Draft',
      hasDraftChanges:saved.hasDraftChanges,
      message:'Applied to Concierge Draft only. Nothing was published.'
    });
  }catch(error){
    if(error?.code==='ASSISTANT_PROPOSAL_STALE'){
      return res.status(409).json({error:error.message,stale:true});
    }
    if(error?.code==='ASSISTANT_CHANGE_INVALID'||error?.code==='ASSISTANT_NO_CHANGE'){
      return res.status(400).json({error:error.message});
    }
    if(error?.code==='STORE_CONFLICT'){
      return res.status(409).json({error:'The Draft changed while applying this proposal. Generate a fresh proposal.',stale:true});
    }
    if(error?.code==='STORE_NOT_CONFIGURED'||error?.code==='STORE_UNAVAILABLE'){
      return res.status(503).json({error:'Draft storage is temporarily unavailable.'});
    }
    console.error('RC-08 apply failed:',error);
    return res.status(500).json({error:'Could not apply that proposal safely.'});
  }
}
