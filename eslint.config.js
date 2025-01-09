import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  ...tseslint.config(eslint.configs.recommended, tseslint.configs.recommended),
  {
    ignores: ["*", "!src/", "src/wasm/*", "!src/wasm/wavelib.d.ts"],
  },
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn", // or "error"
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];
