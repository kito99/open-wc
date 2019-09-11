
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

  var polyfills = [];
  if (!('noModule' in HTMLScriptElement.prototype)) { polyfills.push(loadScript('polyfills/core-js.mockhash.js', false)) }
  if (!('fetch' in window)) { polyfills.push(loadScript('polyfills/fetch.mockhash.js', false)) }
  if (!('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype)) { polyfills.push(loadScript('polyfills/intersection-observer.mockhash.js', false)) }
  if (!('attachShadow' in Element.prototype) || !('getRootNode' in Element.prototype)) { polyfills.push(loadScript('polyfills/webcomponents.mockhash.js', false)) }
  if (!('noModule' in HTMLScriptElement.prototype) && 'getRootNode' in Element.prototype) { polyfills.push(loadScript('polyfills/custom-elements-es5-adapter.mockhash.js', false)) }

  function loadEntries() {
    'noModule' in HTMLScriptElement.prototype ? ['./app.js','./shared.js'].forEach(function (entry) { window.importShim(entry); }) : ['./legacy/app.js','./legacy/shared.js'].forEach(function (entry) { System.import(entry); });
  }

  polyfills.length ? Promise.all(polyfills).then(loadEntries) : loadEntries();
})();
