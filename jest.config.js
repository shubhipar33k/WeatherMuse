/** @type {import('jest').Config} */
const config = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react" } }],
    },
    testMatch: ["**/src/**/__tests__/**/*.test.ts"],
};

module.exports = config;
