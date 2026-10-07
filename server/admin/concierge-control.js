import { getAdminSession } from '../../lib/admin-auth.js';
import {
  conciergeControlConfigured,
  discardConciergeDraft,
  publishConciergeDraft,
  readConciergeControlState,
  restoreConciergeHistoryVersion,
  saveConciergeDraft
} from '../../lib/concierge-control-store.js';
import { recordSystemEvent, safeCaptureRecoverySnapshot } from '../../lib/system-store.js';

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

function shape(state){
  return {
    ok:true,
    configured:conciergeControlConfigured(),
    ...state
  };
}

export default async function handler(req,res){
  noCache(res);
  if(!getAdminSession(req)) return res.status(401).json({error:'Owner session required.'});

  try{
    if(req.method==='GET') return res.status(200).json(shape(await readConciergeControlState()));

    if(req.method==='PUT'){
      const body=bodyOf(req);
      return res.status(200).json(shape(await saveConciergeDraft(body.state,'Rebecca Concierge Control')));
    }

    if(req.method==='POST'){
      const body=bodyOf(req);
      if(body.action==='publish'){
        await safeCaptureRecoverySnapshot('Before Concierge publish','AI Control');
        const state=await publishConciergeDraft('Rebecca Concierge Control');
        try{
          await recordSystemEvent({
            area:'Concierge',
            type:'publish',
            summary:'Concierge Draft was published to visitors.',
            source:'AI Control'
          });
        }catch{}
        return res.status(200).json(shape(state));
      }
      if(body.action==='discard') return res.status(200).json(shape(await discardConciergeDraft('Rebecca Concierge Control')));
      if(body.action==='restore'){
        return res.status(200).json(shape(await restoreConciergeHistoryVersion(body.version,'Rebecca Concierge Control')));
      }
      return res.status(400).json({error:'Unknown Concierge Control action.'});
    }

    return res.status(405).json({error:'Use GET, PUT or POST.'});
  }catch(error){
    if(error?.code==='STORE_CONFLICT') return res.status(409).json({error:error.message});
    if(error?.code==='STORE_NOT_CONFIGURED'||error?.code==='STORE_UNAVAILABLE'){
      return res.status(503).json({error:'Concierge Control is temporarily unavailable.'});
    }
    if(error?.code==='CONCIERGE_DRAFT_EMPTY'||error?.code==='CONCIERGE_HISTORY_NOT_FOUND'){
      return res.status(409).json({error:error.message});
    }
    console.error('RC-06 Concierge Control API failed:',error);
    return res.status(500).json({error:'Could not update Concierge Control safely.'});
  }
}
