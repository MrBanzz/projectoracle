/** @type {import('jest').Config} */
const path = require("node:path");

module.exports = {
  testEnvironment: "node",
  testTimeout: 60000,
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          // Mirror the project tsconfig but drop the things that
          // conflict with the Jest runtime (Next plugin, jsx, noEmit).
          target: "ES2020",
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          allowJs: false,
          skipLibCheck: true,
          strict: true,
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "react-jsx",
          baseUrl: __dirname,
          paths: {
            "@/*": ["./*"],
          },
        },
      },
    ],
  },
  // Map the @/* path alias to the project root so imports like
  // `@/lib/parse/repoUrl` resolve during the test run.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  clearMocks: true,
};
