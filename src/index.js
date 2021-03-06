// @ts-nocheck
const fs = require('fs');
const path = require('path');
const { extendConfig } = require('hardhat/config');
const { HardhatPluginError } = require('hardhat/plugins');

const {
    TASK_COMPILE,
} = require('hardhat/builtin-tasks/task-names');

extendConfig(function (config, userConfig) {
    const { root, sources } = config.paths;

    config.docgen = Object.assign(
        {
            path: './docgen',
            clear: false,
            runOnCompile: false,
            only: [`^${path.relative(root, sources)}/`],
            except: [],
        },
        userConfig.docgen
    );
});

const NAME = 'soldoc';
const DESC = 'Generate NatSpec documentation automatically.';


task(NAME, DESC, async function (args, hre) {
    const config = hre.config.docgen;

    const output = {};

    const outputDirectory = path.resolve(hre.config.paths.root, config.path);

    if (!outputDirectory.startsWith(hre.config.paths.root)) {
        throw new HardhatPluginError('resolved path must be inside of project directory');
    }

    if (outputDirectory === hre.config.paths.root) {
        throw new HardhatPluginError('resolved path must not be root directory');
    }

    if (config.clear && fs.existsSync(outputDirectory)) {
        fs.rmdirSync(outputDirectory, { recursive: true });
    }

    const contractNames = await hre.artifacts.getAllFullyQualifiedNames();

    for (let contractName of contractNames) {
        if (config.only.length && !config.only.some(m => contractName.match(m))) continue;
        if (config.except.length && config.except.some(m => contractName.match(m))) continue;

        const [source, name] = contractName.split(':');

        const { abi, devdoc = {}, userdoc = {} } = (
            await hre.artifacts.getBuildInfo(contractName)
        ).output.contracts[source][name];

        const { title, author, details } = devdoc;
        const { notice } = userdoc;

        // derive external signatures from internal types

        const getSigType = function ({ type, components = [] }) {
            return type.replace('tuple', `(${components.map(getSigType).join(',')})`);
        };

        const members = abi.reduce(function (acc, el) {
            // constructor, fallback, and receive do not have names
            let name = el.name || el.type;
            let inputs = el.inputs || [];
            acc[`${name}(${inputs.map(getSigType)})`] = el;
            return acc;
        }, {});

        // associate devdoc and userdoc comments with abi elements

        Object.keys(devdoc.events || {}).forEach(function (sig) {
            Object.assign(
                members[sig] || {},
                devdoc.events[sig]
            );
        });

        Object.keys(devdoc.stateVariables || {}).forEach(function (name) {
            Object.assign(
                members[`${name}()`] || {},
                devdoc.stateVariables[name],
                { type: 'stateVariable' }
            );
        });

        Object.keys(devdoc.methods || {}).forEach(function (sig) {
            Object.assign(
                members[sig] || {},
                devdoc.methods[sig]
            );
        });

        Object.keys(userdoc.events || {}).forEach(function (sig) {
            Object.assign(
                members[sig] || {},
                userdoc.events[sig]
            );
        });

        Object.keys(userdoc.methods || {}).forEach(function (sig) {
            Object.assign(
                members[sig] || {},
                userdoc.methods[sig]
            );
        });

        const membersByType = Object.keys(members).reduce(function (acc, sig) {
            const { type } = members[sig];
            acc[type] = acc[type] || {};
            acc[type][sig] = members[sig];
            return acc;
        }, {});

        const constructor = members[Object.keys(members).find(k => k.startsWith('constructor('))];
        const { 'fallback()': fallback, 'receive()': receive } = members;

        output[contractName] = {

            source,
            name,

            title,
            author,
            details,
            notice,

            constructor,
            fallback,
            receive,

            events: membersByType.event,
            stateVariables: membersByType.stateVariable,
            methods: membersByType.function,
        };
    }
});

task(TASK_COMPILE, async function (args, hre, runSuper) {
    for (let compiler of hre.config.solidity.compilers) {
        compiler.settings.outputSelection['*']['*'].push('devdoc');
        compiler.settings.outputSelection['*']['*'].push('userdoc');
    }

    await runSuper();

    if (hre.config.docgen.runOnCompile) {
        await hre.run(NAME);
    }
});