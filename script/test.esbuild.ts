import * as esbuild from 'esbuild';
import * as path from 'path';
import * as glob from 'fast-glob';
import { sync } from 'fast-glob';

async function main() {
  let { default: macros } = await import('unplugin-macros/esbuild');

  const packages = sync('*', {
    onlyDirectories: true,
    cwd: path.join(process.cwd(), 'packages'),
  });
  const aliases: Record<string, string> = {};
  aliases[`@shenghuabi/crunker/define`] = path.join(
    process.cwd(),
    `packages/crunker/define/index.ts`,
  );
  for (const pkg of packages) {
    aliases[`@shenghuabi/${pkg}`] = path.join(
      process.cwd(),
      `packages/${pkg}/index.ts`,
    );
  }

  let options: esbuild.BuildOptions = {
    platform: 'node',
    sourcemap: 'linked',
    bundle: true,
    entryPoints: [
      ...packages.flatMap((pkg) =>
        sync(`./packages/${pkg}/test/*.spec.ts`, {}),
      ),
      {
        in: './packages/tts/define.ts',
        out: './define/index',
      },
      {
        in: './packages/llama/define/index.ts',
        out: './packages/llama/define',
      },
    ],
    splitting: true,
    outdir: path.join(process.cwd(), './test-dist'),
    outExtension: {
      '.js': '.mjs',
    },
    format: 'esm',
    // minify: true,
    tsconfig: 'tsconfig.spec.json',
    charset: 'utf8',
    packages: 'external',
    alias: aliases,
    inject: [path.join(__dirname, './cjs-shim.ts')],
    plugins: [macros()],
  };
  await esbuild.build(options);
}
main();
