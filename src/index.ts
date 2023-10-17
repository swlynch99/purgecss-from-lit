import { TSESTreeOptions, parse } from '@typescript-eslint/typescript-estree';
import { walk } from 'estree-walker';
import { createHash } from 'crypto';
import parseHtml, { ExtractorResultDetailed } from 'purgecss-from-html';

import { placeholder } from './placeholder';

export type { ExtractorResultDetailed } from 'purgecss-from-html';
export type { TSESTreeOptions } from '@typescript-eslint/typescript-estree';

export type PluginOptions = TSESTreeOptions;

type PluginFunction = (content: string) => ExtractorResultDetailed;

const defaultOptions: TSESTreeOptions = {
  allowInvalidAST: true,
}

/**
 * Create a function to extract selectors from lit web components.
 * 
 * This will look for selectors within html templates used by lit. It is not
 * able to find values inserted dynamically into the template.
 * 
 * @param options - `@typescript-eslint/typescript-estree` options.
 * @returns a function to extract selectors from lit web components.
 */
export default function purgeFromLit(options?: TSESTreeOptions): PluginFunction {
  return purgeFromLitImpl({
    ...defaultOptions,
    ...(options || {})
  });
}

function purgeFromLitImpl(options: TSESTreeOptions) {
  return (content: string): ExtractorResultDetailed => {
    const ast = parse(content, options);

    const attributes = new Set<string[]>();
    const classes = new Set<string>();
    const ids = new Set<string>();
    const tags = new Set<string>();
    const undetermined = new Set<string>();

    walk(ast as any, {
      enter(node): void {
        if (node.type !== "TaggedTemplateExpression")
          return;

        if (node.tag.type !== "Identifier")
          return;
        if (node.tag.name !== "html")
          return;

        const fragments = node.quasi.quasis.map(quasi => quasi.value.cooked!);
        const result = parseHtml(fragments.join(placeholder));

        extendSet(classes, result.classes);
        extendSet(ids, result.ids);
        extendSet(tags, result.tags);
        extendSet(undetermined, result.undetermined);

        const { names, values } = result.attributes;
        for (let [name, value] of names.map((name, i) => [name, values[i]])) {
          // Ignore lit properties and event listeners. They don't correspond
          // to real HTML attributes and so shouldn't be included.
          if (name.startsWith('.') || name.startsWith('@'))
            continue;

          // For boolean attributes we transform them to look as if the
          // attribute is just present. (i.e. `?disabled=${cond}` is changed to
          // just be `disabled`).
          //
          // The value should always be a template here so this should be fine.
          if (name.startsWith('?')) {
            name = name.substring(1);
            value = ''
          }

          if (name === placeholder) {
            classes.add(value);
            ids.add(value);
          }

          attributes.add([name, value]);
        }
      },
    })

    return {
      attributes: unzipAttributes(attributes),
      classes: [...classes],
      ids: [...ids],
      tags: [...tags],
      undetermined: [...undetermined]
    }

    throw "not implemented yet"
  }
}

function extendSet<T>(set: Set<T>, values: T[]) {
  for (const value of values) {
    set.add(value);
  }
}

function unzipAttributes(attrs: Iterable<string[]>) {
  let names = [];
  let values = [];

  for (const [name, value] of attrs) {
    names.push(name);
    values.push(value);
  }

  return { names, values }
}
