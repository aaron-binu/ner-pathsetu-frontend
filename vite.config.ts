/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'geojson-loader',
      transform(src, id) {
        if (id.endsWith('.geojson')) {
          return {
            code: `export default ${JSON.stringify(JSON.parse(src))}`,
            map: null,
          };
        }
      },
    },
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});