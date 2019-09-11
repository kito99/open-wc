const { constructors, setAttribute, append } = require('@open-wc/building-utils/dom5-fork');
const crypto = require('crypto');

function createContentHash(content) {
  return crypto
    .createHash('md4')
    .update(content)
    .digest('hex');
}

function cleanImportPath(path) {
  if (path.startsWith('/')) {
    return path;
  }

  if (path.startsWith('../') || path.startsWith('./')) {
    return path;
  }

  return `./${path}`;
}

function createElement(tag, attributes) {
  const element = constructors.element(tag);
  if (attributes) {
    Object.keys(attributes).forEach(key => {
      if (attributes[key] != null) {
        setAttribute(element, key, attributes[key]);
      }
    });
  }
  return element;
}

function createScript(attributes, code) {
  const script = createElement('script', attributes);
  if (code) {
    const scriptText = constructors.text(code);
    append(script, scriptText);
  }
  return script;
}

function createScriptModule(code) {
  return createScript({ type: 'module' }, code);
}

module.exports = {
  createContentHash,
  cleanImportPath,
  createElement,
  createScript,
  createScriptModule,
};
