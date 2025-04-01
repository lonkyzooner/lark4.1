module.exports = {
  plugins: [
    require('postcss-import'),
    // Skip nesting plugin, use the one from postcss-preset-env
    require('tailwindcss'),
    require('autoprefixer'),
    require('postcss-preset-env')({
      features: { "nesting-rules": true }, // Enable nesting here instead
      stage: 1,
      preserve: false,
      browsers: ["> 1%", "last 2 versions", "Firefox ESR", "not dead"],
    }),
  ],
}
