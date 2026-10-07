export const REBECCA_CONTROL_PHASES = [
  { id:'RC-01', name:'Foundation & Security', type:'phase' },
  { id:'RC-02', name:'Quick Control', type:'phase' },
  { id:'RC-02B', name:'Persistent Quick Control Store', type:'subphase', parent:'RC-02' },
  { id:'RC-03', name:'Media & Publishing', type:'phase' },
  { id:'RC-04', name:'Smart Scheduling & Automatic Expiry', type:'phase' },
  { id:'RC-04B', name:'Scheduled Publishing', type:'subphase', parent:'RC-04' },
  { id:'RC-05', name:'Visual Website Editor', type:'phase' },
  { id:'RC-06', name:'Concierge Control', type:'phase' },
  { id:'RC-07', name:'Needs Rebecca', type:'phase' },
  { id:'RC-08', name:'AI Admin Assistant', type:'phase' },
  { id:'RC-09', name:'History, Export & Recovery', type:'phase' },
  { id:'RC-10', name:'Owner Insights', type:'phase' },
  { id:'RC-11', name:'Settings & Safety Controls', type:'phase' }
];

export function canonicalPhaseLabel(id) {
  const phase = REBECCA_CONTROL_PHASES.find((item) => item.id === id);
  return phase ? phase.id + ' · ' + phase.name : id;
}
