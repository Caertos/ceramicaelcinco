/* PostCSS config con PurgeCSS para eliminar CSS no usado en build.
   Nota: Ajustar safelist si se agregan nuevas clases dinámicas.
*/
const purgecss = require('@fullhuman/postcss-purgecss');

const safelist = [
  /active$/,
  /^reveal-/,
  /^mobile-accordion/,
  /^product-/,
  /^action-btn/,
  /^nav-menu$/,
  /^nav-overlay$/,
  /^close-menu-button$/,
  /^gallery-card$/,
  /^video-thumb$/,
  /^lightbox/,
  /^message-(success|error)$/,
  /^login-error$/,
  /^mini-slide-item-admin/,
  /^slides-wrapper$/,
  /^slide-item$/
  , /^btn-(sm|lg)$/
  , /^title-line1$/
];

module.exports = {
  plugins: [
    ...(process.env.NODE_ENV === 'production'
      ? [
          purgecss({
            content: [
              './index.html',
              './src/**/*.{js,jsx,ts,tsx,html}',
            ],
            safelist,
            defaultExtractor: (content) =>
              content.match(/[^<>'"`\s]*[^<>'"`\s:]/g) || [],
          }),
        ]
      : []),
  ],
};
