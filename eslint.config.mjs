import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Scripts Node em CommonJS (seed do Prisma).
    files: ["prisma/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    rules: {
      // Regra nova do React Compiler; os usos atuais são intencionais e serão revistos aos poucos.
      "react-hooks/set-state-in-effect": "warn"
    }
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"])
]);
