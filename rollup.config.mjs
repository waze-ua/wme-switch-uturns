import fs from 'fs'
import typescript from '@rollup/plugin-typescript'
import postcss from 'rollup-plugin-postcss'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
const banner = fs.readFileSync('./src/meta.ts', 'utf8')
  .replace('{{version}}', pkg.version)

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/wme-switch-uturns.user.js',
    format: 'iife',
    banner,
  },
  plugins: [
    postcss({ inject: false }),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
}
