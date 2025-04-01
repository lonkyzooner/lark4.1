import postcssImport from 'postcss-import';
import tailwindcssNesting from 'tailwindcss/nesting/index.js';
import postcssNesting from 'postcss-nesting';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';

export default {
  plugins: [
    postcssImport,
    tailwindcssNesting(postcssNesting),
    tailwindcss,
    autoprefixer,
    postcssPresetEnv({
      features: { "nesting-rules": false },
      stage: 1,
      preserve: false,
      browsers: ["> 1%", "last 2 versions", "Firefox ESR", "not dead"],
    }),
  ],
}

