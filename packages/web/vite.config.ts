import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      "@react-slip-and-slide/models/*": resolve(__dirname, "../models/src/*"),
      "@react-slip-and-slide/utils/*  ": resolve(__dirname, "../utils/src/*"),
    },
  },
  build: {
    target: "modules",
    minify: "esbuild",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ReactSlipAndSlide",
      formats: ["es", "umd"],
      fileName: (format) => `react-slip-and-slide.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "styled-components", "lodash", "react-spring", "@use-gesture/react"],
      output: {
        globals: {
          react: "React",
          "styled-components": "styled",
          "react-spring": "animated",
          lodash: "_",
          "@use-gesture/react": "useDrag",
        },
      },
    },
  },
});
