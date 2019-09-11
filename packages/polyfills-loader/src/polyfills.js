const path = require('path');
const fs = require('fs');
const Terser = require('terser');
const { createContentHash } = require('./utils');

const noModuleTest = "!('noModule' in HTMLScriptElement.prototype)";

/**
 * @typedef {object} PolyfillCode
 * @property {string} name
 * @property {string} [test]
 * @property {string} code
 * @property {string} hash
 * @property {string} sourcemap
 */

/**
 * @typedef {object} PolyfillConfig
 * @property {string} name name of the polyfill
 * @property {string} path polyfill path
 * @property {string} [test] expression which should evaluate to true to load the polyfill
 * @property {boolean} [module] wether to load the polyfill with type module
 * @property {string} [sourcemapPath] polyfill sourcemaps path
 * @property {boolean} [noMinify] whether to minify the polyfills. default true if no sourcemap is given, false otherwise
 */

/**
 * @typedef {object} SystemJSConfig
 * @property {boolean} nomodule
 */

/**
 * @typedef {object} PolyfillsConfig
 * @property {boolean} [coreJs] whether to polyfill core-js polyfills
 * @property {boolean} [regeneratorRuntime] whether to add regenerator runtime
 * @property {boolean} [webcomponents] whether to polyfill webcomponents
 * @property {boolean} [fetch] whether to polyfill fetch
 * @property {boolean} [intersectionObserver] whether to polyfill intersection observer
 * @property {boolean} [dynamicImport] whether to polyfill dynamic import
 * @property {SystemJSConfig} [systemJs] whether to polyfill systemjs
 * @property {SystemJSConfig} [systemJsExtended] whether to polyfill systemjs, extended version with import maps
 * @property {boolean} [esModuleShims] whether to polyfill es modules using es module shims
 * @property {PolyfillConfig[]} [customPolyfills] custom polyfills specified by the user
 */

/**
 * @param {PolyfillsConfig} config
 * @param {boolean} minify
 * @returns {PolyfillCode[]}
 */
function getPolyfills(config, minify = true) {
/** @type {PolyfillConfig[]} */
  const polyfillConfigs = [...(config.customPolyfills || [])];

  /**
   * @param {PolyfillConfig} polyfillConfig
   * @param {string} [pkg]
   */
  function addPolyfillConfig(polyfillConfig, pkg) {
    try {
      polyfillConfigs.push(polyfillConfig);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error(`configured to polyfill ${polyfillConfig.name},`
          + ` but no polyfills found. Install with "npm i -D ${pkg || polyfillConfig.name}"`);
      }

      throw error;
    }
  }

  if (config.coreJs) {
    addPolyfillConfig({
      name: 'core-js',
      test: noModuleTest,
      path: require.resolve('core-js-bundle/minified.js'),
      sourcemapPath: require.resolve('core-js-bundle/minified.js'),
    }, 'core-js-bundle');
  }

  if (config.regeneratorRuntime) {
    addPolyfillConfig({
      name: 'regenerator-runtime',
      test: noModuleTest,
      path: require.resolve('regenerator-runtime/runtime'),
    });
  }

  if (config.systemJs) {
    addPolyfillConfig({
      name: 'systemjs',
      test: config.systemJs.nomodule ? noModuleTest : null,
      path: require.resolve('systemjs/dist/s.min.js'),
      sourcemapPath: require.resolve('systemjs/dist/s.min.js.map'),
    });
  }

  // full systemjs, including import maps polyfill
  if (config.systemJsExtended) {
    addPolyfillConfig({
      name: 'systemjs',
      test: config.systemJs.nomodule ? noModuleTest : null,
      path: require.resolve('systemjs/dist/system.min.js'),
      sourcemapPath: require.resolve('systemjs/dist/system.min.js.map'),
    });
  }

  if (config.dynamicImport) {
    addPolyfillConfig({
      name: 'dynamic-import',
      /**
       * dynamic import is syntax, not an actual function so we cannot feature detect it without using an import statement.
       * using a dynamic import on a browser which doesn't support it throws a syntax error and prevents the entire script
       * from being run, so we need to dynamically create and execute a function and catch the error. this is not CSP
       * compliant, but neither is the dynamic import polyfill so that's OK in this case
       */
      test: "'noModule' in HTMLScriptElement.prototype && (function () { try { Function('window.importShim = s => import(s);').call(); return true; } catch (_) { return false } })()",
      path: require.resolve('./dynamic-import-polyfill.js'),
    });
  }

  if (config.esModuleShims) {
    addPolyfillConfig({
      name: 'es-module-shims',
      test: "'noModule' in HTMLScriptElement.prototype",
      path: require.resolve('es-module-shims/dist/es-module-shims.min.js'),
      sourcemapPath: require.resolve('es-module-shims/dist/es-module-shims.min.js.map'),
      module: true,
    });
  }

  if (config.fetch) {
    addPolyfillConfig({
      name: 'fetch',
      test: "!('fetch' in window)",
      path: require.resolve('whatwg-fetch/dist/fetch.umd.js'),
    }, 'whatwg-fetch');
  }

  if (config.intersectionObserver) {
    addPolyfillConfig({
      name: 'intersection-observer',
      test:
        "!('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype)",
      path: require.resolve('intersection-observer/intersection-observer.js'),
    });
  }

  if (config.webcomponents) {
    addPolyfillConfig({
      name: 'webcomponents',
      test: "!('attachShadow' in Element.prototype) || !('getRootNode' in Element.prototype)",
      path: require.resolve('@webcomponents/webcomponentsjs/webcomponents-bundle.js'),
      sourcemapPath: require.resolve(
        '@webcomponents/webcomponentsjs/webcomponents-bundle.js.map',
      ),
    }, '@webcomponents/webcomponentsjs');

    // If a browser does not support nomodule attribute, but does support custom elements, we need
    // to load the custom elements es5 adapter. This is the case for Safari 10.1
    addPolyfillConfig({
      name: 'custom-elements-es5-adapter',
      test: "!('noModule' in HTMLScriptElement.prototype) && 'getRootNode' in Element.prototype",
      path: require.resolve('@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js'),
    }, '@webcomponents/webcomponentsjs');
  }

  return polyfillConfigs.map((polyfillConfig) => {
    if (!polyfillConfig.name || !polyfillConfig.path) {
      throw new Error(`A polyfill should have a name and a path property.`);
    }

    const codePath = path.resolve(polyfillConfig.path);
    if (!codePath || !fs.existsSync(codePath) || !fs.statSync(codePath).isFile()) {
      throw new Error(`Could not find a file at ${polyfillConfig.path}`);
    }

    let code = fs.readFileSync(codePath, 'utf-8');
    /** @type {string} */
    let sourcemap;
    if (polyfillConfig.sourcemapPath) {
      const sourcemapPath = path.resolve(polyfillConfig.sourcemapPath);
      if (!sourcemapPath || !fs.existsSync(sourcemapPath) || !fs.statSync(sourcemapPath).isFile()) {
        throw new Error(`Could not find a file at ${polyfillConfig.sourcemapPath}`);
      }

      sourcemap = fs.readFileSync(sourcemapPath, 'utf-8');
      // minify only if there were no source maps, and if not disabled explicitly
    } else if (minify) {
      const minifyResult = Terser.minify(code, { sourceMap: true });
      // @ts-ignore
      ({ code, map: sourcemap } = minifyResult);
    }

    return {
      name: polyfillConfig.name,
      test: polyfillConfig.test,
      hash: createContentHash(code),
      code,
      sourcemap,
    };
  });
}

module.exports.getPolyfills = getPolyfills;
