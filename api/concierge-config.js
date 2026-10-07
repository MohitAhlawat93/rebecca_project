import {
  getPublishedConciergeControl,
  publicConciergeUiConfig
} from '../lib/concierge-control-store.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=60');
  if(req.method!=='GET') return res.status(405).json({error:'Use GET.'});
  const control=await getPublishedConciergeControl();
  return res.status(200).json({ok:true,config:publicConciergeUiConfig(control)});
}
