// @ts-check
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

import node from '@astrojs/node';

import db from '@astrojs/db';

// https://astro.build/config
export default defineConfig({
    // Enable Solid to support Solid JSX components.
    integrations: [solid(), db()],

    adapter: node({
        mode: 'standalone',
    }),
});
