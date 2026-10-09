/* Device-local shift calculator and invoice exports. No external libraries or server. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const RECIPIENT = Object.freeze({name:'GoLabour Solutions', abn:'82 676 721 136', email:'invoice@golabour.com.au'});
  const prefix = 'golabour-invoices:' + new URL('./', location.href).pathname + ':';
  const profileIds = ['invoiceWorker','invoiceABN','invoiceAccountName','invoiceBSB','invoiceAccount'];
  const allIds = [...profileIds,'invoiceDate'];
  const rows = $('invoiceShifts');
  let serial = 0, openedId = null, dirty = false, currentPage = null, photoFiles = [], emailFile = null;
  let previewURLs = [];
  const scrollPositions = {timesheet:0,calculator:0,invoice:0};
  const items = $('invoiceItems');
  const today = () => { const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const text = (value,max=120) => String(value ?? '').replace(/[\x00-\x1f\x7f]/g,' ').slice(0,max);
  function parseDate(value) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const [y,m,d]=value.split('-').map(Number), date=new Date(y,m-1,d,12);
    return y>=1900&&date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null;
  }
  const dateText = value => parseDate(value)?.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}) || '—';
  function scaled(value,places) {
    const raw=String(value).trim().replace(',','.');
    if(!new RegExp('^\\d+(?:\\.\\d{1,'+places+'})?$').test(raw))return null;
    const [whole,fraction='']=raw.split('.');
    const result=BigInt(whole)*10n**BigInt(places)+BigInt(fraction.padEnd(places,'0'));
    return result>0n?result:null;
  }
  function amount(shift) {
    const hours=scaled(shift.hours,4), rate=scaled(shift.rate,2);
    if(hours===null||rate===null)return null;
    const cents=(hours*rate+5000n)/10000n;
    return cents<=BigInt(Number.MAX_SAFE_INTEGER)?cents:null;
  }
  function money(cents) {
    const value=BigInt(cents);
    return '$'+(value/100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',')+'.'+(value%100n).toString().padStart(2,'0');
  }
  function notify(message,error=false) {
    for(const id of ['invoiceFeedback','calculatorFeedback']){$(id).textContent=message;$(id).className='feedback show'+(error?' error':'');}
  }
  function read(key,fallback) { try { const raw=localStorage.getItem(prefix+key);return raw===null?fallback:JSON.parse(raw); }catch(_){return fallback;} }
  function write(key,value) { try { localStorage.setItem(prefix+key,JSON.stringify(value));return true; }catch(_){notify('This browser could not save on this phone. Your form is still here; export a photo or PDF to keep a copy.',true);return false;} }
  function shiftValue(row) { return Object.fromEntries(['job','date','hours','rate'].map(key=>[key,row.querySelector('[data-field="'+key+'"]').value])); }
  function capture() { return {version:2,details:Object.fromEntries(allIds.map(id=>[id,$(id).value])),shifts:[...rows.children].map(shiftValue),invoiceItems:[...items.children].map(itemValue)}; }
  function cleanState(state) {
    if(![1,2].includes(state?.version)||!state.details||typeof state.details!=='object'||!Array.isArray(state.shifts))return null;
    const shifts=state.shifts.filter(s=>s&&typeof s==='object').map(s=>({job:text(s.job,120),date:parseDate(String(s.date))?String(s.date):'',hours:text(s.hours,16),rate:text(s.rate,16)}));
    const source=state.version===1?shifts.map(s=>({job:s.job,date:s.date,amount:amount(s)===null?'':decimalAmount(amount(s))})):Array.isArray(state.invoiceItems)?state.invoiceItems:[];
    return {version:2,details:Object.fromEntries(allIds.map(id=>[id,text(state.details[id],$(id).maxLength>0?$(id).maxLength:10)])),shifts,invoiceItems:source.filter(i=>i&&typeof i==='object').map(i=>({job:text(i.job,120),date:parseDate(String(i.date))?String(i.date):'',amount:text(i.amount,16)}))};
  }
  function decimalAmount(cents){return (cents/100n).toString()+'.'+(cents%100n).toString().padStart(2,'0');}
  function itemValue(row){return Object.fromEntries(['job','date','amount'].map(key=>[key,row.querySelector('[data-item="'+key+'"]').value]));}
  function addItem(value={date:today()},focus=true){
    const row=document.createElement('article');row.className='invoice-shift invoice-item';const id=++serial;
    row.innerHTML=`<div class="invoice-shift-heading"><h3>Job</h3><button type="button" class="remove-invoice-shift">Remove</button></div><div class="form-grid"><div class="field span2"><label for="invoice-job-${id}">Job name / location <b>*</b></label><input id="invoice-job-${id}" data-item="job" maxlength="120" required></div><div class="field span2"><label for="invoice-job-date-${id}">Job date <b>*</b></label><input id="invoice-job-date-${id}" data-item="date" type="date" required></div><div class="field span2"><label for="invoice-job-amount-${id}">Job amount ($) <b>*</b></label><input id="invoice-job-amount-${id}" data-item="amount" inputmode="decimal" maxlength="16" placeholder="e.g. 340.00" required></div></div>`;
    for(const key of ['job','date','amount'])row.querySelector('[data-item="'+key+'"]').value=value[key]??'';
    row.querySelector('button').addEventListener('click',()=>{row.remove();dirty=true;recalculateInvoice();});
    row.addEventListener('input',event=>{event.target.removeAttribute('aria-invalid');dirty=true;recalculateInvoice();});items.append(row);recalculateInvoice();if(focus){dirty=true;row.querySelector('input').focus();}return row;
  }
  function recalculateInvoice(){let total=0n,count=0;[...items.children].forEach((row,index)=>{row.querySelector('h3').textContent='Job '+(index+1);row.querySelector('button').setAttribute('aria-label','Remove job '+(index+1));const cents=scaled(itemValue(row).amount,2);if(cents!==null){total+=cents;count++;}});$('invoiceAmountTotal').textContent=money(total);$('invoiceItemCount').textContent=count+' job amount'+(count===1?'':'s')+' added';return total;}
  function addShift(value={date:today()},focus=true) {
    const row=document.createElement('article');row.className='invoice-shift';const id=++serial;
    row.innerHTML=`<div class="invoice-shift-heading"><h3>Shift</h3><button type="button" class="remove-invoice-shift">Remove</button></div>
      <div class="form-grid">
        <div class="field span2"><label for="job-${id}">Job name / location <b>*</b></label><input id="job-${id}" data-field="job" maxlength="120" autocomplete="off" required></div>
        <div class="field span2"><label for="job-date-${id}">Job date <b>*</b></label><input id="job-date-${id}" data-field="date" type="date" required><p class="day-label"></p></div>
        <div class="field"><label for="job-hours-${id}">Paid hours <b>*</b></label><input id="job-hours-${id}" data-field="hours" inputmode="decimal" maxlength="16" placeholder="e.g. 8.5" autocomplete="off" required></div>
        <div class="field"><label for="job-rate-${id}">Hourly rate ($) <b>*</b></label><input id="job-rate-${id}" data-field="rate" inputmode="decimal" maxlength="16" placeholder="e.g. 40.00" autocomplete="off" required></div>
      </div><div class="shift-line-total"><span>Shift amount · AUD</span><strong>—</strong></div>`;
    for(const key of ['job','date','hours','rate'])row.querySelector('[data-field="'+key+'"]').value=value[key]??'';
    row.querySelector('.remove-invoice-shift').addEventListener('click',()=>{row.remove();dirty=true;recalculate();});
    row.addEventListener('input',event=>{event.target.removeAttribute('aria-invalid');dirty=true;recalculate();});
    rows.append(row);recalculate();
    if(focus){dirty=true;row.querySelector('input').focus();}
    return row;
  }
  function recalculate() {
    let total=0n, counted=0, incomplete=0;
    [...rows.children].forEach((row,index)=>{
      const shift=shiftValue(row), cents=amount(shift), date=parseDate(shift.date);
      row.querySelector('h3').textContent='Shift '+(index+1);
      row.querySelector('.remove-invoice-shift').setAttribute('aria-label','Remove shift '+(index+1));
      row.querySelector('.day-label').textContent=date?date.toLocaleDateString('en-AU',{weekday:'long'}):'Choose any date. Repeat a day as often as needed.';
      row.querySelector('.shift-line-total strong').textContent=cents===null?'—':money(cents);
      if(cents!==null){total+=cents;counted++;}
      if(cents===null||!shift.job.trim()||!date)incomplete++;
    });
    $('invoiceTotal').textContent=money(total);
    $('invoiceShiftCount').textContent=rows.children.length===0?'Add your first shift':`${counted} shift amount${counted===1?'':'s'} calculated`+(incomplete?` · ${incomplete} incomplete`:'');
    return total;
  }
  function abnValid(value) {
    if(!/^[\d\s]+$/.test(value))return false;
    const digits=value.replace(/\s/g,'');if(digits.length!==11)return false;
    const weights=[10,1,3,5,7,9,11,13,15,17,19];
    return [...digits].reduce((sum,digit,index)=>sum+(Number(digit)-(index===0?1:0))*weights[index],0)%89===0;
  }
  function bad(element,message) { element.setAttribute('aria-invalid','true');notify(message,true);element.focus();return null; }
  function validateProfile() {
    if(!$('invoiceWorker').value.trim())return bad($('invoiceWorker'),'Enter your full name.');
    if(!abnValid($('invoiceABN').value.trim()))return bad($('invoiceABN'),'Check your ABN. It must be a valid 11-digit ABN.');
    if(!$('invoiceAccountName').value.trim())return bad($('invoiceAccountName'),'Enter your bank account name.');
    if(!/^(?:\d{6}|\d{3}-\d{3}|\d{3} \d{3})$/.test($('invoiceBSB').value.trim()))return bad($('invoiceBSB'),'Enter your six-digit BSB, for example 000-000.');
    if(!/^\d{4,12}$/.test($('invoiceAccount').value.trim()))return bad($('invoiceAccount'),'Enter your bank account number using digits only (4–12 digits).');
    return Object.fromEntries(profileIds.map(id=>[id,$(id).value.trim()]));
  }
  function validated({calculator=false}={}) {
    for(const input of document.querySelectorAll('[aria-invalid]'))input.removeAttribute('aria-invalid');
    if(!calculator){
      if(!validateProfile())return null;
      if(!parseDate($('invoiceDate').value))return bad($('invoiceDate'),'Choose a valid invoice date.');
      if(!items.children.length){notify('Add at least one job to the invoice.',true);$('addInvoiceItem').focus();return null;}
      for(const row of items.children){const item=itemValue(row);if(!item.job.trim())return bad(row.querySelector('[data-item="job"]'),'Enter each job name or location.');if(!parseDate(item.date))return bad(row.querySelector('[data-item="date"]'),'Choose each job date.');if(scaled(item.amount,2)===null)return bad(row.querySelector('[data-item="amount"]'),'Enter a job amount greater than zero, using up to two decimal places.');}
      const snapshot=capture();snapshot.total=recalculateInvoice();snapshot.shifts=snapshot.invoiceItems;return snapshot;
    }
    if(!calculator&&!validateProfile())return null;
    if(!rows.children.length){notify('Add at least one shift.',true);$('addInvoiceShift').focus();return null;}
    for(const row of rows.children){
      const shift=shiftValue(row);
      if(!shift.job.trim())return bad(row.querySelector('[data-field="job"]'),'Enter the job name or location for each shift.');
      if(!parseDate(shift.date))return bad(row.querySelector('[data-field="date"]'),'Choose a valid job date for each shift.');
      if(scaled(shift.hours,4)===null)return bad(row.querySelector('[data-field="hours"]'),'Enter paid hours greater than zero, using up to four decimal places. Deduct unpaid breaks first.');
      if(scaled(shift.rate,2)===null)return bad(row.querySelector('[data-field="rate"]'),'Enter an hourly rate greater than zero, using up to two decimal places.');
      if(amount(shift)===null)return bad(row.querySelector('[data-field="rate"]'),'This shift amount is too large. Check the hours and rate.');
    }
    const snapshot=capture();snapshot.details.invoiceDate=today();snapshot.total=recalculate();
    if(snapshot.total<=0n){notify('The invoice total must be greater than zero.',true);return null;}
    return snapshot;
  }
  function savedRecords() {
    const records=read('calculations-v1',[]);
    return Array.isArray(records)?records.filter(r=>r&&typeof r.id==='string'&&cleanState(r.state)):[];
  }
  function stateTotal(state) { return state.shifts.reduce((total,shift)=>total+(amount(shift)??0n),0n); }
  function renderSaved() {
    const records=savedRecords();$('savedInvoiceCalculations').hidden=!records.length;
    $('savedInvoiceCount').textContent='('+records.length+')';$('savedInvoiceList').replaceChildren();
    for(const record of records.slice().reverse()){
      const state=cleanState(record.state), row=document.createElement('article');row.className='previous-copy saved-invoice-row';
      const info=document.createElement('div'), title=document.createElement('strong'), detail=document.createElement('small');
      title.textContent=(state.details.invoiceWorker.trim()||'Calculation')+' · '+money(stateTotal(state));
      detail.textContent=`${state.shifts.length} shift${state.shifts.length===1?'':'s'} · Invoice date ${dateText(state.details.invoiceDate)}`;
      info.append(title,detail);const actions=document.createElement('div');actions.className='saved-invoice-actions';
      const open=document.createElement('button');open.type='button';open.textContent='Open';open.setAttribute('aria-label','Open '+title.textContent);
      open.addEventListener('click',()=>{
        if(dirty&&!confirm('Open this saved calculation? Unsaved changes in the current calculation will be replaced.'))return;
        restore(state);openedId=record.id;dirty=false;notify('Saved calculation opened. Edit it and save again to update this copy.');$('invoiceWorker').scrollIntoView({behavior:'smooth',block:'start'});
      });
      const remove=document.createElement('button');remove.type='button';remove.className='delete-calculation';remove.textContent='Delete';remove.setAttribute('aria-label','Delete '+title.textContent);
      remove.addEventListener('click',()=>{
        if(!confirm('Delete this saved calculation from this phone? Photos and PDFs you exported will stay unchanged.'))return;
        if(write('calculations-v1',savedRecords().filter(r=>r.id!==record.id))){if(openedId===record.id){openedId=null;dirty=true;}renderSaved();notify('Saved calculation deleted.');}
      });
      actions.append(open,remove);row.append(info,actions);$('savedInvoiceList').append(row);
    }
  }
  function restore(state) {
    const clean=cleanState(state);if(!clean)return;
    for(const id of allIds)$(id).value=clean.details[id];
    rows.replaceChildren();for(const shift of clean.shifts)addShift(shift,false);recalculate();
    items.replaceChildren();for(const item of clean.invoiceItems)addItem(item,false);recalculateInvoice();
    for(const input of $('invoiceForm').querySelectorAll('[aria-invalid]'))input.removeAttribute('aria-invalid');
  }
  function saveCalculation() {
    const state=capture();
    if(!state.shifts.some(s=>s.job.trim()||s.hours.trim()||s.rate.trim())){notify('Enter at least one shift before saving a calculation.',true);return;}
    const records=savedRecords();const id=openedId||(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
    const record={id,state,updatedAt:new Date().toISOString()}, found=records.findIndex(r=>r.id===id);
    if(found>=0)records[found]=record;else records.push(record);
    if(!write('calculations-v1',records))return;
    // Remember only the profile, without changing the timesheet's storage.
    write('profile-v1',Object.fromEntries(profileIds.map(key=>[key,state.details[key]])));
    openedId=id;dirty=false;renderSaved();notify('Calculation saved on this phone. Reopen it under Saved calculations. Export a copy for your accountant.');
  }
  $('saveInvoiceDetails').addEventListener('click',()=>{const profile=validateProfile();if(profile&&write('profile-v1',profile))notify('Your personal and bank details are saved on this phone.');});
  $('saveInvoiceCalculation').addEventListener('click',saveCalculation);
  $('addInvoiceShift').addEventListener('click',()=>addShift({date:rows.lastElementChild?shiftValue(rows.lastElementChild).date||today():today()}));
  $('addInvoiceItem').addEventListener('click',()=>addItem({date:items.lastElementChild?itemValue(items.lastElementChild).date||today():today()}));
  function transferCalculation(){
    navigate('calculator');const snapshot=validated({calculator:true});if(!snapshot)return;
    if([...items.children].some(row=>{const i=itemValue(row);return i.job.trim()||i.amount.trim();})&&!confirm('Replace the invoice job amounts with this calculation? Your calculator entries will stay unchanged.'))return;
    items.replaceChildren();for(const shift of snapshot.shifts)addItem({job:shift.job,date:shift.date,amount:decimalAmount(amount(shift))},false);dirty=true;navigate('invoice');notify('Job names, dates and amounts copied. Hours and rates remain in the calculator.');
  }
  $('createInvoiceFromCalc').addEventListener('click',transferCalculation);$('importCalculatorAmounts').addEventListener('click',transferCalculation);
  for(const id of allIds)$(id).addEventListener('input',()=>{$(id).removeAttribute('aria-invalid');dirty=true;});
  $('invoiceForm').addEventListener('submit',event=>event.preventDefault());
  $('newInvoiceCalculation').addEventListener('click',()=>{
    if((dirty||openedId)&&!confirm('Start a new calculation? Save your current calculation first if you want to keep it.'))return;
    rows.replaceChildren();addShift({date:today()},false);openedId=null;dirty=false;notify('New calculation started. Your personal details are kept.');$('invoiceShifts').scrollIntoView({behavior:'smooth',block:'start'});
  });

  // Canvas pages keep identical information in the PNG and PDF, including Unicode names.
  function wrap(ctx,value,width,font) {
    ctx.font=font;const result=[];let line='';
    for(const word of String(value).trim().split(/\s+/)){
      const candidate=line?line+' '+word:word;
      if(ctx.measureText(candidate).width<=width){line=candidate;continue;}
      if(line){result.push(line);line='';}
      for(const char of word){if(ctx.measureText(line+char).width>width&&line){result.push(line);line=char;}else line+=char;}
    }
    if(line)result.push(line);return result.length?result:[''];
  }
  function renderPages(snapshot,calculator=false) {
    const W=1240,H=1754,M=80, ink='#252923',muted='#796b57',gold='#ccbaa1';
    const measure=document.createElement('canvas').getContext('2d');
    const workerLines=calculator?[]:wrap(measure,snapshot.details.invoiceWorker.trim()||'Worker',500,'700 30px Arial');
    const dividerY=calculator?205:Math.max(371,workerLines.length*34+291);
    const tableY=dividerY+70,rowsY=tableY+56;
    const rowCapacity=1320-rowsY;
    const itemData=snapshot.shifts.map(shift=>({shift,cents:calculator?amount(shift):scaled(shift.amount,2),lines:wrap(measure,shift.job,calculator?390:590,'600 27px Arial'),height:0}));
    for(const item of itemData)item.height=Math.max(calculator?102:86,item.lines.length*34+(calculator?44:24));
    const groups=[];let group=[],height=0;
    for(const item of itemData){if(group.length&&height+item.height>rowCapacity){groups.push(group);group=[];height=0;}group.push(item);height+=item.height;}if(group.length)groups.push(group);
    return groups.map((items,pageIndex)=>{
      const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fffefa';ctx.fillRect(0,0,W,H);ctx.fillStyle=ink;ctx.fillRect(0,0,W,167);
      function label(value,x,y){ctx.fillStyle=muted;ctx.font='700 20px Arial';ctx.textAlign='left';ctx.fillText(value,x,y);}
      function line(value,x,y,font='26px Arial',color=ink,align='left',maxWidth){ctx.font=font;ctx.fillStyle=color;ctx.textAlign=align;if(maxWidth)ctx.fillText(value,x,y,maxWidth);else ctx.fillText(value,x,y);}
      line(calculator?'CALCULATION':'INVOICE',M,85,calculator?'700 43px Arial':'700 54px Arial','#fffefa','left');
      line('Date: '+dateText(snapshot.details.invoiceDate),W-M,125,'23px Arial',gold,'right');
      if(!calculator){label('FROM',M,219);
      workerLines.forEach((value,i)=>line(value,M,260+i*34,'700 30px Arial'));
      line('ABN: '+(snapshot.details.invoiceABN.trim()||'—'),M,workerLines.length>1?workerLines.length*34+276:308,'24px Arial');
      label('BILL TO',680,219);line(RECIPIENT.name,680,260,'700 30px Arial');line('ABN: '+RECIPIENT.abn,680,302,'24px Arial');line(RECIPIENT.email,680,338,'22px Arial',muted);
      }
      ctx.fillStyle=gold;ctx.fillRect(M,dividerY,W-2*M,3);label(calculator?'SHIFT EARNINGS · AUD':'WORKS COMPLETED · AUD',M,dividerY+44);
      ctx.fillStyle='#eee6d8';ctx.fillRect(M,tableY,W-2*M,56);
      label(calculator?'JOB / DATE':'JOB NAME',M+15,tableY+36);
      if(calculator){label('PAID HRS',560,tableY+36);label('RATE',735,tableY+36);}else label('JOB DATE',760,tableY+36);
      line('AMOUNT',W-M-16,tableY+36,'700 20px Arial',muted,'right');
      let y=rowsY;
      for(const item of items){
        item.lines.forEach((value,i)=>line(value,M+15,y+39+i*34,'600 27px Arial'));
        if(calculator){line(dateText(item.shift.date),M+15,y+item.lines.length*34+34,'23px Arial',muted);line(item.shift.hours,560,y+39,'27px Arial',ink,'left',150);line(money(scaled(item.shift.rate,2)),735,y+39,'25px Arial',ink,'left',175);}
        else line(dateText(item.shift.date),760,y+39,'24px Arial');
        line(money(item.cents),W-M-16,y+39,'700 28px Arial',ink,'right',220);
        y+=item.height;ctx.fillStyle='#e1d8ca';ctx.fillRect(M,y,W-2*M,1);
      }
      const last=pageIndex===groups.length-1;
      if(last){
        y+=28;ctx.fillStyle=ink;ctx.fillRect(M,y,W-2*M,91);
        line(calculator?'CALCULATED TOTAL':'TOTAL TO BE PAID',M+24,y+54,'700 24px Arial',gold);
        line(money(snapshot.total),W-M-24,y+59,'700 45px Arial','#fffefa','right',565);
        if(!calculator){
          y+=136;label('PAYMENT DETAILS',M,y);
          const accountLines=wrap(ctx,snapshot.details.invoiceAccountName,1010,'27px Arial');
          accountLines.forEach((value,i)=>line(''+value,M,y+40+i*33));
          line('BSB: '+snapshot.details.invoiceBSB+'    Account: '+snapshot.details.invoiceAccount,M,y+47+accountLines.length*33,'27px Arial');
        }else line('Paid hours exclude breaks. This calculation is not an invoice.',M,y+132,'23px Arial',muted);
      }else line('Continued on the next page. Final total is shown on the last page.',M,1518,'22px Arial',muted);
      ctx.fillStyle='#ddd3c4';ctx.fillRect(M,1649,W-2*M,1);
      line(calculator?'Shift calculation · GoLabour Solutions':'Invoice billed to GoLabour Solutions',M,1690,'21px Arial',muted);
      line(`Page ${pageIndex+1} of ${groups.length}`,W-M,1690,'21px Arial',muted,'right');
      return canvas;
    });
  }
  function dataBytes(url) { const binary=atob(url.split(',')[1]);return Uint8Array.from(binary,char=>char.charCodeAt(0)); }
  function filename(snapshot,kind='Invoice') {
    const name=(snapshot.details.invoiceWorker||'Worker').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,70)||'Worker';
    return `GoLabour_${kind}_${name}_${snapshot.details.invoiceDate}`;
  }
  function pngFiles(pages,snapshot,calculator=false) {
    const base=filename(snapshot,calculator?'Calculation':'Invoice');
    return pages.map((canvas,index)=>new File([dataBytes(canvas.toDataURL('image/png'))],base+(pages.length>1?`_page_${index+1}`:'')+'.png',{type:'image/png'}));
  }
  function pdfFile(pages,snapshot) {
    // Minimal PDF 1.4 with one high-resolution JPEG per A4 page, no dependencies.
    const chunks=[],offsets=[0];let length=0;const encode=value=>new TextEncoder().encode(value);
    const append=value=>{const bytes=typeof value==='string'?encode(value):value;chunks.push(bytes);length+=bytes.length;};
    function object(id,body){offsets[id]=length;append(`${id} 0 obj\n`);append(body);append('\nendobj\n');}
    function stream(id,dictionary,bytes){offsets[id]=length;append(`${id} 0 obj\n<< ${dictionary} /Length ${bytes.length} >>\nstream\n`);append(bytes);append('\nendstream\nendobj\n');}
    append('%PDF-1.4\n');append(new Uint8Array([37,226,227,207,211,10]));
    object(1,'<< /Type /Catalog /Pages 2 0 R >>');
    object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
    pages.forEach((canvas,index)=>{
      const id=3+index*3;
      object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.276 841.89] /Resources << /XObject << /Im0 ${id+2} 0 R >> >> /Contents ${id+1} 0 R >>`);
      stream(id+1,'',encode('q\n595.276 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n'));
      stream(id+2,`/Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,dataBytes(canvas.toDataURL('image/jpeg',0.95)));
    });
    const xref=length,count=3+pages.length*3;
    append(`xref\n0 ${count}\n0000000000 65535 f \n`);
    for(let id=1;id<count;id++)append(String(offsets[id]).padStart(10,'0')+' 00000 n \n');
    append(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new File(chunks,filename(snapshot)+'.pdf',{type:'application/pdf'});
  }
  function download(file) {
    const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function releasePhotos(){for(const url of previewURLs)URL.revokeObjectURL(url);previewURLs=[];photoFiles=[];$('invoicePhotoPages').replaceChildren();}
  function openPhotos(calculator=false) {
    const snapshot=validated({calculator});if(!snapshot)return;
    try{
      releasePhotos();photoFiles=pngFiles(renderPages(snapshot,calculator),snapshot,calculator);
      $('invoicePhotoHeading').textContent=calculator?'Your calculator photo':'Your invoice photo';
      $('invoicePhotoStatus').textContent=photoFiles.length>1?`This document has ${photoFiles.length} photo pages. Save each page to keep the complete copy.`:'';
      photoFiles.forEach((file,index)=>{
        const block=document.createElement('div'),label=document.createElement('span');label.className='photo-page-label';label.textContent='Page '+(index+1)+' of '+photoFiles.length;
        const img=document.createElement('img');const url=URL.createObjectURL(file);previewURLs.push(url);img.src=url;img.alt=(calculator?'Shift calculation':'Invoice')+' page '+(index+1);
        const button=document.createElement('button');button.type='button';button.className='btn btn-outline';button.textContent='Download '+(photoFiles.length>1?'page '+(index+1)+' ':'')+'PNG';button.addEventListener('click',()=>{download(file);$('invoicePhotoStatus').textContent='Download requested. For your gallery on iPhone, touch and hold the photo or use Save to Photos / Share.';});
        block.append(label,img,button);$('invoicePhotoPages').append(block);
      });
      $('invoicePhotoDialog').showModal();
    }catch(_){notify('The photo could not be generated. Your calculation is still here; try saving it and reopening.',true);}
  }
  $('closeInvoicePhoto').addEventListener('click',()=>$('invoicePhotoDialog').close());
  $('invoicePhotoDialog').addEventListener('close',releasePhotos);
  $('shareInvoicePhotos').addEventListener('click',async()=>{
    if(!photoFiles.length)return;
    if(navigator.share&&(!navigator.canShare||navigator.canShare({files:photoFiles}))){
      try{await navigator.share({files:photoFiles,title:$('invoicePhotoHeading').textContent});$('invoicePhotoStatus').textContent='The share menu opened. Choose Save Image / Save Images to keep the photo in your gallery.';return;}catch(error){if(error.name==='AbortError')return;}
    }
    $('invoicePhotoStatus').textContent='Touch and hold each image to save it to Photos, or use its Download PNG button.';
  });
  $('saveInvoicePhoto').addEventListener('click',()=>openPhotos());
  $('saveCalculationPhoto').addEventListener('click',()=>openPhotos(true));
  $('saveInvoicePDF').addEventListener('click',()=>{
    const snapshot=validated();if(!snapshot)return;
    try{download(pdfFile(renderPages(snapshot),snapshot));notify('Invoice PDF download requested. On iPhone it may be in Files > Downloads.');}catch(_){notify('The PDF could not be generated. Your calculation is still here.',true);}
  });
  $('emailInvoice').addEventListener('click',()=>{
    const snapshot=validated();if(!snapshot)return;
    try{
      emailFile=pdfFile(renderPages(snapshot),snapshot);
      const subject=`Invoice – ${snapshot.details.invoiceWorker} – ${dateText(snapshot.details.invoiceDate)}`;
      const body=`Hello GoLabour,\n\nPlease find my invoice attached.\n\nName: ${snapshot.details.invoiceWorker}\nABN: ${snapshot.details.invoiceABN}\nInvoice date: ${dateText(snapshot.details.invoiceDate)}\nTotal to be paid: ${money(snapshot.total)} AUD\n\nThank you,\n${snapshot.details.invoiceWorker}`;
      $('openInvoiceEmail').href='mailto:'+RECIPIENT.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
      const shareAvailable=!!(navigator.share&&(!navigator.canShare||navigator.canShare({files:[emailFile]})));
      $('shareInvoicePDF').hidden=!shareAvailable;$('emailShareTip').hidden=!shareAvailable;$('invoiceEmailStatus').textContent='';$('invoiceEmailDialog').showModal();
    }catch(_){notify('The invoice could not be prepared for email. Save your calculation and try again.',true);}
  });
  $('closeInvoiceEmail').addEventListener('click',()=>$('invoiceEmailDialog').close());
  $('invoiceEmailDialog').addEventListener('close',()=>{emailFile=null;});
  $('emailDownloadPDF').addEventListener('click',()=>{if(emailFile){download(emailFile);$('invoiceEmailStatus').textContent='PDF download requested. Open the email, attach this saved PDF and review before sending.';}});
  $('openInvoiceEmail').addEventListener('click',()=>{$('invoiceEmailStatus').textContent='Email requested. Attach your saved PDF and signed timesheets before sending.';});
  $('copyInvoiceEmail').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(RECIPIENT.email);$('invoiceEmailStatus').textContent='GoLabour email address copied.';}catch(_){$('invoiceEmailStatus').textContent='Touch and hold the address above to copy it.';}});
  $('shareInvoicePDF').addEventListener('click',async()=>{
    if(!emailFile||!navigator.share)return;
    try{await navigator.share({files:[emailFile],title:'Invoice for GoLabour',text:'Send to '+RECIPIENT.email});$('invoiceEmailStatus').textContent='The share menu opened. Choose your email app, address it to GoLabour and confirm it was sent.';}catch(error){if(error.name!=='AbortError')$('invoiceEmailStatus').textContent='File sharing was unavailable. Save the PDF and attach it using the addressed email option.';}
  });

  function showPage(page,restoreScroll=false) {
    page=['invoice','calculator'].includes(page)?page:'timesheet';
    if(page===currentPage)return;
    if(currentPage)scrollPositions[currentPage]=window.scrollY;
    currentPage=page;
    for(const name of ['timesheet','calculator','invoice']){
      $(name+'Page').hidden=name!==page;$(name+'Hero').hidden=name!==page;
      if(name===page)$(name+'Tab').setAttribute('aria-current','page');else $(name+'Tab').removeAttribute('aria-current');
    }
    document.title=page==='invoice'?'GoLabour | Invoice':page==='calculator'?'GoLabour | Calculator':'GoLabour | Smart Timesheet';
    if(page==='timesheet')requestAnimationFrame(()=>window.GoLabourTimesheet.refreshSignature());
    if(restoreScroll)window.scrollTo({top:scrollPositions[page],behavior:'instant'});
  }
  function navigate(page){if(page===currentPage)return;history.pushState(null,'',location.pathname+location.search+(page==='timesheet'?'':'#'+page));showPage(page,true);}
  for(const button of document.querySelectorAll('[data-page]'))button.addEventListener('click',()=>navigate(button.dataset.page));
  const route=()=>showPage(location.hash.slice(1),true);
  window.addEventListener('popstate',route);window.addEventListener('hashchange',route);
  window.addEventListener('storage',event=>{if(event.key===prefix+'calculations-v1')renderSaved();});
  const remembered=read('profile-v1',{});
  if(remembered&&typeof remembered==='object')for(const id of profileIds)$(id).value=text(remembered[id],$(id).maxLength);
  $('invoiceDate').value=today();addShift({date:today()},false);addItem({date:today()},false);dirty=false;renderSaved();showPage(location.hash.slice(1));
  window.GoLabourInvoice={hasUnsavedChanges:()=>dirty,captureState:capture,restoreState:state=>{restore(state);dirty=true;},calculate:recalculate};
})();
