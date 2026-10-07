import { getAdminSession } from '../../lib/admin-auth.js';
import {
  buildExportBundle,
  captureRecoverySnapshot,
  readSystemState,
  restoreBundleToDraft,
  restoreSnapshotToDraft
} from '../../lib/system-store.js';

function noCache(res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
}
function bodyOf(req){
  if(req.body&&typeof req.body==='object')return req.body;
  if(typeof req.body==='string'){try{return JSON.parse(req.body)}catch{return {}}}
  return {};
}
function shape(state){
  return {
    ok:true,
    ...state,
    summary:{
      events:state.events.length,
      recoveryPoints:state.snapshots.length
    }
  };
}
export default async function handler(req,res){
  noCache(res);
  if(!getAdminSession(req))return res.status(401).json({error:'Owner session required.'});
  try{
    if(req.method==='GET'){
      if(String(req.query?.action||'')==='export'){
        return res.status(200).json({ok:true,bundle:await buildExportBundle()});
      }
      return res.status(200).json(shape(await readSystemState()));
    }
    if(req.method==='POST'){
      const body=bodyOf(req);
      if(body.action==='snapshot'){
        await captureRecoverySnapshot(body.label||'Manual recovery point','Rebecca');
        return res.status(200).json(shape(await readSystemState()));
      }
      if(body.action==='restoreSnapshot'){
        await restoreSnapshotToDraft(body.id,'Rebecca Recovery');
        return res.status(200).json({
          ok:true,
          restored:true,
          destination:'Draft only',
          message:'Recovery point restored to Website, Concierge and Media Drafts. Nothing was published.'
        });
      }
      if(body.action==='restoreBundle'){
        await restoreBundleToDraft(body.bundle,'Rebecca Backup Import');
        return res.status(200).json({
          ok:true,
          restored:true,
          destination:'Draft only',
          message:'Backup restored to Website, Concierge and Media Drafts. Nothing was published.'
        });
      }
      return res.status(400).json({error:'Unknown system action.'});
    }
    return res.status(405).json({error:'Use GET or POST.'});
  }catch(error){
    if(error?.code==='STORE_UNAVAILABLE')return res.status(503).json({error:'History & Recovery is temporarily unavailable.'});
    if(error?.code==='SNAPSHOT_NOT_FOUND')return res.status(404).json({error:error.message});
    if(error?.code==='BACKUP_INVALID')return res.status(400).json({error:error.message});
    if(error?.code==='STORE_CONFLICT')return res.status(409).json({error:'History changed while you were working. Reload and try again.'});
    console.error('RC-09 system API failed:',error);
    return res.status(500).json({error:'Could not complete that History & Recovery action safely.'});
  }
}
