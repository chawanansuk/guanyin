import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import site from './src/data/site.json' with { type: 'json' };

export default defineConfig({
  site: site.url,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
      i18n: undefined,
    }),
  ],
  image: { responsiveStyles: true },
  devToolbar: { enabled: false },
});
