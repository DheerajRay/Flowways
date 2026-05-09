import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      "src/app.js",
      "src/domain.js",
      "scripts/*.js",
      "tests/domain.test.js",
      ".next/**",
      "node_modules/**"
    ]
  },
  {
    files: ["app/**/*.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off"
    }
  }
];

export default config;
