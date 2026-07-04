/** @type {import('jest').Config} */
module.exports = {
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "<rootDir>/jest.env.js",
  snapshotSerializers: ["jest-serializer-html"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/", "/dist/"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { jsc: { transform: { react: { runtime: "automatic" } } } }]
  }
};
