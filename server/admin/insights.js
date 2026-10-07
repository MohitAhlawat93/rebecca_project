import { getAdminSession } from '../../lib/admin-auth.js';
import { buildOwnerInsights } from '../../lib/owner-insights.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');

  if(!getAdminSession(req)) return res.status(401).json({error:'Owner session required.'});
  if(req.method!=='GET') return res.status(405).json({error:'Use GET.'});

  try{
    return res.status(200).json({ok:true,...await buildOwnerInsights()});
  }catch(error){
    console.error('RC-10 Insights failed:',error);
    return res.status(500).json({error:'Could not build Rebecca Control Insights safely.'});
  }
}
