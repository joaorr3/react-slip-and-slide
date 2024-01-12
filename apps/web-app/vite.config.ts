import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/web-app',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [react(), nxViteTsPaths()],
  build: {
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'react',
        'react-dom/client',
        'react-dom/server',
        'react/jsx-runtime',
        'lodash',
        'react-spring',
        '@react-spring/web',
        '@react-spring/shared',
        'css-to-react-native',
        'immer',
        'rxjs',
        'lethargy-ts',
        // '@use-gesture/react',
      ],
      output: {
        paths: {
          react: 'https://esm.sh/react@18.2.0',
          'react-dom/client': 'https://esm.sh/react-dom@18.2.0/client',
          'react-dom/server': 'https://esm.sh/react-dom@18.2.0/server',
          'react/jsx-runtime': 'https://esm.sh/react@18.2.0/jsx-runtime',
          lodash: 'https://esm.sh/lodash-es@4.17.21',
          'react-spring': 'https://esm.sh/react-spring@9.7.3',
          '@react-spring/web': 'https://esm.sh/@react-spring/web@9.7.3',
          '@react-spring/shared': 'https://esm.sh/@react-spring/shared@9.7.3',
          'css-to-react-native': 'https://esm.sh/css-to-react-native@3.2.0',
          immer: 'https://esm.sh/immer@10.0.3',
          rxjs: 'https://esm.sh/rxjs@7.8.1',
          'lethargy-ts': 'https://esm.sh/lethargy-ts@0.0.5',
          // '@use-gesture/react': 'https://esm.sh/@use-gesture/react@10.3.0',
        },
      },
    },
  },
});
