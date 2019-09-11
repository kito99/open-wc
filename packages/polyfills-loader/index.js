const { createPolyfillsLoader } = require('./src/polyfills-loader');
const { getPolyfills } = require('./src/polyfills');

module.exports = {
  createPolyfillsLoader,
  getPolyfills,
};
