import { getAdminSession } from '../../lib/admin-auth.js';
import { buildLaunchReadiness } from '../../lib/launch-readiness.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(!getAdminSession(req)) return res.status(401).json({error:'Owner session required.'});
  if(req.method!=='GET') return res.status(405).json({error:'Use GET.'});
  try {return res.status(200).json({ok:true,...await buildLaunchReadiness()});}
  catch(error){
    console.error('RC-QA-07 launch readiness failed:',error?.code||'READ_FAILED');
    return res.status(500).json({error:'Launch-readiness checks could not be completed.'});
  }
}
