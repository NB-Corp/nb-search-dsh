import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { transform } from 'lightningcss'

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
if (process.argv[2] === 'host') {
  await build({ entryPoints: ['src/index.ts'], outfile: 'lib/index.js', bundle: true, packages: 'external', format: 'esm', platform: 'node', target: 'node24' })
} else if (process.argv[2] === 'client') {
  await build({
    entryPoints: ['src/client/index.ts'], outfile: 'lib/client.js', bundle: true,
    format: 'cjs', platform: 'browser', target: 'es2023', sourcemap: true,
    external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis', '@deepseek-ai/dsh-client-runtime/client', '@deepseek-ai/dsh-client-ui-primitives', '@deepseek-ai/dsh-client-ui-slots'],
    plugins: [{ name: 'dsh-client-purity', setup(builder) {
      const allowed = new Set(['@deepseek-ai/cordis', '@deepseek-ai/dsh-client-runtime/client', '@deepseek-ai/dsh-client-ui-primitives', '@deepseek-ai/dsh-client-ui-slots'])
      builder.onResolve({ filter: /^@deepseek-ai\// }, ({ path }) => {
        if (allowed.has(path)) return { path, external: true }
        if (/^@deepseek-ai\/(cosmokit|schemastery)(\/|$)/.test(path) || /^@deepseek-ai\/dsh-(host-apiproxy|file-reference|session|llm|tools|brand)(\/|$)/.test(path) || /\/remote$/.test(path)) return undefined
        return { errors: [{ text: `Cross-plugin value import is not in the DSH client module table: ${path}` }] }
      })
    } }, { name: 'dsh-inline-css-modules', setup(builder) {
      builder.onLoad({ filter: /\.module\.css$/ }, async ({ path }) => {
        const { code, exports } = transform({ filename: path, code: await readFile(path), cssModules: { pattern: '[hash]_[local]' }, minify: true })
        const classes = Object.fromEntries(Object.entries(exports ?? {}).map(([key, value]) => [key, value.name]))
        const tagId = `${manifest.name}/${path.split(/[\\/]/).at(-1)}`
        return { loader: 'js', contents: `
          const id = ${JSON.stringify(tagId)};
          if (typeof document !== 'undefined' && !document.querySelector('style[data-plugin-css=' + JSON.stringify(id) + ']')) {
            const tag = document.createElement('style');
            tag.dataset.plugin = ${JSON.stringify(manifest.name)};
            tag.dataset.pluginCss = id;
            tag.textContent = ${JSON.stringify(code.toString())};
            document.head.appendChild(tag);
          }
          export default ${JSON.stringify(classes)};
        `, watchFiles: [path] }
      })
    } }],
    define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.MODE': '"production"', 'import.meta.env': '{"MODE":"production"}' },
    banner: { js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(manifest.name)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;` },
    footer: { js: 'return module.exports; } });' },
  })
} else throw new Error('Specify host or client build face')
