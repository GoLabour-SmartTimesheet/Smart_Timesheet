/* GoLabour app shell. Storage is local to this device and this app's path. */
(() => {
  'use strict';
  const api = window.GoLabourTimesheet;
  const $ = id => document.getElementById(id);
  const base = new URL('./', location.href);
  const prefix = 'golabour-app:' + base.pathname + ':';
  const KEYS = {remember:prefix+'remember-v1',draft:prefix+'draft-v1',records:prefix+'records-v1'};
  const MAX_RECORDS = 20;
  let storageAvailable = true;
  let recordsHealthy = true;
  let activeRecordId = null;
  let saveTimer, toastTimer, waitingWorker, updateRequested = false;
  let lastSavedAt = '';
  let draftDirty = false, draftSaveFailed = false;
  let screen = '';
  function read(key, fallback) {
    try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); }
    catch (_) { storageAvailable = false; return fallback; }
  }
  let remember = read(KEYS.remember, false) === true;
  let records = read(KEYS.records, []);
  if (!Array.isArray(records) || records.some(record => !record || typeof record.id !== 'string' || record.state?.version !== 1 || !Array.isArray(record.report?.names))) {
    records = []; recordsHealthy = false;
  }
  function storageFailure(message) {
    $('storageNotice').textContent = message || 'This browser could not save data. Your form and image exports still work.';
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { storageFailure('Phone storage is unavailable or full. Save a signed photo/PDF as a separate copy.'); return false; }
  }
  function remove(key) {
    try { localStorage.removeItem(key); return true; }
    catch (_) { storageFailure(); return false; }
  }
  function meaningful(state) {
    const fields = state.fields || {};
    return state.workers.some(name => String(name).trim()) || ['location','startTime','finishTime','breakMinutes','message','supervisorName','companyName'].some(id => fields[id]) || state.strokes.some(stroke => stroke.length>1);
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $('appToast').textContent = message; $('appToast').hidden = false;
    toastTimer = setTimeout(() => { $('appToast').hidden = true; }, 4500);
  }
  function storageLabel() {
    if (!remember) return 'Draft storage is off.';
    if (draftSaveFailed) return 'Draft could not be saved on this phone.';
    if (draftDirty) return 'Saving draft on this phone…';
    if (!lastSavedAt) return 'Changes will be saved on this phone.';
    return 'Draft saved on this phone · ' + new Date(lastSavedAt).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'});
  }
  function updateHome() {
    const current = api.captureState();
    const hasCurrent = meaningful(current);
    $('homeContinue').hidden = !hasCurrent;
    $('homeContinue').textContent = remember ? 'Continue my draft' : 'Continue current timesheet';
    $('draftSummary').textContent = hasCurrent ? (remember ? (draftSaveFailed ? 'Your draft could not be saved. Keep this form open.' : (draftDirty ? 'Saving changes on this phone…' : 'Your draft is saved on this phone.')) : 'This form is open. Draft storage is off.') : (remember ? 'Draft saving is on for this phone.' : 'Your form starts fresh on this phone.');
    $('draftStatus').textContent = storageLabel();
    $('savedCount').textContent = records.length;
    $('savedBadge').textContent = records.length;
    $('savedBadge').hidden = records.length === 0;
    $('saveRecord').textContent = activeRecordId && records.some(record=>record.id===activeRecordId) ? 'Copy already kept on this phone' : 'Keep a copy on this phone';
  }
  function flushDraft() {
    clearTimeout(saveTimer);
    if (!remember) return true;
    const state = api.captureState();
    if (!meaningful(state)) { lastSavedAt=''; const ok=remove(KEYS.draft);draftDirty=false;draftSaveFailed=!ok;updateHome();return ok; }
    const updatedAt = new Date().toISOString();
    if (!write(KEYS.draft, {version:1,updatedAt,state,recordId:activeRecordId})) { draftSaveFailed=true;draftDirty=false;updateHome();return false; }
    lastSavedAt=updatedAt;draftDirty=false;draftSaveFailed=false;$('storageNotice').textContent='';updateHome();return true;
  }
  function scheduleSave() {
    activeRecordId = null;
    draftDirty=remember;draftSaveFailed=false;
    updateHome();
    if (remember) { clearTimeout(saveTimer); saveTimer=setTimeout(flushDraft,300); }
  }
  function renderScreen(name) {
    if (!['home','timesheet','saved'].includes(name)) name='home';
    if (name === screen) return;
    screen=name;
    document.querySelectorAll('.app-screen').forEach(panel => { panel.hidden=panel.id!=='screen-'+name; });
    document.querySelectorAll('[data-screen]').forEach(button => {
      if (button.dataset.screen===name) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
    window.scrollTo({top:0,left:0,behavior:'instant'});
    if (name==='timesheet') requestAnimationFrame(api.refreshSignature);
    if (name==='saved') renderRecords();
    updateHome();
  }
  function go(name) {
    flushDraft();
    if (screen!==name) history.pushState(null,'','#'+name);
    renderScreen(name);
  }
  function newTimesheet() {
    if (meaningful(api.captureState()) && !confirm('Start a fresh timesheet? The current form and signature will be cleared. Saved copies will remain.')) return;
    activeRecordId=null; api.resetForm();
    go('timesheet');
    $('workerName').focus({preventScroll:true});
  }
  document.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click',()=>go(button.dataset.screen)));
  window.addEventListener('popstate',()=>renderScreen(location.hash.slice(1)));
  $('homeStart').addEventListener('click',newTimesheet);
  $('savedStart').addEventListener('click',newTimesheet);
  $('homeContinue').addEventListener('click',()=>go('timesheet'));
  $('homeSaved').addEventListener('click',()=>go('saved'));
  document.addEventListener('golabour:change',scheduleSave);
  document.addEventListener('golabour:reset',()=>{activeRecordId=null;lastSavedAt='';if(remember)remove(KEYS.draft);});
  window.addEventListener('pagehide',flushDraft);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)flushDraft();});
  $('rememberDraft').checked=remember;
  $('rememberDraft').addEventListener('change',event=>{
    const enabled=event.target.checked;
    if (enabled) {
      if (!write(KEYS.remember,true)) { event.target.checked=false;return; }
      remember=true;lastSavedAt='';flushDraft();toast('Draft saving enabled on this phone.');
    } else {
      remember=false;clearTimeout(saveTimer);lastSavedAt='';draftDirty=false;draftSaveFailed=false;
      const draftRemoved=remove(KEYS.draft), preferenceRemoved=remove(KEYS.remember);
      updateHome();toast(draftRemoved && preferenceRemoved ? 'Draft saving off. Stored draft removed.' : 'Draft saving off for this visit. Stored data could not be cleared.');
    }
  });
  if (remember) {
    const draft=read(KEYS.draft,null);
    if (draft?.version===1 && draft.state) {
      try { api.restoreState(draft.state);lastSavedAt=draft.updatedAt;activeRecordId=records.some(record=>record.id===draft.recordId)?draft.recordId:null; }
      catch (_) { storageFailure('This saved draft could not be opened. Your saved reports are separate.'); }
    }
  }
  function hours(minutes) { return `${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,'0')}m`; }
  function recordDate(iso) {
    const [year,month,day]=String(iso).split('-').map(Number);
    return new Date(year,month-1,day).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
  }
  function openRecord(record) {
    const current=api.captureState();
    if (meaningful(current) && JSON.stringify(current)!==JSON.stringify(record.state) && !confirm('Open this saved timesheet in place of the current form? Your saved copies will remain.')) return;
    api.restoreState(record.state); activeRecordId=record.id;
    flushDraft(); go('timesheet');
    toast('Saved copy opened. Editing details will require a new signature.');
  }
  function deleteRecord(record) {
    if (!confirm('Remove this saved timesheet from this phone? Downloaded PNG/PDF files are not affected.')) return;
    const next=records.filter(item=>item.id!==record.id);
    if (!write(KEYS.records,next)) return;
    records=next;
    if (activeRecordId===record.id) activeRecordId=null;
    renderRecords(); updateHome(); toast('Saved copy removed from this phone.');
  }
  function renderRecords() {
    $('savedList').replaceChildren();
    $('savedEmpty').hidden=records.length>0;
    $('clearRecords').hidden=records.length===0 && recordsHealthy;
    for (const record of records) {
      const report=record.report;
      const article=document.createElement('article'); article.className='saved-record';
      const top=document.createElement('div'); top.className='record-top';
      const date=document.createElement('span'); date.className='record-date'; date.textContent=recordDate(report.isoDate);
      const total=document.createElement('span'); total.className='record-hours'; total.textContent=hours(report.paid)+(report.names.length>1?' each':'');
      top.append(date,total);
      const title=document.createElement('h2'); title.textContent=report.names[0]+(report.names.length>1?` + ${report.names.length-1} more`:'');
      const site=document.createElement('p'); site.className='record-site'; site.textContent=report.location;
      const actions=document.createElement('div'); actions.className='record-actions';
      const open=document.createElement('button'); open.type='button'; open.textContent='Open / share'; open.addEventListener('click',()=>openRecord(record));
      const removeButton=document.createElement('button'); removeButton.type='button'; removeButton.textContent='Remove'; removeButton.setAttribute('aria-label','Remove saved timesheet for '+report.names[0]); removeButton.addEventListener('click',()=>deleteRecord(record));
      actions.append(open,removeButton); article.append(top,title,site,actions); $('savedList').append(article);
    }
    if (!recordsHealthy) storageFailure('Saved report data could not be read. Clear saved timesheets only if you want to start a fresh list.');
  }
  $('saveRecord').addEventListener('click',()=>{
    const report=api.validate(); if(!report)return;
    if (!recordsHealthy) { api.feedback('Saved report data could not be read. It has not been overwritten.',true); return; }
    if (activeRecordId && records.some(record=>record.id===activeRecordId)) { api.feedback('This signed timesheet is already saved on this phone.'); return; }
    if (records.length>=MAX_RECORDS) { api.feedback('This phone has 20 saved timesheets. Keep PNG/PDF copies, then remove a saved report before adding another.',true); return; }
    const id=globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
    const record={id,savedAt:new Date().toISOString(),state:api.captureState(),report};
    const next=[record,...records];
    if (!write(KEYS.records,next)) { api.feedback('Could not save on this phone. You can still generate the signed photo or PDF.',true); return; }
    records=next; activeRecordId=id; renderRecords(); updateHome(); flushDraft();
    api.feedback('Signed timesheet saved on this phone. Find it in Saved to open or share it later.');
    toast('Timesheet kept in Saved.');
  });
  $('clearRecords').addEventListener('click',()=>{
    if (!confirm('Clear all saved timesheets from this phone? Downloaded PNG/PDF files are not affected.')) return;
    if (!remove(KEYS.records)) return;
    records=[]; recordsHealthy=true; activeRecordId=null; renderRecords(); updateHome(); toast('Saved timesheets cleared from this phone.');
  });
  const help=$('helpDialog');
  function openHelp() { if(help.open)return;if(typeof help.showModal==='function')help.showModal();else help.setAttribute('open',''); }
  function closeHelp() { if(typeof help.close==='function')help.close();else help.removeAttribute('open'); }
  $('appHelp').addEventListener('click',openHelp);
  $('installGuide').addEventListener('click',openHelp);
  $('closeHelp').addEventListener('click',closeHelp);
  $('doneHelp').addEventListener('click',closeHelp);
  const installed=window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  if(installed) $('installGuide').hidden=true;
  function connectivity() {
    const offline=navigator.onLine===false;
    $('connectionPill').textContent=offline?'Offline':'Online';
    $('connectionPill').classList.toggle('offline',offline);
  }
  window.addEventListener('online',connectivity); window.addEventListener('offline',connectivity); connectivity();
  $('todayLabel').textContent=new Date().toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();
  function offlineReady() { $('offlineTitle').textContent='Offline ready';$('offlineDescription').textContent='Fill in & sign without a connection'; }
  function offerUpdate(worker) { waitingWorker=worker;$('appUpdate').hidden=false; }
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(registration=>{
      navigator.serviceWorker.ready.then(offlineReady);
      if(registration.waiting && navigator.serviceWorker.controller)offerUpdate(registration.waiting);
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        if(!worker)return;
        worker.addEventListener('statechange',()=>{
          if(worker.state==='installed' && navigator.serviceWorker.controller)offerUpdate(worker);
        });
      });
      registration.update().catch(()=>{});
    }).catch(()=>{
      $('offlineTitle').textContent='Online mode';$('offlineDescription').textContent='Reopen online to enable offline access';
    });
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updateRequested)location.reload();});
  } else {
    $('offlineTitle').textContent='Online mode';$('offlineDescription').textContent='Use the published HTTPS app link';
  }
  $('applyUpdate').addEventListener('click',()=>{
    if(!waitingWorker)return;
    if(!remember && meaningful(api.captureState()) && !confirm('Update now? Your current form is not saved as a draft and will be cleared. Saved copies will remain.'))return;
    if(!flushDraft() && !confirm('Your draft could not be saved. Update and clear the current form anyway?'))return;
    updateRequested=true;waitingWorker.postMessage({type:'SKIP_WAITING'});
  });
  if(!storageAvailable)storageFailure();
  renderRecords();renderScreen(location.hash.slice(1) || 'home');updateHome();
})();
