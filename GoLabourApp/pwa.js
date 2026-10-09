/* GoLabour app: installation, offline access and existing timesheet-copy recovery. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const api = window.GoLabourTimesheet;
  const help = $('helpDialog');
  let waitingWorker, updateRequested = false, offlineReady = false, installPrompt;
  function openHelp() { if (!help.open) help.showModal(); }
  function closeHelp() { help.close(); }
  $('appHelp').addEventListener('click', openHelp);
  $('closeHelp').addEventListener('click', closeHelp);
  $('doneHelp').addEventListener('click', closeHelp);
  help.addEventListener('click', event => { if (event.target === help) { const r=help.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeHelp(); } });
  const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  $('installGuide').hidden = installed();
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault();installPrompt=event; });
  window.addEventListener('appinstalled', () => { $('installGuide').hidden=true;installPrompt=null; });
  $('installGuide').addEventListener('click', async () => {
    if (!installPrompt) { openHelp();return; }
    const prompt=installPrompt;installPrompt=null;
    try { await prompt.prompt();if((await prompt.userChoice).outcome==='accepted')$('installGuide').hidden=true; }
    catch (_) { openHelp(); }
  });
  function connectivity() {
    const offline=navigator.onLine===false;
    $('connectionPill').textContent=offline?'Offline':offlineReady?'Offline ready':'Online';
    $('connectionPill').classList.toggle('offline',offline);
  }
  window.addEventListener('online',connectivity);window.addEventListener('offline',connectivity);connectivity();
  function markReady() { offlineReady=true;$('offlineStatus').textContent='Offline ready. Complete timesheets, calculate shifts and export invoices without a connection.';connectivity(); }
  function offerUpdate(worker) { waitingWorker=worker;$('appUpdate').hidden=false; }
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(registration=>{
      navigator.serviceWorker.ready.then(markReady);
      if(registration.waiting&&navigator.serviceWorker.controller)offerUpdate(registration.waiting);
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;if(!worker)return;
        worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offerUpdate(worker);});
      });
      registration.update().catch(()=>{});
    }).catch(()=>{ $('offlineStatus').textContent='Offline access could not be prepared. Reopen the published link online.'; });
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updateRequested)location.reload();});
  } else $('offlineStatus').textContent='Open the published HTTPS link online to enable offline access.';
  function meaningful(state) {
    return state.workers.some(name=>String(name).trim())||['location','startTime','finishTime','breakMinutes','message','supervisorName','companyName'].some(id=>state.fields[id])||state.strokes.some(stroke=>Array.isArray(stroke)&&stroke.length>1);
  }
  $('applyUpdate').addEventListener('click',()=>{
    if(!waitingWorker)return;
    const invoiceUnsaved=window.GoLabourInvoice?.hasUnsavedChanges();
    if((meaningful(api.captureState())||invoiceUnsaved)&&!confirm('Update now? Save your current timesheet photo/PDF and any unsaved invoice calculation first. The current forms will be cleared. Saved calculations remain on this phone.'))return;
    updateRequested=true;waitingWorker.postMessage({type:'SKIP_WAITING'});
  });

  // Keep older device-local copies accessible without creating new saved reports.
  // This version never writes, deletes or replaces those storage keys.
  const prefix='golabour-app:'+new URL('./',location.href).pathname+':';
  function read(key,fallback) { try { const value=localStorage.getItem(prefix+key);return value===null?fallback:JSON.parse(value); }catch(_){return fallback;} }
  function validState(state) { return state?.version===1&&state.fields&&typeof state.fields==='object'&&Array.isArray(state.workers)&&Array.isArray(state.strokes); }
  const stored=read('records-v1',[]);
  const records=Array.isArray(stored)?stored.filter(record=>validState(record?.state)).slice(0,20):[];
  const draft=read('draft-v1',null);
  const copies=records.map(record=>({state:record.state,report:record.report,draft:false}));
  if(validState(draft?.state)&&meaningful(draft.state)&&!records.some(record=>JSON.stringify(record.state)===JSON.stringify(draft.state)))copies.unshift({state:draft.state,draft:true});
  if(copies.length) {
    $('previousReports').hidden=false;$('previousCount').textContent='('+copies.length+')';
    for(const copy of copies) {
      const row=document.createElement('article');row.className='previous-copy';
      const info=document.createElement('div');
      const title=document.createElement('strong');title.textContent=copy.draft?'Previous draft':String(copy.state.workers[0]||'Timesheet').slice(0,100)+(copy.state.workers.length>1?' + '+(copy.state.workers.length-1)+' more':'');
      const detail=document.createElement('small');detail.textContent=[copy.state.fields.shiftDate,copy.state.fields.location].filter(Boolean).join(' · ').slice(0,200);
      const open=document.createElement('button');open.type='button';open.textContent='Open';
      open.addEventListener('click',()=>{
        const current=api.captureState();
        if(meaningful(current)&&JSON.stringify(current)!==JSON.stringify(copy.state)&&!confirm('Open this previous copy in place of the current form? The stored copy will stay on this phone.'))return;
        try { api.restoreState(copy.state);requestAnimationFrame(api.refreshSignature);$('workerHeading').scrollIntoView({behavior:'smooth',block:'start'});api.feedback('Previous copy opened. Save or share the signed photo/PDF to keep a separate copy.'); }
        catch (_) { api.feedback('This previous copy could not be opened. Its stored data has not been changed.',true); }
      });
      info.append(title,detail);row.append(info,open);$('previousList').append(row);
    }
  }
  if(['#home','#timesheet','#saved'].includes(location.hash))history.replaceState(null,'',location.pathname+location.search);
})();
