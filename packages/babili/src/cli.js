const yargsParser = require("yargs-parser");
const optionsParser = require("./options-parser");
const { processFiles } = require("./fs");

const plugins = [
  "booleans",
  "builtIns",
  "consecutiveAdds",
  "deadcode",
  "evaluate",
  "flipComparisons",
  "guards",
  "infinity",
  "mangle",
  "memberExpressions",
  "mergeVars",
  "numericLiterals",
  "propertyLiterals",
  "regexpConstructors",
  "removeConsole",
  "removeDebugger",
  "removeUndefined",
  "replace",
  "simplify",
  "simplifyComparisons",
  "typeConstructors",
  "undefinedToVoid"
];

const proxies = ["keepFnName", "keepClassName"];

const dceBooleanOpts = [
  "deadcode.keepFnName",
  "deadcode.keepFnArgs",
  "deadcode.keepClassName"
];

const mangleBooleanOpts = [
  "mangle.eval",
  "mangle.keepFnName",
  "mangle.topLevel",
  "mangle.keepClassName"
];

const mangleArrayOpts = ["mangle.blacklist"];

const typeConsOpts = [
  "typeConstructors.array",
  "typeConstructors.boolean",
  "typeConstructors.number",
  "typeConstructors.object",
  "typeConstructors.string"
];

const cliBooleanOpts = ["stdin", "help", "version"];
const cliOpts = ["out-file", "out-dir"];
const alias = {
  outFile: "o",
  outDir: "d"
};

function aliasArr(obj) {
  const r = Object.keys(obj).reduce((acc, val) => {
    return acc.concat(val, obj[val]);
  }, []);
  return r;
}

function printHelpInfo() {
  process.stdout.write(
    `Usage: babili index.js [options]

  Options:
    --mangle    Context and scope aware variable renaming

    --simplify  Simplifies code for minification by reducing statements into
                expressions and making expressions uniform where possible

  `
  );
}

function validate(opts) {
  const allOpts = [
    ...plugins,
    ...proxies,
    ...dceBooleanOpts,
    ...mangleBooleanOpts,
    ...typeConsOpts,
    ...mangleArrayOpts,
    ...cliBooleanOpts,
    ...cliOpts,
    ...aliasArr(alias)
  ];

  return Object.keys(opts).filter(
    opt => opt !== "_" && allOpts.indexOf(opt) === -1
  );
}

function run(args) {
  const presetOpts = [...plugins, ...proxies];

  const booleanOpts = [
    ...presetOpts,
    ...dceBooleanOpts,
    ...mangleBooleanOpts,
    ...typeConsOpts,
    ...cliBooleanOpts
  ];

  const booleanDefaults = booleanOpts.reduce(
    (acc, cur) =>
      Object.assign(acc, {
        [cur]: void 0
      }),
    {}
  );

  const arrayOpts = [...mangleArrayOpts];

  const arrayDefaults = arrayOpts.reduce(
    (acc, cur) =>
      Object.assign(acc, {
        [cur]: []
      }),
    {}
  );

  const argv = yargsParser(args, {
    boolean: booleanOpts,
    array: mangleArrayOpts,
    default: Object.assign({}, arrayDefaults, booleanDefaults),
    alias,
    configuration: {
      "dot-notation": false
    }
  });

  const files = argv["_"];
  const stdin = argv["stdin"];
  const errors = [];

  if (argv.help) {
    printHelpInfo();
    return;
  }

  if (files.length === 0 && !stdin) {
    errors.push("Provide filenames/dir or pass --stdin as option");
  }

  if (argv.outFile && argv.outDir) {
    errors.push("Cannot have out-file and out-dir");
  }

  const inputOpts = Object.keys(argv)
    .filter(key => {
      if (Array.isArray(argv[key])) {
        return argv[key].length > 0;
      }
      return argv[key] !== void 0;
    })
    .reduce((acc, cur) => Object.assign(acc, { [cur]: argv[cur] }), {});

  const invalidOpts = validate(inputOpts);

  if (invalidOpts.length > 0) {
    errors.push("Invalid Options passed: " + invalidOpts.join(","));
  }

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(0);
  }

  const options = optionsParser(inputOpts);

  // delete unncessary options to babili preset
  delete options["_"];
  delete options.d;
  delete options["out-dir"];
  delete options.o;
  delete options["out-file"];

  processFiles(files, options);
}

run(process.argv.slice(2));