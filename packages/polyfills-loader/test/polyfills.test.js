const path = require('path');
const { expect } = require('chai');
const { getPolyfills } = require('../src/polyfills');

describe('polyfills', () => {
  it('returns the correct polyfills', () => {
    const config = {
      coreJs: true,
      webcomponents: true,
      fetch: true,
      intersectionObserver: true,
    };

    const polyfills = getPolyfills(config, true);
    const polyfillsWithoutCode = polyfills.map(p => ({
      ...p,
      hash: undefined,
      code: undefined,
      sourcemap: undefined,
    }));

    expect(polyfillsWithoutCode).to.eql([
      {
        code: undefined,
        name: 'core-js',
        hash: undefined,
        sourcemap: undefined,
        test: "!('noModule' in HTMLScriptElement.prototype)",
      },
      {
        code: undefined,
        name: 'fetch',
        hash: undefined,
        sourcemap: undefined,
        test: "!('fetch' in window)",
      },
      {
        code: undefined,
        name: 'intersection-observer',
        hash: undefined,
        sourcemap: undefined,
        test:
          "!('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype)",
      },
      {
        code: undefined,
        name: 'webcomponents',
        hash: undefined,
        sourcemap: undefined,
        test: "!('attachShadow' in Element.prototype) || !('getRootNode' in Element.prototype)",
      },
      {
        code: undefined,
        name: 'custom-elements-es5-adapter',
        hash: undefined,
        sourcemap: undefined,
        test: "!('noModule' in HTMLScriptElement.prototype) && 'getRootNode' in Element.prototype",
      },
    ]);

    polyfills.forEach(polyfill => {
      expect(polyfill.code).to.be.a('string');
      expect(polyfill.hash).to.be.a('string');
      expect(polyfill.sourcemap).to.be.a('string');
    });
  });

  it('handles systemjs nomodule true', () => {
    const config = {
      systemJs: { nomodule: true },
    };

    const polyfills = getPolyfills(config);
    const polyfillsWithoutCode = polyfills.map(p => ({
      ...p,
      hash: undefined,
      code: undefined,
      sourcemap: undefined,
    }));

    expect(polyfillsWithoutCode).to.eql([
      {
        code: undefined,
        name: 'systemjs',
        hash: undefined,
        test: "!('noModule' in HTMLScriptElement.prototype)",
        sourcemap: undefined,
      },
    ]);
  });

  it('handles systemjs nomodule false', () => {
    const config = {
      systemJs: { nomodule: false },
    };

    const polyfills = getPolyfills(config);
    const polyfillsWithoutCode = polyfills.map(p => ({
      ...p,
      hash: undefined,
      code: undefined,
      sourcemap: undefined,
    }));

    expect(polyfillsWithoutCode).to.eql([
      {
        code: undefined,
        name: 'systemjs',
        hash: undefined,
        test: null,
        sourcemap: undefined,
      },
    ]);
  });

  it('can load custom polyfills', () => {
    const customPolyfills = [
      {
        name: 'polyfill-a',
        test: "'foo' in window",
        path: path.resolve(__dirname, './fixtures/custom-polyfills/polyfill-a.js'),
      },
      {
        name: 'polyfill-b',
        nomodule: true,
        path: path.resolve(__dirname, './fixtures/custom-polyfills/polyfill-b.js'),
        sourcemapPath: path.resolve(__dirname, './fixtures/custom-polyfills/polyfill-b.js.map'),
      },
    ];
    const config = {
      coreJs: true,
      webcomponents: false,
      fetch: false,
      intersectionObserver: false,
      customPolyfills,
    };

    const polyfills = getPolyfills(config);
    const polyfillsWithoutCode = polyfills.map(p => ({
      ...p,
      hash: undefined,
      code: undefined,
      sourcemap: undefined,
    }));

    expect(polyfillsWithoutCode).to.eql([
      {
        code: undefined,
        name: 'polyfill-a',
        hash: undefined,
        sourcemap: undefined,
        test: "'foo' in window",
      },
      {
        code: undefined,
        name: 'polyfill-b',
        hash: undefined,
        sourcemap: undefined,
        test: undefined,
      },
      {
        code: undefined,
        name: 'core-js',
        test: "!('noModule' in HTMLScriptElement.prototype)",
        hash: undefined,
        sourcemap: undefined,
      },
    ]);

    polyfills.forEach(polyfill => {
      expect(polyfill.code).to.exist;
      expect(polyfill.sourcemap).to.exist;
    });
  });
});
