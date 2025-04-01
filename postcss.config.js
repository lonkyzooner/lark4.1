import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';

export default {
  plugins: [
    postcssImport,
    // Skip nesting plugin, use the one from postcss-preset-env
    tailwindcss,
    autoprefixer,
    postcssPresetEnv({
      features: { "nesting-rules": true }, // Enable nesting here instead
      stage: 1,
      preserve: false,
      browsers: ["> 1%", "last 2 versions", "Firefox ESR", "not dead"],
    }),
  ],
}

