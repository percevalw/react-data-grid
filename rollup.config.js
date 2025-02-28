import { isAbsolute } from 'path';
import linaria from '@linaria/rollup';
import postcss from 'rollup-plugin-postcss';
import postcssNested from 'postcss-nested';
import { babel } from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';

const extensions = ['.ts', '.tsx'];

export default {
  input: './src/index.ts',
  output: [
    {
      file: './lib/bundle.js',
      format: 'es',
      preferConst: true,
      sourcemap: true
    },
    {
      file: './lib/bundle.cjs',
      format: 'cjs',
      preferConst: true,
      sourcemap: true,
      interop: false
    }
  ],
  external: (id) => !id.startsWith('.') && !id.startsWith('@linaria:') && !isAbsolute(id),
  plugins: [
    linaria({
      preprocessor: 'none',
      include: ['**/*.tsx', '**/*.ts'],
      classNameSlug(hash) {
        // We add the package version as suffix to avoid style conflicts
        // between multiple versions of RDG on the same page.
        return `${hash}${pkg.version.replaceAll('.', '')}`;
      }
    }),
    postcss({
      plugins: [postcssNested],
      minimize: true,
      inject: { insertAt: 'top' }
    }),
    babel({
      babelHelpers: 'runtime',
      extensions,
      // remove all comments except terser annotations
      // https://github.com/terser/terser#annotations
      // https://babeljs.io/docs/en/options#shouldprintcomment
      shouldPrintComment: (comment) => /^[@#]__.+__$/.test(comment)
    }),
    nodeResolve({ extensions })
  ]
};
