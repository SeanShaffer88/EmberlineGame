// This classic script must run before the module graph is fetched or evaluated.
// A failed import cannot be caught inside main.js itself.
(function () {
 'use strict';
 var ready = false, timer;
 function fail(detail) {
  if (ready) return;
  var loading = document.getElementById('loading');
  if (!loading) return;
  loading.hidden = false;
  loading.replaceChildren();
  var title = document.createElement('h2');
  title.textContent = 'The valley could not start';
  var message = document.createElement('p');
  message.textContent = 'Your saved settlement has not been reset. Try again, or share the details below.';
  var details = document.createElement('pre');
  details.id = 'startup-details';
  var environment = navigator.userAgent;
  try {
   if (window.EmberlineNative && window.EmberlineNative.deviceInfo) environment = window.EmberlineNative.deviceInfo();
  } catch (_) {}
  details.textContent = 'Emberline 0.1.2\n' + String(detail).slice(0, 1400) + '\n\n' + environment;
  var retry = document.createElement('button');
  retry.className = 'primary'; retry.textContent = 'Try again';
  retry.onclick = function () { location.reload(); };
  loading.append(title, message, details, retry);
 }
 window.emberlineStartupError = fail;
 window.emberlineReady = function () {
  ready = true; clearTimeout(timer);
  document.getElementById('loading').hidden = true;
 };
 window.addEventListener('error', function (event) {
  if (event.target && event.target.tagName === 'SCRIPT') {
   fail('Could not load game script: ' + event.target.getAttribute('src'));
  } else if (event.message) {
   fail(event.message + '\n' + (event.filename || '') + ':' + (event.lineno || ''));
  }
 }, true);
 window.addEventListener('unhandledrejection', function (event) {
  fail(event.reason && (event.reason.stack || event.reason.message) || String(event.reason));
 });
 timer = setTimeout(function () { fail('Startup did not finish within 20 seconds.'); }, 20000);
}());
