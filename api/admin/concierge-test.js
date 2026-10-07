import { getAdminSession } from '../../lib/admin-auth.js';
import { getEffectiveRebeccaData } from '../../lib/admin-store.js';
import { readConciergeControlState } from '../../lib/concierge-control-store.js';
import { generateConciergeAnswer } from '../concierge.js';

function noCache(res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
}

export default async function handler(req,res){
  noCache(res);
  if(!getAdminSession(req)) return res.status(401).json({error:'Owner session required.'});
  if(req.method!=='POST') return res.status(405).json({error:'Use POST.'});

  const body=req.body&&typeof req.body==='object'?req.body:{};
  const message=typeof body.message==='string'?body.message.trim().slice(0,600):'';
  if(!message) return res.status(400).json({error:'Enter a test question.'});

  const history=Array.isArray(body.history)?body.history.slice(-8).map((item)=>({
    role:item?.role==='assistant'?'assistant':'user',
    content:typeof item?.content==='string'?item.content.trim().slice(0,800):''
  })).filter((item)=>item.content):[];

  const [effective,controlState]=await Promise.all([
    getEffectiveRebeccaData(),
    readConciergeControlState()
  ]);

  const result=await generateConciergeAnswer({
    message,
    history,
    page:typeof body.page==='string'?body.page.trim().slice(0,120):'/',
    language:'en',
    currentData:effective.data,
    control:controlState.draft
  });

  return res.status(200).json({
    ok:true,
    source:'draft',
    hasDraftChanges:controlState.hasDraftChanges,
    ...result
  });
}
