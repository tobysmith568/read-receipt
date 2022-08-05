import { defineConfig } from "cypress";

export default defineConfig({
  viewportWidth: 1080,
  viewportHeight: 1080,
  downloadsFolder: "e2e/downloads",
  fixturesFolder: "e2e/fixtures",
  screenshotsFolder: "e2e/screenshots",
  videosFolder: "e2e/videos",
  defaultCommandTimeout: 6000,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require("./e2e/plugins")(on, config);
    },
    baseUrl: "http://localhost:3000/",
    specPattern: "e2e/integration/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "e2e/support/index.js"
  }
});
