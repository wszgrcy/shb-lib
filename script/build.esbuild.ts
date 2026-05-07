import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { sync } from 'fast-glob';
import { version, repository } from '../package.json';

// 发布之前构建
async function main() {
  let { default: macros } = await import('unplugin-macros/esbuild');

  let options: esbuild.BuildOptions = {
    platform: 'node',
    bundle: true,
    sourcemap: true,
    entryPoints: [
      ...sync('*', {
        onlyDirectories: true,
        cwd: path.join(process.cwd(), 'packages'),
      }).map((item) => {
        return {
          in: `packages/${item}/index.ts`,
          out: `${item}/index`,
        };
      }),
      {
        in: './packages/tts/define.ts',
        out: './tts/define/index',
      },
      {
        in: './packages/crunker/define/index.ts',
        out: './crunker/define/index',
      },
      {
        in: './packages/llama/define/index.ts',
        out: './llama/define/index',
      },
      {
        in: './packages/openai/define/index.ts',
        out: './openai/define/index',
      },
      {
        in: './packages/workflow/share/index.ts',
        out: './workflow/share/index',
      },
      {
        in: './packages/workflow/webview/index.ts',
        out: './workflow/webview/index',
      },
    ],
    charset: 'utf8',
    splitting: false,
    outdir: path.join(process.cwd(), '/dist'),
    format: 'esm',
    keepNames: false,
    outExtension: {
      '.js': '.mjs',
    },
    // minify: true,
    tsconfig: 'tsconfig.build.json',
    packages: 'external',
    // external: [],
    plugins: [macros()],
  };
  await esbuild.build(options);
  delete options.outExtension;
  options.format = 'cjs';
  await esbuild.build(options);
  const packages = sync('*', {
    onlyDirectories: true,
    cwd: path.join(process.cwd(), 'packages'),
  });
  const subPackageNames = packages.map((pkg) => `@shenghuabi/${pkg}`);

  for (const pkg of packages) {
    const pkgJsonPath = path.join(
      process.cwd(),
      'packages',
      pkg,
      'package.json',
    );
    const distPkgPath = path.join(process.cwd(), 'dist', pkg, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      fs.copyFileSync(pkgJsonPath, distPkgPath);
      const distPkgJson = JSON.parse(fs.readFileSync(distPkgPath, 'utf-8'));
      distPkgJson.version = version;
      distPkgJson.repository = repository;
      for (const depType of ['dependencies', 'peerDependencies']) {
        if (distPkgJson[depType]) {
          for (const subPkgName of subPackageNames) {
            if (distPkgJson[depType][subPkgName] !== undefined) {
              distPkgJson[depType][subPkgName] = version;
            }
          }
        }
      }

      fs.writeFileSync(
        distPkgPath,
        JSON.stringify(distPkgJson, null, 2) + '\n',
      );
    }
  }
}
main();
