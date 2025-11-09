#!/usr/bin/env node

/**
 * Temporary wrapper around the Tamagui CLI to work around Node 22's
 * stricter ESM resolution requirements. The upstream CLI currently
 * performs `import("./build")`, which fails without an explicit file
 * extension. We bypass that by importing the compiled CommonJS bundle
 * directly.
 */

const processArgs = () => {
  const args = process.argv.slice(2);
  const flags = new Map();
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      flags.set(arg, next);
      index += 1;
    } else {
      flags.set(arg, true);
    }
  }

  return { positional, flags };
};

const main = async () => {
  const { positional, flags } = processArgs();

  const { default: cliUtils } = await import("@tamagui/cli/dist/utils.cjs");
  const { default: buildModule } = await import("@tamagui/cli/dist/build.cjs");

  const debugFlag = Boolean(flags.get("--debug"));
  const verboseFlag = Boolean(flags.get("--verbose"));
  const debug = debugFlag ? (verboseFlag ? "verbose" : true) : false;

  const options = await cliUtils.getOptions({ debug });

  await buildModule.build({
    ...options,
    dir: positional[1],
    include: flags.get("--include"),
    target: (flags.get("--target") ?? "web"),
    exclude: flags.get("--exclude"),
  });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

