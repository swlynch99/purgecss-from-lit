import { expect, test } from 'vitest';
import { createHash } from 'crypto';

import purgeFromLit from '../src/index';
import { placeholder } from '../src/placeholder';

const plugin = purgeFromLit();

test('lit property template value', () => {
    expect(plugin('html`<div class=${thang}></div>`'))
        .toMatchSnapshot()
})

test('template with attribute', () => {
    expect(plugin('html`<div class="blah" disabled data-tooltip=${tooltip}></div>`'))
        .toMatchSnapshot()
})

test('template within a template', () => {
    const result = plugin(`
        html\`
            <div class="outer" data-tooltip=\${tooltip}>
                \${html\`<span class=\${debug}>inner span</span>\`}
            </div>
        \`
    `);

    expect(result.classes).includes("outer");
    expect(result.classes).includes(placeholder);
    expect(result.attributes.names).includes("data-tooltip");
})

test('template boolean attribute', () => {
    const result = plugin(`
        html\`<span ?hidden=\${value}></span>\`
    `);

    expect(result.attributes.names).to.deep.equal(['hidden']);
    expect(result.attributes.values).to.deep.equal(['']);
})

test('template with property attribute', () => {
    const result = plugin(`
        html\`<span .value=\${value}></span>\`
    `)

    expect(result.attributes.names).to.be.empty;
    expect(result.attributes.values).to.be.empty;
})

test('template with an event listener', () => {
    const result = plugin(`
        html\`
            <button @click=\${event => event.preventDefault()}>
                Click Here
            </button>
        \`
    `)

    expect(result.attributes.names).to.be.empty
    expect(result.attributes.values).to.be.empty
})

test('template with HTML comment', () => {
    const result = plugin(`
        html\`
            <!-- A comment with an inner <div class=\${expression}> -->
        \`
    `)

    expect(result.attributes.names).to.be.empty
})

test('custom element types shows up as a potential class', () => {
    const result = plugin(`
        html\`<div \${prop}="thonk"></div>\`
    `)

    expect(result.classes).to.contain("thonk")
})

test('multiple HTML elements', () => {
    const result = plugin(`
        const prop = inline\`class\`;
        function doTheThink(event: Thonk) {}
    
        function thingy() {
            return html\`
                <div class="main">
                    <button @click=\${doTheThink}>Do the think!</button>
                    <custom-component .prop="5" \${prop}="thonk"></custom-component>
                </div>
            \`
        }
    `)

    expect(result).toMatchSnapshot()
})

test('HTML outside of a literal is not included', () => {
    const result = plugin(`
        const a = "<div class=\\"main\\"></div>";
        const b = inline\`<a href=\${a}>lonk</a>\`;
    `)

    expect(result.classes).to.be.empty
    expect(result.ids).to.be.empty
    expect(result.tags).to.be.empty
})
