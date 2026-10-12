import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
const site = process.env.PUBLIC_SITE_URL;
if (!site || !/^https:\/\//.test(site)) throw new Error('Set PUBLIC_SITE_URL to the canonical HTTPS deployment URL in CI.');
export default defineConfig({ site, output: 'static', integrations: [react(), tailwind()] });
