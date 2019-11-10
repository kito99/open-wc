Need:

- add command line argument with glob `--stories ./stories/*.stories.{js,mdx}`
- make storybook-start work on IE11

Nice to have:

- export needed stuff from '@storybook/addon-docs' via prebuilt... so we do not need the dependency
- Investigate tree shaking / compiling smaller bundle
- Review if all addons are worth their weight
- Allow configuring static files (copy job) in build config
- Allow extending rollup configuration
- mdx transform sourcemaps
