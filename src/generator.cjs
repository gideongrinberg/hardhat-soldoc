const fs = require('fs');
const utils = require('util');
const handlebars = require('handlebars');
const template = require("./template.cjs");

function generateMarkdown(input) {
    const obj = input[Object.keys(input)[0]];
    const ctx = {
        contract: {
            name: obj.title != undefined ? obj.title : obj.name,
            src: obj.source,
            methods: []
        }
    };

    for(const _m in obj.methods) {
        const m = obj.methods[_m];
        const method = {
            name: m.name,
            stateMutability: m.stateMutability,
            payable: m.payable,
            params: []
        }

        for(const v in Object.values(obj.methods)) {
            if(v.name != undefined) {
                method.params.push({
                    name: v.name,
                    type: v.type
                })    
            }
        }

        ctx.contract.methods.push(method);
    }

    const tmpl = handlebars.compile(template);
    console.log(tmpl(ctx));
}

function getNameFromFQP(fqp) {
    const regex = /(\w+\/)+(\w+.sol):(\w+)/gm;
    return fqp.match(regex)[4];
}

module.exports = generateMarkdown;