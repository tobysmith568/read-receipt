// Patch the jest-environment-jsdom with the nodejs TextEncoder
import Environment from "jest-environment-jsdom";

export default class CustomTestEnvironment extends Environment {
  async setup() {
    if (typeof this.global.TextEncoder === "undefined") {
      const { TextEncoder } = require("util");
      this.global.TextEncoder = TextEncoder;
    }
    if (typeof this.global.Request === "undefined") {
      this.global.Request = Request;
      this.global.Response = Response;
      this.global.Headers = Headers;
      this.global.fetch = fetch;
    }
    await super.setup();
  }
}
