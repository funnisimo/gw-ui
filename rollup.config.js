// GW-CANVAS: rollup.config.js

import { terser } from "rollup-plugin-terser";
import dts from "rollup-plugin-dts";

// import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { nodeResolve } from "@rollup/plugin-node-resolve";
// import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: "js/index.js",
    external: ["gw-utils", "gw-map"],
    plugins: [nodeResolve()],
    output: [
      {
        file: "dist/gw-ui.min.js",
        format: "umd",
        name: "GWI",
        // freeze: false,
        // extend: true,
        sourcemap: true,
        globals: {
          "gw-utils": "GWU",
          "gw-map": "GWM",
        },
        plugins: [terser()],
      },
      {
        file: "dist/gw-ui.js",
        format: "umd",
        name: "GWI",
        // freeze: false,
        // extend: true,
        sourcemap: true,
        globals: {
          "gw-utils": "GWU",
          "gw-map": "GWM",
        },
      },
      {
        file: "dist/gw-ui.mjs",
        format: "es",
        // freeze: false,
        globals: {
          "gw-utils": "GWU",
          "gw-map": "GWM",
        },
      },
    ],
  },
  {
    input: "./js/index.d.ts",
    output: [{ file: "dist/gw-ui.d.ts", format: "es" }],
    plugins: [dts()],
  },
];
