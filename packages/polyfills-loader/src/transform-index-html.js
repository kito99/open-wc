const { parse } = require('parse5');
const { queryAll, predicates, getAttribute, setAttribute, cloneNode, remove, insertBefore } = require('@open-wc/building-utils/dom5-fork');
const { injectPolyfillsLoader } = require('./inject-polyfills-loader');
const { extractScripts } = require('./extract-scripts');
const { appEntryTypes } = require('./constants');

/** @typedef {import('./inject-polyfills-loader').InjectPolyfillsLoaderConfig} InjectPolyfillsLoaderConfig */
/** @typedef {import('parse5').ASTNode} ASTNode */

/**
 *
 * @param {ASTNode} indexHTML
 * @param {InjectPolyfillsLoaderConfig} config
 */
function injectPolyfilledImportMaps(indexHTML, config) {
  const importMaps = queryAll(indexHTML, predicates.hasTagName('script')).filter(s => getAttribute(s, 'type') === 'importmap');
  const entryTypes = [config.entries.type, config.legacyEntries && config.legacyEntries.type];

  /** @param {string} type */
  function inject(type) {
    importMaps.forEach((importMap) => {
      const newImportMap = cloneNode(importMap);
      setAttribute(newImportMap, 'type', type);
      insertBefore(importMap.parent, importMap, newImportMap);
    });
  }

  if (entryTypes.includes(appEntryTypes.moduleShim)) {
    inject('importmap-shim');
  }

  if (entryTypes.includes(appEntryTypes.systemjs)) {
    inject('systemjs-importmap');
  }

  if (!entryTypes.includes(appEntryTypes.module)) {
    importMaps.forEach((importMap) => {
      remove(importMap);
    });
  }
}

/**
 * Transforms an index.html file, injecting a polyfills loader for
 * compatibility with older browsers.
 *
 * @param {string} indexHTMLString
 * @param {Partial<InjectPolyfillsLoaderConfig>} config
 */
function transformIndexHTML(indexHTMLString, config) {
  const indexHTML = parse(indexHTMLString);

  const { inlineJsModules, jsModules } = extractScripts(indexHTML, { removeImportMaps: false });
  if (config.entries) {
    config.entries.files = jsModules;
  }

  injectPolyfilledImportMaps(indexHTML, config);

  return injectPolyfillsLoader(indexHTML, config);
}

module.exports = {
  transformIndexHTML,
};
