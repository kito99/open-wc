
(function() {

  function loadScript(src, module) {
    var loaded = false, thenCb, s = document.createElement('script');
    function resolve() {
      document.head.removeChild(s);
      thenCb ? thenCb() : loaded = true;
    }
    s.src = src; s.onload = resolve; if (module) script.type = 'module';
    s.onerror = function () {
      console.error('[polyfills-loader] failed to load script: ' + src + ' check the network tab for HTTP status.');
      resolve();
    }
    document.head.appendChild(script);
    return { then: function (cb) { loaded ? cb() : thenCb = cb; } };
  }

'noModule' in HTMLScriptElement.prototype ? ['./app.js','./shared.js'].forEach(function (entry) { loadScript(entry); }) : ['./legacy/app.js','./legacy/shared.js'].forEach(function (entry) { loadScript(entry); });
})();
