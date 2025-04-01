module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss/nesting/index.js')(require('postcss-nesting')),
    require('tailwindcss'),
    require('autoprefixer'),
    require('postcss-preset-env')({
      features: { "nesting-rules": false },
      stage: 1,
      preserve: false,
      browsers: ["> 1%", "last 2 versions", "Firefox ESR", "not dead"],
    }),
  ],
}
