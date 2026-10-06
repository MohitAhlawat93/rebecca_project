const RATE_WINDOW_MS=60_000;
const RATE_MAX=8;
const buckets=globalThis.__REBECCA_NEWSLETTER_RATE__||(globalThis.__REBECCA_NEWSLETTER_RATE__=new Map());

function rateAllowed(req){
  const forwarded=req.headers['x-forwarded-for'];
  const key=(Array.isArray(forwarded)?forwarded[0]:String(forwarded||req.headers['x-real-ip']||'anonymous').split(',')[0]).trim();
  const now=Date.now();
  let bucket=buckets.get(key);
  if(!bucket||now>=bucket.resetAt) bucket={count:0,resetAt:now+RATE_WINDOW_MS};
  bucket.count+=1;buckets.set(key,bucket);
  return bucket.count<=RATE_MAX;
}
function clean(value,max){return String(value||'').trim().replace(/[\r\n<>]/g,' ').slice(0,max)}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=180}
function configuration(){
  const url=String(process.env.NEWSLETTER_WEBHOOK_URL||'').trim();
  return {configured:/^https:\/\//i.test(url),url};
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const cfg=configuration();
  if(req.method==='GET') return res.status(200).json({configured:cfg.configured});
  if(req.method!=='POST') return res.status(405).json({error:'Use GET or POST.'});
  if(!rateAllowed(req)) return res.status(429).json({error:'Too many sign-up attempts. Please wait a moment.'});
  if(!cfg.configured){
    return res.status(200).json({
      ok:false,
      configured:false,
      message:'Email updates are ready for provider connection. For now, Rebecca Afterhours is the active public update channel.',
      fallbackUrl:'https://tinyurl.com/rebecca-afterhours'
    });
  }
  const body=req.body||{};
  const firstName=clean(body.firstName,80);
  const lastName=clean(body.lastName,80);
  const email=clean(body.email,180).toLowerCase();
  const locale=clean(body.locale,16);
  const sourcePath=clean(body.sourcePath,160);
  if(!validEmail(email)) return res.status(400).json({error:'Please enter a valid email address.'});
  const payload={email,firstName,lastName,source:'risque-rebecca-website',sourcePath,locale,consent:'website-newsletter-form',submittedAt:new Date().toISOString()};
  try{
    const headers={'Content-Type':'application/json','User-Agent':'Risque-Rebecca-Website/1.0'};
    const token=String(process.env.NEWSLETTER_WEBHOOK_TOKEN||'').trim();
    if(token) headers.Authorization=`Bearer ${token}`;
    const response=await fetch(cfg.url,{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw new Error('newsletter provider rejected request');
    return res.status(200).json({ok:true,configured:true,message:'You’re on the list. Please check your inbox if the provider uses double opt-in.'});
  }catch{
    return res.status(502).json({error:'The email list is temporarily unavailable. Please try again later or use Rebecca Afterhours.'});
  }
}
