# purgecss-from-lit

This package is a [purgecss extractor][extractors] for extracting css selectors
from typescript files containing [lit] web components. Specifically, it will
parse the `html`-tagged templates within your source code and extract classes
from the HTML within.

## Caveats
- This plugin parses all included code as typescript. This shouldn't cause any
  issues when parsing javascript but there may be code that causes issues.

- This plugin only looks for template literals of the form
  ```js
  html`<div>HTML here</div>`
  ```
  If you end up directly invoking the `html` function somehow then that will
  not be caught by `purgecss-from-lit`.

- Elements, attributes, classes, and ids added as template values will not be
  picked up. If you find that those selectors are being stripped by purgecss
  then you will need to add them to the `safelist` in your purgecss config.

  For example, `purgecss-from-lit` will not detect the `button` tag in the
  element below
  ```js
  const button = literal`button`;
  const demoClass = "demo-button";

  html`<${button} class=${demoClass}>Click Me</button>`
  ```
  If you use the `button` tag nowhere else in your page or app then you would
  need to add the `button` selector to the `safelist` in order to preserve it.
  The same applies for the `.demo-button` class here.

[extractors]: https://purgecss.com/extractors.html
[lit]: https://lit.dev/

## Installation
### npm
```
npm install --save-dev @swlynch99/purgecss-from-lit
```

### yarn
```
yarn install -D @swlynch99/purgecss-from-lit
```

### pnpm
```
pnpm install -D @swlynch99/purgecss-from-lit
```

## Usage
List the function as one of the extractors in your `purgecss` config
```js
import purgeLit from '@swlynch99/purgecss-from-lit';

export default {
    extractors: [
        {
            extractor: purgeLit(),
            extensions: ['js', 'ts']
        }
    ],
    ...
}
```

You can optionally pass a config for
[`@typescript-eslint/typescript-estree`][estree] in order to configure how the
files are parsed. This can be used to generate a lit extractor that supports
JSX (although it will not parse classes from said JSX).
```js
import purgeLit from '@swlynch99/purgecss-from-lit';

export default {
    extractors: [
        {
            extractor: purgeLit({ jsx: true }),
            extensions: ['jsx', 'tsx'],
        }
    ]
}
```

[estree]: https://typescript-eslint.io/packages/typescript-estree/#parsecode-options
