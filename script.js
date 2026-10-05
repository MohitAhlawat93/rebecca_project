(() => {
  const header=document.querySelector('[data-header]');
  const onScroll=()=>header?.classList.toggle('is-scrolled',window.scrollY>24);
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});
  const currentPath=(window.location.pathname.replace(/\/$/,'')||'/');
  document.querySelectorAll('.desktop-nav a,.mobile-menu a,.footer-links a').forEach((link)=>{
    const href=(new URL(link.href,window.location.origin)).pathname.replace(/\/$/,'')||'/';
    if(href===currentPath) link.setAttribute('aria-current','page');
  });

  const menuToggle=document.querySelector('[data-menu-toggle]');
  const mobileMenu=document.querySelector('[data-mobile-menu]');
  const setMenu=(open)=>{if(!menuToggle||!mobileMenu)return;mobileMenu.hidden=!open;menuToggle.setAttribute('aria-expanded',String(open));menuToggle.textContent=open?'Close':'Menu';document.body.classList.toggle('menu-open',open);};
  menuToggle?.addEventListener('click',()=>setMenu(mobileMenu?.hidden??true));
  mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){setMenu(false);if(!document.querySelector('[data-concierge-panel]')?.hidden)setConcierge(false);}});

  const reviews=[...document.querySelectorAll('[data-review]')],counter=document.querySelector('[data-review-count]'); let current=0;
  const showReview=(i)=>{if(!reviews.length)return;current=(i+reviews.length)%reviews.length;reviews.forEach((r,n)=>{r.hidden=n!==current;r.classList.toggle('is-active',n===current)});if(counter)counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(reviews.length).padStart(2,'0')}`;};
  document.querySelector('[data-review-prev]')?.addEventListener('click',()=>showReview(current-1));
  document.querySelector('[data-review-next]')?.addEventListener('click',()=>showReview(current+1)); showReview(0);

  const escapeHtml=(text)=>{const d=document.createElement('div');d.textContent=text;return d.innerHTML};
  document.body.insertAdjacentHTML('beforeend',`
    <button class="concierge-launcher" type="button" data-open-concierge aria-label="Open Rebecca's concierge" aria-expanded="false" aria-controls="rebecca-concierge"><span class="spark" aria-hidden="true">✦</span><span>Ask the concierge</span></button>
    <aside class="concierge-panel" id="rebecca-concierge" data-concierge-panel hidden role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="rebecca-concierge-title">
      <div class="concierge-panel-head"><div><strong id="rebecca-concierge-title">Rebecca’s Concierge</strong><small>A little help, discreetly.</small></div><button class="concierge-close" type="button" data-close-concierge aria-label="Close concierge">×</button></div>
      <div class="concierge-thread" data-concierge-thread aria-live="polite"><div class="chat-message assistant"><p>Hi ✦ I’m Rebecca’s concierge.</p><p>Ask me anything about her, or just say hello.</p></div></div>
      <div class="concierge-chips"><button class="concierge-chip" type="button" data-chat-prompt="What are Rebecca's Singapore rates?">Singapore rates</button><button class="concierge-chip" type="button" data-chat-prompt="How does screening work?">Screening</button><button class="concierge-chip" type="button" data-chat-prompt="Can Rebecca travel to me?">Travel</button></div>
      <form class="concierge-form" data-concierge-form><input type="text" maxlength="600" autocomplete="off" placeholder="Ask something discreetly…" aria-label="Message Rebecca's concierge" required><button class="concierge-send" type="submit" aria-label="Send">↗</button></form>
      <p class="concierge-disclaimer">Please don’t send ID documents, employer details or other sensitive screening information here. Use Rebecca’s official channels for screening.</p>
    </aside>`);

  const panel=document.querySelector('[data-concierge-panel]'),thread=document.querySelector('[data-concierge-thread]'),form=document.querySelector('[data-concierge-form]'),input=form?.querySelector('input'),send=form?.querySelector('[type="submit"]');let conciergeReturnFocus=null;
  const setConcierge=(open)=>{if(!panel)return;const launcher=document.querySelector('.concierge-launcher');if(open)conciergeReturnFocus=document.activeElement;panel.hidden=!open;panel.setAttribute('aria-hidden',String(!open));launcher?.toggleAttribute('hidden',open);launcher?.setAttribute('aria-expanded',String(open));document.body.classList.toggle('concierge-open',open);if(open)setTimeout(()=>input?.focus(),60);else if(conciergeReturnFocus instanceof HTMLElement)conciergeReturnFocus.focus()};
  document.querySelectorAll('[data-open-concierge]').forEach(b=>b.addEventListener('click',()=>setConcierge(true)));
  document.querySelector('[data-close-concierge]')?.addEventListener('click',()=>setConcierge(false));
  panel?.addEventListener('keydown',(event)=>{if(event.key!=='Tab')return;const focusable=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
  const chatHistory=[];
  const formatChatText=(text='')=>{
    const normalized=String(text)
      .replace(/\\\r?\\n/g,'\n')
      .replace(/\\([*_-])/g,'$1')
      .replace(/\r\n/g,'\n')
      .trim();
    const safe=escapeHtml(normalized);
    const lines=safe.split('\n');
    const out=[];
    let inList=false;
    const closeList=()=>{if(inList){out.push('</ul>');inList=false;}};
    for(const rawLine of lines){
      const line=rawLine.trim();
      if(!line){closeList();continue;}
      const bullet=line.match(/^[-•]\s+(.*)$/);
      if(bullet){
        if(!inList){out.push('<ul>');inList=true;}
        out.push('<li>'+bullet[1].replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</li>');
        continue;
      }
      closeList();
      out.push('<p>'+line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</p>');
    }
    closeList();
    return out.join('');
  };
  const addMessage=(role,text,extra='')=>{if(!thread)return null;const el=document.createElement('div');el.className=`chat-message ${role} ${extra}`.trim();el.innerHTML=formatChatText(text);thread.appendChild(el);thread.scrollTop=thread.scrollHeight;return el};
  const remember=(role,content)=>{chatHistory.push({role,content:String(content).slice(0,800)});if(chatHistory.length>8)chatHistory.splice(0,chatHistory.length-8);};
  async function askConcierge(message){const q=message.trim();if(!q)return;addMessage('user',q);remember('user',q);const pending=addMessage('assistant','Just a moment ✦','pending');if(input)input.disabled=true;if(send)send.disabled=true;try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,history:chatHistory.slice(0,-1)})});const data=await r.json();if(!r.ok)throw new Error(data?.error||'Concierge unavailable');pending?.remove();addMessage('assistant',data.answer);remember('assistant',data.answer);if(data.suggestion?.path){const link=document.createElement('a');link.className='chat-suggestion';link.href=data.suggestion.path;link.textContent=data.suggestion.label+' →';thread?.appendChild(link);if(thread)thread.scrollTop=thread.scrollHeight}}catch{pending?.remove();const message='I’m having a little trouble right now. Try again in a moment, or use Rebecca’s official contact page.';addMessage('assistant',message,'error');remember('assistant',message)}finally{if(send)send.disabled=false;if(input){input.disabled=false;input.value='';input.focus()}}}
  form?.addEventListener('submit',e=>{e.preventDefault();if(input)askConcierge(input.value)});
  document.querySelectorAll('[data-chat-prompt]').forEach(b=>b.addEventListener('click',()=>askConcierge(b.getAttribute('data-chat-prompt')||'')));

  const enquiry=document.querySelector('[data-enquiry-form]');
  if(enquiry){const status=enquiry.querySelector('[data-form-status]');const build=()=>{const d=new FormData(enquiry);return ['Hello Rebecca,','','I’d like to introduce myself and enquire about a date.','',`Name / alias: ${d.get('name')||''}`,`Current city: ${d.get('city')||''}`,`Preferred date / window: ${d.get('date')||''}`,`Preferred duration: ${d.get('duration')||''}`,`Location / travel request: ${d.get('location')||''}`,`New or returning: ${d.get('relationship')||''}`,`Screening route I can provide privately: ${d.get('screening')||''}`,'',`Note: ${d.get('note')||''}`,'','I understand screening details and ID documents should be sent privately through Rebecca’s official channel, not through this website form.'].join('\n')};
    enquiry.querySelector('[data-email-enquiry]')?.addEventListener('click',()=>{if(!enquiry.reportValidity())return;window.location.href=`mailto:risquerebeccaxo@protonmail.com?subject=${encodeURIComponent('Date enquiry for Risqué Rebecca')}&body=${encodeURIComponent(build())}`});
    enquiry.querySelector('[data-whatsapp-enquiry]')?.addEventListener('click',()=>{if(!enquiry.reportValidity())return;window.open('https://wa.me/6585282912?text='+encodeURIComponent(build()),'_blank','noopener,noreferrer')});
    enquiry.querySelector('[data-copy-enquiry]')?.addEventListener('click',async()=>{if(!enquiry.reportValidity())return;try{await navigator.clipboard.writeText(build());if(status)status.textContent='Enquiry copied. Paste it into Rebecca’s verified WhatsApp, Telegram or email.'}catch{if(status)status.textContent='Copy was blocked by your browser. Use the email button instead.'}});
  }
})();