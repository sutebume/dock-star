/* Dock Star — boot. */
window.addEventListener('DOMContentLoaded', function () {
  try { DS.ads.init(); } catch (e) { console.error('[DS] ads init failed', e); }
  try { DS.payments.init(); } catch (e) { console.error('[DS] payments init failed', e); }
  DS.ui.init();
});
