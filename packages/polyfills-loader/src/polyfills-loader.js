/* eslint-disable prefer-template */
const Terser = require('terser');
const { appEntryTypes } = require('./constants');
const { cleanImportPath } = require('./utils');

/**
 * @typedef {object} AppEntries
 * @property {string} type
 * @property {string[]} files
 */

/**
* @typedef {import('./polyfills').PolyfillCode} PolyfillCode
*/

const loadScriptFunction = `
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
  }\n\n`;

/**
 * @param {AppEntries} entries
 * @param {AppEntries} legacyEntries
 * @param {PolyfillCode[]} polyfills
 */
function createLoadScriptCode(entries, legacyEntries, polyfills) {
  if (polyfills && polyfills.length > 0) {
    return loadScriptFunction;
  }

  if (entries.type === 'script' || (legacyEntries && legacyEntries.type === 'script')) {
    return loadScriptFunction;
  }

  return '';
}

const asArrayLiteral = arr => `[${arr.map(e => `'${e}'`).join(',')}]`;

const entryLoaderCreators = {
  [appEntryTypes.script]: files =>
    files.length === 1
      ? `loadScript('${files[0]}')`
      : `${asArrayLiteral(files)}.forEach(function (entry) { loadScript(entry); })`,
  [appEntryTypes.module]: files =>
    files.length === 1
      ? `window.importShim('${files[0]}')`
      : `${asArrayLiteral(files)}.forEach(function (entry) { window.importShim(entry); })`,
  [appEntryTypes.moduleShim]: files =>
    files.length === 1
      ? `window.importShim('${files[0]}')`
      : `${asArrayLiteral(files)}.forEach(function (entry) { window.importShim(entry); })`,
  [appEntryTypes.systemjs]: files =>
    files.length === 1
      ? `System.import('${files[0]}')`
      : `${asArrayLiteral(files)}.forEach(function (entry) { System.import(entry); })`,
};

/**
 * @param {AppEntries} entries
 * @param {AppEntries} legacyEntries
 */
function createEntriesLoaderCodeFunction(entries, legacyEntries) {
  if (!legacyEntries) {
    return `${entryLoaderCreators[entries.type](entries.files.map(cleanImportPath))};`;
  }

  const load = entryLoaderCreators[entries.type](entries.files.map(cleanImportPath));
  const loadLegacy = entryLoaderCreators[legacyEntries.type](
    legacyEntries.files.map(cleanImportPath),
  );
  return `'noModule' in HTMLScriptElement.prototype ? ${load} : ${loadLegacy};`;
}

/**
 * @param {AppEntries} entries
 * @param {AppEntries} legacyEntries
 * @param {PolyfillCode[]} polyfills
 */
function createEntriesLoaderCode(entries, legacyEntries, polyfills) {
  const loadEntriesFunction = createEntriesLoaderCodeFunction(entries, legacyEntries);

  // create a separate loadEntries to be run after polyfills
  if (polyfills && polyfills.length > 0) {
    return `
  function loadEntries() {
    ${loadEntriesFunction}
  }

  polyfills.length ? Promise.all(polyfills).then(loadEntries) : loadEntries();\n`;
  }

  // there are no polyfills, load entries straight away
  return `${loadEntriesFunction}\n`;
}

/**
 * @param {import('@open-wc/building-utils/index-html/create-index-html').Polyfill[]} polyfills
 */
function createPolyfillsLoaderCode(polyfills) {
  if (!polyfills) {
    return '';
  }

  let code = '  var polyfills = [];\n';

  polyfills.forEach(polyfill => {
    const polyfillCode = `polyfills.push(loadScript('polyfills/${polyfill.name}.${polyfill.hash}.js', ${Boolean(polyfill.module)}))`;

    if (polyfill.test) {
      code += `  if (${polyfill.test}) { ${polyfillCode} }\n`;
    } else {
      code += `  ${polyfillCode}\n`;
    }
  });

  return code;
}

/**
 * Creates a loader script that executed immediately.
 *
 * @param {AppEntries} entries
 * @param {AppEntries} legacyEntries
 * @param {import('@open-wc/building-utils/index-html/create-index-html').Polyfill[]} polyfills
 */
function createPolyfillsLoader(entries, legacyEntries, polyfills, minified = true) {
  const code =
    '\n(function() {\n' +
    createLoadScriptCode(entries, legacyEntries, polyfills) +
    createPolyfillsLoaderCode(polyfills) +
    createEntriesLoaderCode(entries, legacyEntries, polyfills) +
    '})();\n';

  return minified ? Terser.minify(code).code : code;
}

module.exports = {
  createPolyfillsLoader,
};
