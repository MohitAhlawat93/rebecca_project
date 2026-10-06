const LANGUAGE_NAMES={
  en:'English',
  'zh-CN':'Simplified Chinese',
  hi:'Hindi',
  fr:'French',
  es:'Spanish'
};

const RATE_WINDOW_MS=60_000;
const RATE_MAX=30;
const buckets=globalThis.__REBECCA_TRANSLATE_RATE__||(globalThis.__REBECCA_TRANSLATE_RATE__=new Map());

function allowRequest(req){
  const forwarded=req.headers['x-forwarded-for'];
  const key=(Array.isArray(forwarded)?forwarded[0]:String(forwarded||req.headers['x-real-ip']||'anonymous').split(',')[0]).trim();
  const now=Date.now();
  let bucket=buckets.get(key);
  if(!bucket||now>=bucket.resetAt) bucket={count:0,resetAt:now+RATE_WINDOW_MS};
  bucket.count+=1;buckets.set(key,bucket);
  return bucket.count<=RATE_MAX;
}

function parseJson(content=''){
  try{return JSON.parse(content)}catch{}
  const match=String(content).match(/\{[\s\S]*\}/);
  if(!match) return null;
  try{return JSON.parse(match[0])}catch{return null}
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Use POST for translation.'});
  if(!allowRequest(req)) return res.status(429).json({error:'Too many translation requests.'});

  const body=req.body||{};
  const language=LANGUAGE_NAMES[body.language]?body.language:null;
  const texts=Array.isArray(body.texts)?body.texts.slice(0,50).map((value)=>String(value??'').slice(0,900)):[];
  const total=texts.reduce((sum,value)=>sum+value.length,0);
  if(!language||!texts.length||total>16000) return res.status(400).json({error:'Invalid translation request.'});
  if(!process.env.GROQ_API_KEY) return res.status(200).json({translations:texts,mode:'source-fallback'});

  const system=`You are a precision website translator. Translate each input string independently into ${LANGUAGE_NAMES[language]}.
Return ONLY valid JSON in exactly this shape: {"translations":["..."]}.
The translations array must have exactly the same number of items and the same order as the input.
Preserve all numbers, prices, currency symbols/codes, dates, durations, phone numbers, emails, URLs, @handles, brand names, publication names, and the names Rebecca and Risqué Rebecca exactly.
Do not add facts, remove facts, censor, explain, summarise, soften, or change booking terms. Preserve the tone and meaning. If a string is already in the target language, return it unchanged.`;

  try{
    const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{Authorization:`Bearer ${process.env.GROQ_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:process.env.GROQ_MODEL||'openai/gpt-oss-20b',
        temperature:0,
        max_completion_tokens:6000,
        response_format:{type:'json_object'},
        messages:[
          {role:'system',content:system},
          {role:'user',content:JSON.stringify({texts})}
        ]
      })
    });
    if(!response.ok) throw new Error('translation provider error');
    const data=await response.json();
    const parsed=parseJson(data?.choices?.[0]?.message?.content||'');
    if(!Array.isArray(parsed?.translations)||parsed.translations.length!==texts.length) throw new Error('invalid translation shape');
    const translations=parsed.translations.map((value,index)=>typeof value==='string'?value:texts[index]);
    return res.status(200).json({translations,mode:'translated'});
  }catch{
    return res.status(200).json({translations:texts,mode:'source-fallback'});
  }
}
