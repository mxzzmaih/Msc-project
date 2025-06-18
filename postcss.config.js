// postcss.config.js
module.exports = {
  plugins: {
    // 1. Mantine’s preset (injects its CSS variables)
    'postcss-preset-mantine': {},

    // 2. Your breakpoint variables
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },

    // 3. Tailwind’s PostCSS plugin (new package name)
    '@tailwindcss/postcss': {},

    // 4. Autoprefixer
    'autoprefixer': {},
  },
};
