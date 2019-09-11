const { expect } = require('chai');
const { parse } = require('parse5');
const { getAttribute, queryAll, predicates } = require('@open-wc/building-utils/dom5-fork');
const { extractScripts } = require('../src/extract-scripts');

const htmlString = `
  <html>
    <head>
      <script type="module" src="module-a.js"></script>
      <script src="script-a.js"></script>
      <script type="importmap">{ "imports": {} }</script>
      <script type="importmap" src="./importmap.json"></script>
    </head>
    <body>
      <script type="module" src="module-b.js"></script>
      <script src="script-b.js"></script>
      <script type="module">console.log('hello module');</script>
      <script>console.log('hello script');</script>
      <script type="module" src="module-c.js"></script>
      <script src="script-c.js"></script>
    </body>
  </html>
`;

describe('extractScripts', () => {
  it('returns any scripts found', () => {
    const result = extractScripts(parse(htmlString));
    expect(result.jsModules).to.eql(['module-a.js', 'module-b.js', 'module-c.js']);
    expect(result.inlineJsModules).to.eql(["console.log('hello module');"]);
    expect(result.jsScripts).to.eql(['script-a.js', 'script-b.js', 'script-c.js']);
    expect(result.inlineJsScripts).to.eql(["console.log('hello script');"]);
    expect(result.importMaps).to.eql(['./importmap.json']);
    expect(result.inlineImportMaps).to.eql(['{ "imports": {} }']);
  });

  it('removes scripts from result', () => {
    const result = extractScripts(parse(htmlString));
    const scripts = queryAll(result.indexHTML, predicates.hasTagName('script'));
    expect(scripts.length).to.equal(0);
  });

  it('does not remove scripts from result when configured', () => {
    const result = extractScripts(parse(htmlString), { removeImportMaps: false, removeJsModules: false, removeJsScripts: false });
    const scripts = queryAll(result.indexHTML, predicates.hasTagName('script'));
    expect(scripts.length).to.equal(10);
  });

  it('does not touch any scripts which reference external sources', () => {
    const html = parse(`
      <html>
        <body>
          <script type="module" src="./module.js"></script>
          <script type="module" src="https://cdn.com/my-module.js"></script>

          <script type="importmap" src="./importmap.json"></script>
          <script type="importmap" src="https://cdn.com/my-module.js"></script>

          <script src="./script.js"></script>
          <script src="https://cdn.com/my-module.js"></script>
        </body>
      </html>
    `);

    const result = extractScripts(html);
    expect(result.jsModules).to.eql(['./module.js']);
    expect(result.jsScripts).to.eql(['./script.js']);
    expect(result.importMaps).to.eql(['./importmap.json']);
  });
});
