import { buildDefaultQuickControlState } from '../../lib/admin-store.js';
import { MEDIA_PLACEMENTS } from '../../lib/media-store.js';
import { buildDefaultConciergeControl } from '../../lib/concierge-control-store.js';
import { summarizePublishingStates } from '../../lib/publishing-overview.js';

const clone = v => structuredClone(v);
const now = '2026-10-08T08:00:00.000Z';
const json = (route, value, status = 200) => route.fulfill({
  status, contentType:'application/json; charset=utf-8',
  headers:{ 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex, nofollow' },
  body:JSON.stringify(value)
});

export function createMockAdmin(options = {}) {
  let authenticated = Boolean(options.authenticated);
  let quick = buildDefaultQuickControlState();
  let quickVersion = 3;
  const mediaInitial = {
    library:[
      { id:'p1',url:'/favicon.svg',name:'Fixture photo 1',alt:'Public sample A',source:'legacy' },
      { id:'p2',url:'/favicon.svg?sample=2',name:'Fixture photo 2',alt:'Public sample B',source:'legacy' }
    ],
    placements:Object.fromEntries(MEDIA_PLACEMENTS.map(p=>[p.key,['p1']]))
  };
  let photoDraft=clone(mediaInitial), photoLive=clone(mediaInitial);
  let photoVersion=2, photoLiveVersion=1;
  let aiDraft = buildDefaultConciergeControl(), aiLive = clone(aiDraft), aiVersion=2, aiLiveVersion=1;
  let visualDraftPending=Boolean(options.visualDraftPending);
  let photoSchedule=options.mediaSchedule || null;
  let aiDraftPending=Boolean(options.aiDraftPending);
  const requests=[];

  const api = {
    requests,
    get quick(){return quick;},
    get photoDraft(){return photoDraft;},
    get photoLive(){return photoLive;},
    get aiDraft(){return aiDraft;},
    get aiLive(){return aiLive;},
    get authenticated(){return authenticated;},
    set authenticated(value){authenticated=Boolean(value);},
    count(method, path){return requests.filter(r=>r.method===method && r.path===path).length;},
    setVisualDraftPending(value){visualDraftPending=Boolean(value);}
  };

  async function handle(route) {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const method = req.method();
    let body = {};
    if (['POST','PUT'].includes(method)) {
      try { body=req.postDataJSON() || {}; } catch { body={}; }
    }
    requests.push({method,path,action:body.action||null,body:clone(body)});
    // The fixture intercepts every owner route; nothing can leave the local browser.
    if (path === '/api/admin/session' && method === 'GET') {
      return authenticated ? json(route,{
        authenticated:true,configured:true,
        owner:{name:'Fixture Owner',role:'Owner'},
        control:{status:'Fixture Control',settings:{dashboardStartTab:'insights'}},
        site:{}
      }) : json(route,{authenticated:false,configured:true},401);
    }
    if (path === '/api/admin/login' && method === 'POST') {
      if (body.loginId==='demo-owner' && body.password==='test-only-password') {
        authenticated=true;
        return json(route,{ok:true});
      }
      return json(route,{error:'Invalid owner credentials.'},401);
    }
    if (!authenticated) return json(route,{error:'Owner session required.'},401);
    if (path === '/api/admin/logout' && method === 'POST') {
      authenticated=false; return json(route,{ok:true});
    }
    if (path === '/api/admin/quick-control') {
      if (method === 'GET') return json(route,{
        ok:true,configured:true,persistent:true,version:quickVersion,
        state:clone(quick),effectiveState:clone(quick),updatedAt:now,
        hasVisualDraftChanges:visualDraftPending,schedule:{nextChanges:[],recentChanges:[]}
      });
      if (method === 'PUT') {
        if (visualDraftPending || options.quickConflict || body.expectedVersion !== quickVersion) {
          return json(route,{error:'This content changed or a private draft exists.',code:'STORE_CONFLICT'},409);
        }
        quick=clone(body.state);quickVersion++;
        return json(route,{ok:true,state:clone(quick),effectiveState:clone(quick),version:quickVersion,updatedAt:now,schedule:{nextChanges:[],recentChanges:[]}});
      }
    }
    if (path === '/api/admin/media') {
      const state = {
        ok:true,configured:true,persistent:true,version:photoVersion,
        publishedVersion:photoLiveVersion,draft:clone(photoDraft),published:clone(photoLive),
        hasDraftChanges:JSON.stringify(photoDraft)!==JSON.stringify(photoLive),
        schedule:photoSchedule,schedulePhase:photoSchedule?'pending':'none',
        placements:MEDIA_PLACEMENTS,history:[],updatedAt:now,publishedAt:now
      };
      if (method === 'GET') return json(route,state);
      if (method === 'PUT') {
        photoDraft=clone(body.state);photoVersion++;
        return json(route,{...state,version:photoVersion,draft:clone(photoDraft),hasDraftChanges:JSON.stringify(photoDraft)!==JSON.stringify(photoLive)});
      }
      if (method === 'POST' && body.action==='publish') {
        if (photoSchedule) return json(route,{error:'Scheduled publish blocks manual publish.'},409);
        photoLive=clone(photoDraft);photoVersion++;photoLiveVersion++;
        return json(route,{...state,version:photoVersion,publishedVersion:photoLiveVersion,
          draft:clone(photoDraft),published:clone(photoLive),hasDraftChanges:false});
      }
      if (method === 'POST' && body.action==='restore') {
        photoDraft=clone(photoLive);photoVersion++;
        return json(route,{...state,version:photoVersion,draft:clone(photoDraft),hasDraftChanges:false});
      }
    }
    if (path === '/api/admin/concierge-control') {
      const state = {
        ok:true,configured:true,persistent:true,version:aiVersion,publishedVersion:aiLiveVersion,
        draft:clone(aiDraft),published:clone(aiLive),hasDraftChanges:aiDraftPending || JSON.stringify(aiDraft)!==JSON.stringify(aiLive),
        history:[],publishedAt:now,updatedAt:now
      };
      if (method==='GET') return json(route,state);
      if (method==='PUT') {
        aiDraft=clone(body.state);aiVersion++;aiDraftPending=true;
        return json(route,{...state,version:aiVersion,draft:clone(aiDraft),hasDraftChanges:true});
      }
      if (method==='POST' && body.action==='publish') {
        aiLive=clone(aiDraft);aiDraftPending=false;aiVersion++;aiLiveVersion++;
        return json(route,{...state,version:aiVersion,publishedVersion:aiLiveVersion,published:clone(aiLive),hasDraftChanges:false});
      }
      if (method==='POST' && body.action==='discard') {
        aiDraft=clone(aiLive);aiDraftPending=false;aiVersion++;
        return json(route,{...state,version:aiVersion,draft:clone(aiDraft),hasDraftChanges:false});
      }
    }
    if (path==='/api/admin/concierge-test' && method==='POST') {
      return json(route,{ok:true,answer:'Fixture-only draft response. No publication.',mode:'draft',needsRebecca:false});
    }
    if (path==='/api/admin/publishing-overview' && method==='GET') {
      return json(route,{ok:true,...summarizePublishingStates({
        website:{persistent:true,version:quickVersion,updatedAt:now,hasDraftChanges:visualDraftPending},
        media:{persistent:true,draft:photoDraft,published:photoLive,version:photoVersion,
          publishedVersion:photoLiveVersion,updatedAt:now,publishedAt:now,schedule:photoSchedule},
        concierge:{persistent:true,draft:aiDraft,published:aiLive,hasDraftChanges:aiDraftPending || JSON.stringify(aiDraft)!==JSON.stringify(aiLive),
          version:aiVersion,publishedVersion:aiLiveVersion,publishedAt:now,updatedAt:now}
      })});
    }
    if(path==='/api/admin/insights' && method==='GET') {
      return json(route,{ok:true,privacy:'Mocked operational insights only.',health:{openNeeds:0,recurringNeeds:0,upcomingAutomaticChanges:0,recoveryPoints:1},
        attention:[],recurringQuestions:[],upcoming:[],recentActivity:[]});
    }
    if(path==='/api/admin/system') {
      const saved={ok:true,persistent:true,events:[],snapshots:[
        {id:'fixture-point',label:'Fixture recovery point',at:now}
      ],settings:{dashboardStartTab:'insights',aiAssistantEnabled:true,needsRebeccaCaptureEnabled:true,automaticRecoveryEnabled:true}};
      if (method==='GET') return json(route,saved);
      if (method==='POST') return json(route,saved);
    }
    if(path==='/api/admin/needs-rebecca' && method==='GET') {
      return json(route,{ok:true,persistent:true,items:[],summary:{open:0,drafted:0,closed:0,recurring:0,total:0}});
    }
    if(path==='/api/admin/search-intelligence' && method==='GET') {
      return json(route,{ok:true,connected:false,providers:[],metrics:[],opportunities:[],pages:[],queries:[]});
    }
    return json(route,{error:'Unimplemented fixture route. Production is never contacted.'},404);
  }

  return {api,handle};
}
