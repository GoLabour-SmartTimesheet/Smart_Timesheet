/* GoLabour End-of-Shift Timesheet — static GitHub Pages application.
   Data stays on this device. It does not submit to a server or WhatsApp by itself. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const ids = ['workerName', 'location', 'shiftDate', 'startTime', 'finishTime', 'breakMinutes', 'message', 'supervisorName', 'companyName'];
  const pad = $('signaturePad');
  let strokes = [];
  let currentStroke = null;
  // Shared shift details apply to all named workers on this one signed report.
  const MAX_WORKERS = 15;
  let nextWorkerId = 2;
  const extraWorkers = $('extraWorkers');
  const addWorkerButton = $('addWorker');
  function workerInputs() {
    return [$('workerName'), ...extraWorkers.querySelectorAll('input.extra-worker-input')];
  }
  function refreshWorkerControls() {
    const total = workerInputs().length;
    addWorkerButton.disabled = total >= MAX_WORKERS;
    addWorkerButton.title = total >= MAX_WORKERS ? `Maximum ${MAX_WORKERS} workers per timesheet` : '';
    const label = document.querySelector('label[for="workerName"]');
    if (label) label.innerHTML = total > 1 ? 'Worker 1 full name <b>*</b>' : 'Worker full name <b>*</b>';
    extraWorkers.querySelectorAll('.extra-worker-row').forEach((row, i) => {
      const input = row.querySelector('input');
      const button = row.querySelector('button');
      input.setAttribute('aria-label', `Worker ${i + 2} full name`);
      button.setAttribute('aria-label', `Remove worker ${i + 2}`);
    });
  }
  addWorkerButton.addEventListener('click', () => {
    if (workerInputs().length >= MAX_WORKERS) return;
    const row = document.createElement('div');
    row.className = 'extra-worker-row';
    const input = document.createElement('input');
    input.className = 'extra-worker-input';
    input.type = 'text';
    input.id = `additionalWorker${nextWorkerId++}`;
    input.maxLength = 100;
    input.autocomplete = 'off';
    input.required = true;
    input.placeholder = `Worker ${workerInputs().length + 1} full name`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-worker-button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      row.remove(); refreshWorkerControls(); clearFeedback();
    });
    input.addEventListener('input', clearFeedback);
    row.append(input, remove);
    extraWorkers.appendChild(row);
    refreshWorkerControls();
    input.focus();
  });
  refreshWorkerControls();

  function formatDate(iso) {
    const [y, m, d] = String(iso).split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  }
  function clean(value) { return String(value || '').trim(); }
  function mins(time) {
    if (!/^\d{2}:\d{2}$/.test(time)) return null;
    const [h, m] = time.split(':').map(Number);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }
  function pretty(minutes) { return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`; }
  function calc() {
    const start = mins($('startTime').value);
    const finish = mins($('finishTime').value);
    const rawBreak = $('breakMinutes').value;
    const breakTime = rawBreak === '' ? NaN : Number(rawBreak);
    if (start === null || finish === null) return { error: 'Enter both start and finish times.' };
    if (!Number.isInteger(breakTime) || breakTime < 0 || breakTime > 1439) return { error: 'Enter a valid break in whole minutes (0–1439).' };
    if (start === finish) return { error: 'Start and finish cannot be identical. Please check the times.' };
    const elapsed = (finish - start + 1440) % 1440;
    if (breakTime > elapsed) return { error: 'Your break cannot be longer than the shift.' };
    const paid = elapsed - breakTime;
    return { start: $('startTime').value, finish: $('finishTime').value, breakTime, paid, overnight: finish < start };
  }
  function recalc() {
    const c = calc();
    $('hoursPretty').textContent = c.error ? '—' : pretty(c.paid);
    $('hoursDecimal').textContent = c.error ? 'Please check your times' : `${(c.paid / 60).toFixed(2)} decimal hours`;
    const awaiting = !$('startTime').value && !$('finishTime').value && !$('breakMinutes').value;
    $('calcHelp').classList.toggle('error', !!c.error && !awaiting);
    $('calcHelp').textContent = awaiting ? 'Enter start, finish and break to calculate your paid hours.' : (c.error || (c.overnight ? 'Overnight shift detected: finish time is treated as the following day. Break is subtracted.' : 'Calculated from start to finish, minus the break.'));
    if (awaiting) $('hoursDecimal').textContent = 'Awaiting shift times';
  }
  function feedback(message, error = false) {
    const el = $('feedback');
    el.textContent = message;
    el.className = 'feedback show' + (error ? ' error' : '');
  }
  function clearFeedback() { $('feedback').className = 'feedback'; $('feedback').textContent = ''; }

  // Scaled, responsive, finger/stylus/mouse signature pad.
  // Strokes use 0..1 coordinates so orientation changes do not erase signatures.
  function drawSignature() {
    const rect = pad.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(3, window.devicePixelRatio || 1);
    pad.width = Math.round(rect.width * ratio);
    pad.height = Math.round(rect.height * ratio);
    const ctx = pad.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#22251f';
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * rect.width, stroke[0].y * rect.height);
      for (const point of stroke.slice(1)) ctx.lineTo(point.x * rect.width, point.y * rect.height);
      ctx.stroke();
    }
    $('signatureHint').style.display = strokes.some(s => s.length > 1) ? 'none' : '';
  }
  function point(event) {
    const rect = pad.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) };
  }
  pad.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    pad.setPointerCapture(event.pointerId);
    currentStroke = [point(event)];
    strokes.push(currentStroke);
  });
  pad.addEventListener('pointermove', (event) => {
    if (!currentStroke) return;
    event.preventDefault();
    currentStroke.push(point(event)); drawSignature();
  });
  function finishDraw(event) {
    if (!currentStroke) return;
    event.preventDefault();
    currentStroke.push(point(event));
    currentStroke = null;
    drawSignature();
  }
  pad.addEventListener('pointerup', finishDraw);
  pad.addEventListener('pointercancel', finishDraw);
  pad.addEventListener('lostpointercapture', () => { currentStroke = null; drawSignature(); });
  $('clearSignature').addEventListener('click', () => { strokes = []; currentStroke = null; drawSignature(); clearFeedback(); });
  new ResizeObserver(() => drawSignature()).observe(pad);

  function getValidatedReport() {
    for (const field of ['workerName', 'location', 'shiftDate', 'startTime', 'finishTime', 'supervisorName']) {
      if (!clean($(field).value)) {
        feedback('Please complete all fields marked with *, including the supervisor name.', true);
        $(field).focus(); return null;
      }
    }
    const people = workerInputs();
    for (const input of people) {
      if (!clean(input.value)) {
        feedback('Enter every worker’s full name, or remove an unused worker field.', true);
        input.focus(); return null;
      }
    }
    const names = people.map(input => clean(input.value));
    if (new Set(names.map(name => name.toLocaleLowerCase())).size !== names.length) {
      feedback('The same worker name is listed more than once. Please correct the names.', true);
      return null;
    }
    const result = calc();
    if (result.error) { feedback(result.error, true); $('startTime').focus(); return null; }
    if (!strokes.some(s => s.length >= 2)) {
      feedback('The supervisor needs to sign in the signature box before sharing.', true);
      pad.scrollIntoView({ behavior: 'smooth', block: 'center' }); return null;
    }
    return {
      name: names[0], names, location: clean($('location').value),
      date: formatDate($('shiftDate').value), isoDate: $('shiftDate').value,
      start: result.start, finish: result.finish, breakTime: result.breakTime,
      paid: result.paid, overnight: result.overnight,
      message: clean($('message').value), supervisor: clean($('supervisorName').value), company: clean($('companyName').value)
    };
  }
  function populatePrintable(r) {
    $('pWorkerLabel').textContent = r.names.length > 1 ? `WORKERS (${r.names.length}) — SHARED SHIFT` : 'WORKER';
    $('pWorker').replaceChildren();
    r.names.forEach((name, i) => {
      const line = document.createElement('div');
      line.textContent = r.names.length > 1 ? `${i + 1}. ${name}` : name;
      $('pWorker').appendChild(line);
    });
    $('pDate').textContent = r.date;
    $('pLocation').textContent = r.location;
    $('pStart').textContent = r.start;
    $('pFinish').textContent = r.finish + (r.overnight ? ' (+1 day)' : '');
    $('pBreak').textContent = `${r.breakTime} min`;
    $('pHours').textContent = `${pretty(r.paid)} (${(r.paid / 60).toFixed(2)}h)`;
    $('pMessage').textContent = r.message || 'No additional comments.';
    $('pSupervisor').textContent = r.supervisor;
    $('pCompany').textContent = r.company || '—';
    $('pSignature').src = pad.toDataURL('image/png');
  }

  // Shareable, high-resolution image, drawn locally, with no external dependencies.
  function makeImage(report) {
    const W = 1200, PAD = 76, cream = '#f6f4ef', dark = '#20231e', gold = '#bead96', grey = '#797b73';
    const canvas = document.createElement('canvas');
    const measureCtx = canvas.getContext('2d');
    const bodyWidth = W - PAD * 2;
    measureCtx.font = '27px Arial, sans-serif';
    function linesFor(str, maxWidth, ctx, maxLines = 30) {
      const out = [];
      for (const paragraph of (str || '').split('\n')) {
        if (!paragraph.trim()) { out.push(''); continue; }
        let row = '';
        for (const word of paragraph.split(/\s+/)) {
          const next = row ? row + ' ' + word : word;
          if (ctx.measureText(next).width <= maxWidth) { row = next; continue; }
          if (row) { out.push(row); row = ''; }
          let part = '';
          for (const ch of word) {
            if (ctx.measureText(part + ch).width > maxWidth && part) { out.push(part); part = ''; }
            part += ch;
          }
          row = part;
        }
        if (row) out.push(row);
        if (out.length >= maxLines) break;
      }
      return out.slice(0, maxLines);
    }
    const noteLines = linesFor(report.message || 'No additional comments.', bodyWidth - 52, measureCtx, 28);
    measureCtx.font = 'bold 35px Arial, sans-serif';
    const siteLines = linesFor(report.location, bodyWidth - 65, measureCtx, 4);
    const nameLines = report.names.flatMap((name, index) => linesFor(
      report.names.length > 1 ? `${index + 1}. ${name}` : name, bodyWidth - 65, measureCtx, 4
    ));
    const approvalColumnWidth = (bodyWidth - 75) / 2;
    const supervisorLines = linesFor(report.supervisor, approvalColumnWidth - 22, measureCtx, 3);
    const companyLines = linesFor(report.company || '—', approvalColumnWidth - 22, measureCtx, 3);
    const locationHeight = Math.max(82, siteLines.length * 44 + 38);
    const workerHeight = Math.max(82, nameLines.length * 44 + 38);
    const noteHeight = Math.max(135, 90 + noteLines.length * 37);
    const supervisorHeight = Math.max(89, Math.max(supervisorLines.length, companyLines.length) * 42 + 44);
    const H = 1225 + workerHeight + locationHeight + noteHeight + supervisorHeight + (report.overnight ? 37 : 0);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    function rect(x,y,w,h,color,r=0){ctx.fillStyle=color;if(r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}else ctx.fillRect(x,y,w,h);}
    function txt(text,x,y,size=26,color=dark,bold=false){ctx.font=`${bold?'bold ':''}${size}px Arial, sans-serif`;ctx.fillStyle=color;ctx.fillText(text,x,y);}
    function wrapped(textLines,x,y,lh,size=28,color=dark,bold=false){for(const line of textLines){txt(line,x,y,size,color,bold);y+=lh;}return y;}
    rect(0,0,W,H,cream);
    rect(0,0,W,243,dark);
    rect(0,242,W,7,gold);
    txt('go',PAD,110,76,gold,true);txt('Labour',183,110,76,'#fff8ec',true);
    txt('S  O  L  U  T  I  O  N  S',PAD + 8,150,23,gold);
    txt('DAILY / END-OF-SHIFT REPORT',PAD,207,19,'#d7cebe',true);
    const rightLabel='SUPERVISOR SIGNED';ctx.font='bold 17px Arial,sans-serif';txt(rightLabel,W-PAD-ctx.measureText(rightLabel).width,205,17,'#d7cebe',true);
    txt('Daily timesheet',PAD,327,48,dark,true);
    let y = 366;
    function label(text, x, yy){txt(text,x,yy,17,'#8c7960',true);}
    function paperField(labelText, valueLines, height){
      rect(PAD,y,bodyWidth,height,'#fffefa',12);rect(PAD,y,6,height,gold,3);label(labelText,PAD+28,y+34);
      wrapped(valueLines,PAD+28,y+82,44,35,dark,true);
      y+=height+15;
    }
    paperField(report.names.length > 1 ? `WORKERS (${report.names.length}) — SAME SHIFT` : 'WORKER NAME',nameLines,workerHeight+38);
    paperField('SITE / LOCATION',siteLines,locationHeight+38);
    rect(PAD,y,bodyWidth,88,'#ece5d9',10);label('SHIFT DATE',PAD+26,y+32);txt(report.date,PAD+26,y+72,32,dark,true);y+=110;
    const colWidth=bodyWidth/4;
    for (let i=0;i<4;i++) rect(PAD+i*colWidth,y,colWidth-2,168,i===3?dark:'#fffefa',i===0?10:0);
    const labels=['START','BREAK','FINISH','PAID HOURS'];
    const values=[report.start,report.breakTime+' min',report.finish,pretty(report.paid)];
    for(let i=0;i<4;i++){label(labels[i],PAD+19+i*colWidth,y+40);txt(values[i],PAD+19+i*colWidth,y+108,31,i===3?'#fff8e8':dark,true);}
    y+=183;
    if(report.overnight){txt('OVERNIGHT SHIFT · Finish time is the following day',PAD+10,y+17,21,'#8e7454');y+=37;}
    rect(PAD,y,bodyWidth,noteHeight,'#fffefa',12);label('MESSAGES / COMMENTS',PAD+25,y+39);wrapped(noteLines,PAD+25,y+87,37,27,dark,false);y+=noteHeight+22;
    rect(PAD,y,bodyWidth,300+supervisorHeight,'#e9e1d6',12);label('SUPERVISOR APPROVAL',PAD+26,y+37);
    label('SUPERVISOR FULL NAME',PAD+26,y+75);
    label('COMPANY NAME',PAD+26+approvalColumnWidth+23,y+75);
    wrapped(supervisorLines,PAD+26,y+117,42,30,dark,true);
    wrapped(companyLines,PAD+26+approvalColumnWidth+23,y+117,42,30,dark,true);
    const signBoxY=y+105+supervisorHeight;
    rect(PAD+25,signBoxY,bodyWidth-50,148,'#fffefa',11);
    ctx.drawImage(pad,PAD+55,signBoxY+4,bodyWidth-110,138);
    rect(PAD+42,signBoxY+151,bodyWidth-84,2,'#d1c6b9');txt('SUPERVISOR SIGNATURE',PAD+42,signBoxY+180,16,'#877a69',true);
    txt('SUPERVISOR-REVIEWED • DEVICE-GENERATED TIMESHEET',PAD,H-70,17,'#83837c',true);
    txt('golabour.com.au',PAD,H-39,19,'#8c7960');
    return canvas;
  }
  function fileName(r) {
    const safe = r.names.length > 1 ? `Group-${r.names.length}-Workers` : (r.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,50) || 'worker');
    return `GoLabour-Timesheet-${r.isoDate}-${safe}.png`;
  }
  function canvasToFile(canvas, name) {
    const url = canvas.toDataURL('image/png');
    const binary = atob(url.slice(url.indexOf(',')+1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; ++i) bytes[i] = binary.charCodeAt(i);
    return { file: new File([bytes], name, {type:'image/png'}), url };
  }
  function triggerDownload(url, name) {
    const link = document.createElement('a');
    link.href = url; link.download = name;
    document.body.appendChild(link); link.click(); link.remove();
  }
  // iOS Safari often ignores an <a download> request for an image, or puts it in
  // Files/Downloads rather than the Photos album. Instead, keep a real image
  // preview on screen, with an intentional second tap for native file sharing.
  // This avoids losing the user gesture required by navigator.share after canvas
  // conversion and also enables long-press > Save Image on iPhones.
  let previewUrl = '';
  let previewFile = null;
  let previewName = '';
  let previewPreviousFocus = null;
  const previewCss = document.createElement('style');
  previewCss.textContent = `
    .gl-photo-preview[hidden]{display:none!important}
    .gl-photo-preview{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:rgba(12,14,12,.86);backdrop-filter:blur(9px)}
    .gl-photo-panel{background:#f7f5ef;color:#1b211e;border-radius:19px;width:min(100%,590px);max-height:96dvh;min-height:0;overflow-y:auto;padding:17px;box-shadow:0 30px 90px #0007}
    .gl-photo-top{display:flex;align-items:flex-start;gap:12px;justify-content:space-between}
    .gl-photo-top h2{font-size:21px;margin:0 0 4px;color:#1d221d}
    .gl-photo-top p{font-size:12px;color:#666a61;line-height:1.5;margin:0 0 12px}
    .gl-photo-close{background:#e5ded3;color:#262c26;border:0;border-radius:9px;min-width:39px;min-height:39px;font-size:23px;line-height:1;cursor:pointer}
    .gl-photo-preview-image{display:block;width:100%;height:auto;max-height:45dvh;object-fit:contain;object-position:top;background:#fff;border:1px solid #ded8cc;border-radius:10px;-webkit-touch-callout:default;user-select:auto;-webkit-user-select:auto}
    .gl-photo-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:13px}
    .gl-photo-actions button,.gl-photo-actions a{padding:13px 12px;min-height:49px;border:1px solid #c8bcaa;border-radius:10px;text-align:center;font-size:13px;font-weight:800;cursor:pointer;text-decoration:none;color:#2b2f28;background:#fff;display:flex;align-items:center;justify-content:center}
    .gl-photo-actions .gl-photo-native{background:#252923;color:#fff;border-color:#252923}
    .gl-photo-instructions{font-size:12px;line-height:1.55;color:#5d635b;margin:13px 2px 0}
    .gl-photo-info{font-size:12px;color:#79582f;margin:8px 2px 0;min-height:1.25em}
    @media(max-width:420px){.gl-photo-panel{padding:13px}.gl-photo-actions{grid-template-columns:1fr}.gl-photo-preview-image{max-height:38dvh}}
  `;
  document.head.appendChild(previewCss);
  const photoDialog = document.createElement('div');
  photoDialog.className = 'gl-photo-preview';
  photoDialog.hidden = true;
  photoDialog.setAttribute('role', 'dialog');
  photoDialog.setAttribute('aria-modal', 'true');
  photoDialog.setAttribute('aria-labelledby', 'gl-photo-heading');
  photoDialog.innerHTML = `
    <div class="gl-photo-panel">
      <div class="gl-photo-top">
        <div><h2 id="gl-photo-heading">Your signed timesheet photo</h2><p>Check the image before saving it to your phone.</p></div>
        <button type="button" class="gl-photo-close" id="gl-photo-close" aria-label="Close image preview">×</button>
      </div>
      <img class="gl-photo-preview-image" id="gl-photo-image" alt="Signed GoLabour timesheet image. Touch and hold to save the photo on iPhone." />
      <div class="gl-photo-actions">
        <button type="button" class="gl-photo-native" id="gl-photo-share">Save to Photos / Share</button>
        <a id="gl-photo-download" href="#" download>Download PNG</a>
      </div>
      <p class="gl-photo-instructions"><strong>iPhone:</strong> tap “Save to Photos / Share”, then choose <strong>Save Image</strong> if available. Or touch and hold the photo above and choose Save to Photos. <strong>Android:</strong> use Share or Download PNG; the downloaded image may be in Downloads instead of your Gallery.</p>
      <p class="gl-photo-info" id="gl-photo-info" role="status" aria-live="polite"></p>
    </div>`;
  document.body.appendChild(photoDialog);
  const photo = (id) => document.getElementById(id);
  const photoInfo = (message) => { photo('gl-photo-info').textContent = message; };
  function closePreview() {
    photoDialog.hidden = true;
    document.body.style.overflow = '';
    // Keep the URL alive while another app/browser tab may be reading it.
    previewPreviousFocus?.focus();
    if (previewUrl) {
      const old = previewUrl;
      setTimeout(() => URL.revokeObjectURL(old), 60000);
      previewUrl = '';
    }
    previewFile = null;
  }
  photo('gl-photo-close').addEventListener('click', closePreview);
  photoDialog.addEventListener('click', (event) => { if (event.target === photoDialog) closePreview(); });
  document.addEventListener('keydown', (event) => {
    if (!photoDialog.hidden && event.key === 'Escape') closePreview();
  });
  function openPreview(blob, name) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewName = name;
    previewFile = new File([blob], name, { type: 'image/png' });
    previewUrl = URL.createObjectURL(blob);
    photo('gl-photo-image').src = previewUrl;
    const a = photo('gl-photo-download');
    a.href = previewUrl;
    a.download = name;
    photoInfo('');
    previewPreviousFocus = document.activeElement;
    photoDialog.hidden = false;
    document.body.style.overflow = 'hidden';
    photo('gl-photo-close').focus();
  }
  photo('gl-photo-share').addEventListener('click', async () => {
    if (!previewFile) return;
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [previewFile] }))) {
      try {
        // Must execute directly in the user's click, not after awaiting a canvas conversion.
        await navigator.share({ files: [previewFile], title: 'GoLabour signed timesheet' });
        photoInfo('Share menu completed. If you chose Save Image, check Photos.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') { photoInfo('Saving or sharing cancelled. Your image is still here.'); return; }
      }
    }
    photoInfo('This browser cannot open the image-sharing menu. Touch and hold the picture above to save it, or tap Download PNG.');
  });
  photo('gl-photo-download').addEventListener('click', () => {
    photoInfo('Download requested. On iPhone, Safari may save PNG files to Files > Downloads instead of Photos. To use Photos, try Save to Photos / Share above.');
  });
  $('downloadButton').addEventListener('click', () => {
    const r = getValidatedReport(); if (!r) return;
    try {
      const canvas = makeImage(r);
      const name = fileName(r);
      const btn = $('downloadButton');
      btn.disabled = true;
      canvas.toBlob((blob) => {
        btn.disabled = false;
        if (!blob || !blob.size) { feedback('Image creation failed. Please try Print / Save as PDF.', true); return; }
        try {
          openPreview(blob, name);
          feedback('Signed timesheet photo ready. Use the preview to save it to Photos or download the PNG.');
        } catch {
          feedback('Cannot open the photo preview on this device. Please try Print / Save as PDF.', true);
        }
      }, 'image/png');
    } catch {
      $('downloadButton').disabled = false;
      feedback('Unable to create the image on this device. Try Print / Save as PDF instead.', true);
    }
  });
  $('shareButton').addEventListener('click', async () => {
    const r = getValidatedReport(); if (!r) return;
    let bundle;
    try { bundle = canvasToFile(makeImage(r),fileName(r)); }
    catch { feedback('Unable to generate the image. Try Print / Save as PDF.',true); return; }
    if (navigator.share && (!navigator.canShare || navigator.canShare({files:[bundle.file]}))) {
      try {
        await navigator.share({files:[bundle.file],title:`GoLabour timesheet — ${r.names.length > 1 ? `${r.names.length} workers` : r.name}`,text:`GoLabour timesheet • ${r.names.join(', ')} • ${r.date} • ${pretty(r.paid)} each`});
        feedback('The share sheet was opened. If you selected WhatsApp and a group, please confirm the message was sent there.');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') { feedback('Sharing cancelled. No file was submitted.'); return; }
      }
    }
    triggerDownload(bundle.url,fileName(r));
    feedback('Your browser cannot share image files directly. I downloaded the PNG instead — attach it in your WhatsApp work group.');
  });
  $('printButton').addEventListener('click', () => {
    const r = getValidatedReport(); if (!r) return;
    populatePrintable(r);
    window.print();
    feedback('Print dialog opened. Choose “Save as PDF” to make a PDF copy for WhatsApp.');
  });
  $('resetButton').addEventListener('click', () => {
    if (!window.confirm('Clear the form and signature to start a new timesheet?')) return;
    $('timesheetForm').reset();
    extraWorkers.replaceChildren();
    refreshWorkerControls();
    strokes = []; currentStroke = null; drawSignature();
    recalc(); $('charCount').textContent = '0 / 650'; clearFeedback();
    window.scrollTo({top:0,behavior:'smooth'});
  });
  for (const id of ids) $(id).addEventListener('input', () => {
    if (['startTime','finishTime','breakMinutes'].includes(id)) recalc();
    if (id === 'message') $('charCount').textContent = `${$('message').value.length} / 650`;
    clearFeedback();
  });
  // Every visit starts with an empty form; do not restore details left by another worker.
  $('timesheetForm').reset();
  extraWorkers.replaceChildren();
  refreshWorkerControls();
  for (const id of ids) $(id).value = '';
  recalc();
  $('charCount').textContent = `${$('message').value.length} / 650`;
  drawSignature();
})();
