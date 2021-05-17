const template = `
# {{ contract.name }}

**Source:** {{ contract.src }}
**Deployed Address:** TODO

{{#if (isnt contract.ctor nil)}}

| **constructor nonpayable ()**|
| ----------- |
{{#if (isnt contract.ctor.inputs nil)}}
**Parameters:**
{{#each contract.ctor.inputs as |param|}}
\`{{ param.type }}\` **param.name** {{#if (isnt param.desc nil)}}: {{ param.desc }} {{/if}}
{{/each}}
{{/if}}
{{/if}}

{{#if (isnt contract.fallback nil)}}

| **fallback payable ()**|
| ----------- |
{{#if (isnt contract.fallback.inputs nil)}}
**Parameters:**
{{#each contract.fallback.inputs as |param|}}
\`{{ param.type }}\` **param.name** {{#if (isnt param.desc nil)}}: {{ param.desc }} {{/if}}
{{/each}}
{{/if}}
{{/if}}

## Methods
{{#each contract.methods as |method|}}
| **{{ method.name }} {{ method.stateMutability }} {{#if method.payable}}payable {{/if}} ()**|
| ----------- |
{{#if (isnt method.inputs nil)}}
**Parameters:**
{{#each method.inputs as |param|}}
\`{{ param.type }}\` **param.name** {{#if (isnt param.desc nil)}}: {{ param.desc }} {{/if}}
{{/each}}
**Returns:**
{{#if (is method.return true)}}  {{\`method.returnType\`: **method.returnValue**}} {{else}}None{{/if}}
{{/if}}
{{ method.details }}
{{/each}}
`

module.exports = template;