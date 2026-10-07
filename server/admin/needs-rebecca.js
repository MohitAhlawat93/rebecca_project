import { getAdminSession } from '../../lib/admin-auth.js';
import {
  clearClosedNeedsRebecca,
  deleteNeedsRebeccaItem,
  readNeedsRebeccaState,
  setNeedsRebeccaStatus
} from '../../lib/needs-rebecca-store.js';

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
  const open=state.items.filter((item)=>item.status==='open').length;
  const drafted=state.items.filter((item)=>item.status==='drafted').length;
  const closed=state.items.filter((item)=>['resolved','ignored'].includes(item.status)).length;
  const recurring=state.items.filter((item)=>item.status==='open'&&item.count>1).length;
  return {
    ok:true,
    ...state,
    summary:{
      open,
      drafted,
      closed,
      recurring,
      total:state.items.length
    }
  };
}

export default async function handler(req,res){
  noCache(res);
  if(!getAdminSession(req)) return res.status(401).json({error:'Owner session required.'});

  try{
    if(req.method==='GET') return res.status(200).json(shape(await readNeedsRebeccaState()));

    if(req.method==='POST'){
      const body=bodyOf(req);
      if(body.action==='status'){
        return res.status(200).json(shape(await setNeedsRebeccaStatus(body.id,body.status,'Rebecca')));
      }
      if(body.action==='delete'){
        return res.status(200).json(shape(await deleteNeedsRebeccaItem(body.id,'Rebecca')));
      }
      if(body.action==='clearClosed'){
        return res.status(200).json(shape(await clearClosedNeedsRebecca('Rebecca')));
      }
      return res.status(400).json({error:'Unknown Needs Rebecca action.'});
    }

    return res.status(405).json({error:'Use GET or POST.'});
  }catch(error){
    if(error?.code==='STORE_UNAVAILABLE'){
      return res.status(503).json({error:'Needs Rebecca is temporarily unavailable.'});
    }
    if(error?.code==='NEEDS_ITEM_NOT_FOUND'){
      return res.status(404).json({error:error.message});
    }
    if(error?.code==='STORE_CONFLICT'){
      return res.status(409).json({error:'Needs Rebecca changed while you were reviewing it. Reload and try again.'});
    }
    console.error('RC-07 Needs Rebecca API failed:',error);
    return res.status(500).json({error:'Could not update Needs Rebecca safely.'});
  }
}
