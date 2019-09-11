const { expect } = require('chai');
const { parse } = require('parse5');
const path = require('path');
const fs = require('fs');
const { injectPolyfillsLoader } = require('../src/inject-polyfills-loader');

const updateSnapshots = process.argv.includes('--update-snapshots');

const indexHTML = `
<html lang="en-GB">

<head>
  <title>My app</title>
  <style>
    my-app {
      display: block;
    }
  </style>
</head>

<body>
  <h1>
    <span>
      Hello world!
    </span>
  </h1>
  <my-app></my-app>
</body>

</html>
`;

function testSnapshot(name, config) {
  const snapshotPath = path.join(__dirname, 'snapshots', 'inject-polyfills-loader', `${name}.html`);
  const result = injectPolyfillsLoader(indexHTML, config);

  if (updateSnapshots) {
    fs.writeFileSync(snapshotPath, result.indexHTML, 'utf-8');
  } else {
    const snapshot = fs.readFileSync(snapshotPath, 'utf-8');
    expect(result.indexHTML).to.equal(snapshot);
  }
}

describe('generate-index-html', () => {
  it('generates a index.html with module', () => {
    testSnapshot('module', {
      entries: { type: 'module', files: ['app.js'] },
      minify: false,
    });
  });

  it('generates a index.html with a script entry', () => {
    testSnapshot('script', {
      entries: { type: 'script', files: ['app.js', 'shared.js'] },
      minify: false,
    });
  });

  it('generates a index.html with a system entry', () => {
    testSnapshot('system', {
      entries: { type: 'system', files: ['app.js', 'shared.js'] },
      minify: false,
    });
  });

  it('generates a index.html with a module and legacy system', () => {
    testSnapshot('module-system', {
      entries: { type: 'module', files: ['app.js'] },
      legacyEntries: { type: 'system', files: ['legacy/app.js'] },
      minify: false,
    });
  });

  it('generates a index.html with polyfills', () => {
    testSnapshot('polyfill-multiple', {
      entries: { type: 'module', files: ['app.js'] },
      minify: false,
      polyfills: {
        coreJs: true,
        webcomponents: true,
        fetch: true,
        dynamicImport: true,
      },
    });
  });

  it('generates a index.html with legacy and polyfills', () => {
    testSnapshot('polyfill-multiple-legacy', {
      entries: { type: 'module', files: ['app.js'] },
      legacyEntries: { type: 'system', files: ['legacy/app.js'] },
      minify: false,
      polyfills: {
        coreJs: true,
        webcomponents: true,
      },
    });
  });

  it('generates a index.html with preload files', () => {
    testSnapshot('preload', {
      entries: { type: 'module', files: ['app.js'] },
      minify: false,
      preloadFiles: ['./preload-a.js', './preload-b.js'],
    });
  });
});
