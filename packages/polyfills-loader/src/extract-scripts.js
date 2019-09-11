const { isUri } = require('valid-url');
const { queryAll, predicates, getAttribute, remove } = require('@open-wc/building-utils/dom5-fork');

const jsScriptTypes = ['application/javascript', 'text/javascript'];

/**
 * @typedef {import('parse5').ASTNode} ASTNode
 */

/**
 * @typedef {object} ExtractResult
 * @property {import('parse5').ASTNode} indexHTML the index file, with resources removed
 * @property {string[]} inlineJsModules inline module scripts
 * @property {string[]} jsModules paths to js modules that were found
 * @property {string[]} inlineJsScripts inline js scripts
 * @property {string[]} jsScripts paths to js scripts that were found
 * @property {string[]} inlineImportMaps content of inline import maps that were found
 * @property {string[]} importMaps paths to import map json files that were found
 */

/**
 * Extracts resources from an html file. Resources are any files referenced by the file
 * using script or link elements.
 *
 * @param {ASTNode} indexHTML the html file as string
 * @param {{ removeJsModules?: boolean, removeJsScripts?: boolean, removeImportMaps?: boolean }} options
 * @returns {ExtractResult}
 */
function extractScripts(indexHTML, options = {}) {
  const { removeJsModules = true, removeJsScripts = true, removeImportMaps = true } = options;

  const allScripts = queryAll(indexHTML, predicates.hasTagName('script'));
  const jsScriptScripts = allScripts.filter(script => {
    const type = getAttribute(script, 'type');
    return !type || jsScriptTypes.includes(type);
  });
  const jsModuleScripts = allScripts.filter(script => getAttribute(script, 'type') === 'module');
  const importMapScripts = allScripts.filter(script => getAttribute(script, 'type') === 'importmap');

  const inlineJsModules = [];
  const jsModules = [];
  const inlineJsScripts = [];
  const jsScripts = [];
  const inlineImportMaps = [];
  const importMaps = [];

  /**
   *
   * @param {ASTNode} node
   * @param {ASTNode[]} scripts
   * @param {string[]} inlineScripts
   * @param {boolean} removeNode
   */
  function processScript(node, inlineScripts, scripts, removeNode) {
    const src = getAttribute(node, 'src');
    // don't touch scripts which reference external resources
    if (isUri(src)) {
      return;
    }

    if (src) {
      scripts.push(src);
    } else if (node.childNodes && node.childNodes[0]) {
      inlineScripts.push(node.childNodes[0].value);
    }

    if (removeNode) {
      remove(node);
    }
  }

  jsModuleScripts.forEach(node => processScript(node, inlineJsModules, jsModules, removeJsModules));
  jsScriptScripts.forEach(node => processScript(node, inlineJsScripts, jsScripts, removeJsScripts));
  importMapScripts.forEach(node => processScript(node, inlineImportMaps, importMaps, removeImportMaps));

  return { indexHTML, inlineJsModules, jsModules, inlineJsScripts, jsScripts, inlineImportMaps, importMaps };
}

module.exports.extractScripts = extractScripts;
