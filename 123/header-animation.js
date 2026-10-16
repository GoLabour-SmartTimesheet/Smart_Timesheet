/* Adds decoration only. Does not change the heading words or timesheet behaviour. */
(function () {
  function init() {
    var headings = Array.from(document.querySelectorAll('h1, h2'));
    var heading = headings.find(function (el) { return (el.textContent || '').toLowerCase().includes('shift completed'); });
    if (!heading || heading.querySelector('.gl-shift-ornament')) return;
    heading.classList.add('gl-shift-motion');
    var ornament = document.createElement('span');
    ornament.className = 'gl-shift-ornament';
    ornament.setAttribute('aria-hidden', 'true');
    ornament.innerHTML = '<svg viewBox="0 0 900 250" preserveAspectRatio="none" focusable="false" aria-hidden="true"><g class="gl-lines"><path class="gl-line" d="M-80,215 C160,75 350,245 590,85 S900,42 1010,-40"/><path class="gl-line" d="M-90,236 C165,96 360,265 600,106 S905,63 1020,-19"/><path class="gl-line" d="M-95,257 C180,119 380,289 625,127 S923,82 1030,2"/></g></svg><span class="gl-logo">go Labour<small>SOLUTIONS</small></span>';
    heading.insertBefore(ornament, heading.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
