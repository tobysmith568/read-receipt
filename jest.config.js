module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/src/setup-jest.ts"],
  setupFiles: ["jest-preset-angular/global-setup"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1"
  }
};
