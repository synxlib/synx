import { defineConfig } from "tsup";

export default defineConfig({
    entry: [
        "src/index.ts",
        "src/error/index.ts",
        "src/logic/index.ts",
        "src/math/index.ts",
        "src/object/index.ts",
        "src/pipe/index.ts",
        "src/random/index.ts",
        "src/string/index.ts",
    ],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    outDir: "dist",
});
