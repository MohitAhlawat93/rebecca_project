// RC-QA-07 launch review is read-only. Owner checkmarks are ephemeral
// and cannot authorize publishing, indexing, DNS changes or signoff.
let rcLaunchRequest = 0;
const launchPanel = document.querySelector('[data-panel="launch"]');
const launchStatus = (selector, value) => {
  const el=document.querySelector(selector);
  if(el) el.textContent=value;
};
function launchRender(data) {
  const list=document.querySelector('[data-launch-checks]');
  if(!list)return;
  list.replaceChildren();
  for(const item of data.checks || []) {
    const section=document.createElement('article');
    section.className='rc-launch-check';
    const row=document.createElement('div');
    row.className='rc-launch-check-heading';
    const name=document.createElement('strong');
    name.textContent=item.label;
    const state=document.createElement('span');
    state.className='rc-launch-state';
    state.dataset.state=['pass','block','pending'].includes(item.status)?item.status:'pending';
    state.textContent={pass:'Check passed',block:'Blocked',pending:'Needs confirmation'}[state.dataset.state];
    const detail=document.createElement('p');
    detail.textContent=item.detail;
    row.append(name,state);
    section.append(row,detail);
    list.append(section);
  }
  launchStatus('[data-launch-decision]','NOT SIGNED OFF');
  launchStatus('[data-launch-pass]',String(data.summary?.passed ?? 0));
  launchStatus('[data-launch-open]',
    String((data.summary?.blocked ?? 0)+(data.summary?.pending ?? 0)));
  launchStatus('[data-launch-feedback]',
    'Checked saved, owner-only operational status. The checklist below requires independent proof and owner approval.');
}
function launchUnavailable(message) {
  launchStatus('[data-launch-decision]','NOT SIGNED OFF');
  launchStatus('[data-launch-pass]','—');
  launchStatus('[data-launch-open]','—');
  const list=document.querySelector('[data-launch-checks]');
  if(list)list.replaceChildren();
  launchStatus('[data-launch-feedback]',message);
}
async function launchLoad() {
  const id=++rcLaunchRequest;
  const button=document.querySelector('[data-launch-refresh]');
  if(button)button.disabled=true;
  launchStatus('[data-launch-feedback]','Checking protected storage and current readiness…');
  try {
    const response=await fetch('/api/admin/launch-readiness',{
      method:'GET',credentials:'same-origin',cache:'no-store',
      headers:{Accept:'application/json'}
    });
    const data=await response.json().catch(()=>({}));
    if(id!==rcLaunchRequest)return;
    if(!response.ok)throw new Error(response.status===401
      ? 'Your owner session expired. Please sign in again before reviewing launch.'
      : data.error||'Launch readiness could not be verified.');
    launchRender(data);
  }catch(error){
    if(id===rcLaunchRequest)launchUnavailable(error?.message||'Launch readiness is unavailable; do not approve launch.');
  }finally{
    if(id===rcLaunchRequest && button)button.disabled=false;
  }
}
const launchAnswers=() => [...document.querySelectorAll('[data-launch-accept]')];
function launchUpdateCount(){
  const checks=launchAnswers();
  launchStatus('[data-launch-owner-progress]',
    checks.filter(input=>input.checked).length+' of '+checks.length+
    ' owner checks reviewed · No approval is stored');
}
async function launchCopyReview(){
  const boxes=launchAnswers();
  const current=[...document.querySelectorAll('[data-launch-check]')].map(row=>
    row.querySelector('strong')?.textContent+': '+
    row.querySelector('.rc-launch-state')?.textContent);
  const notes=[
    'Rebecca Control — prelaunch review (NOT SIGNED OFF)',
    'Review recorded (local clock): '+new Date().toISOString(),
    'Status review: '+(current.join('; ')||'Unavailable'),
    ...boxes.map(box=>(box.checked?'[reviewed] ':'[pending] ')+box.nextElementSibling.textContent.trim()),
    'This is a review worksheet, NOT owner approval or evidence of real tests.',
    'Owner name, approval date and independent evidence must be recorded separately.'
  ].join('\n');
  try{
    if(!navigator.clipboard?.writeText)throw new Error('Clipboard access unavailable');
    await navigator.clipboard.writeText(notes);
    launchStatus('[data-launch-copy-status]','Review notes copied. They do not authorize launch.');
  }catch{
    launchStatus('[data-launch-copy-status]','Clipboard unavailable. Review the checklist here or use the owner handbook to record evidence.');
  }
}
document.addEventListener('click',event=>{
  if(event.target.closest('[data-launch-refresh]'))launchLoad();
  if(event.target.closest('[data-launch-copy]'))launchCopyReview();
  if(event.target.closest('[data-launch-reset]')){
    for(const box of launchAnswers())box.checked=false;
    launchUpdateCount();
    launchStatus('[data-launch-copy-status]','Checklist reset. No approval was stored.');
  }
});
document.addEventListener('change',event=>{
  if(event.target.matches('[data-launch-accept]'))launchUpdateCount();
});
document.addEventListener('rc:admin-tab',event=>{
  if(event.detail?.tab==='launch')launchLoad();
});
document.addEventListener('rc:admin-ready',()=>{
  if(launchPanel && !launchPanel.hidden)launchLoad();
});
launchUpdateCount();
