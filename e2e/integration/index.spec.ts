export {};

const trackingPixelRegex =
  /<img src="https?:\/\/localhost:3000\/api\/open\/(?<encodedEmail>.*?)\/(?<timestamp>[0-9]*?)"\/>/;

describe("Index", () => {
  const userEmail = "user@tobysmith.uk";
  const encodedUserEmail = encodeURIComponent(userEmail);

  beforeEach(() => {
    cy.task("deleteAllEmails");
  });

  it("Using the form sends the first email with the correct tracking pixel URL", () => {
    const currentUnixTimestamp = Math.floor(Date.now() / 1000);

    cy.visit("/");

    cy.get("#email").type(userEmail);
    cy.get("button").click();

    cy.get(`div:contains("Successfully sent to ${userEmail}")`).should("exist");

    cy.task<string>("getLastEmail", userEmail).its("subject").should("equal", "Read Receipt");

    cy.task<string>("getLastEmail", userEmail)
      .its("html")
      .invoke("match", trackingPixelRegex)
      .its("groups.encodedEmail")
      .should("be.a", "string")
      .should("equal", encodedUserEmail);

    cy.task<string>("getLastEmail", userEmail)
      .its("html")
      .invoke("match", trackingPixelRegex)
      .its("groups.timestamp")
      .should("be.a", "string")
      .then(timestamp => Number(timestamp))
      .should("be.a", "number")
      .should("be.gte", currentUnixTimestamp)
      .should("be.lt", currentUnixTimestamp + 5);
  });

  it("Opening the first email sends the second email", () => {
    cy.visit("/");

    cy.get("#email").type(userEmail);
    cy.get("button").click();

    cy.get(`div:contains("Successfully sent to ${userEmail}")`).should("exist");

    cy.task<string>("getLastEmail", userEmail)
      .its("html")
      .then(html => {
        cy.document().invoke("write", html);

        cy.get(`p:contains("Hey 👋")`).should("exist");

        cy.wait(500);

        cy.task<string>("getLastEmail", userEmail)
          .its("subject")
          .should("equal", "You just opened your email!");
      });
  });

  it("Clicking 'Send another' re-shows the email input", () => {
    cy.visit("/");

    cy.get("#email").type(userEmail);
    cy.get("button").click();

    cy.get(`div:contains("Successfully sent to ${userEmail}")`).should("exist");

    cy.get(`button:contains("Send another")`).click();

    cy.get("#email").should("be.visible");
  });

  it("Entering an invalid email address shows the error message", () => {
    cy.visit("/");

    cy.get("#email").type("this is not an email address");
    cy.get("button").click();

    cy.get(`div:contains("Sorry, there was an error!")`).should("be.visible");
  });

  it("Clicking 'Try again' re-shows the email input", () => {
    cy.visit("/");

    cy.get("#email").type("this is not an email address");
    cy.get("button").click();

    cy.get(`button:contains("Try again")`).click();

    cy.get("#email").should("be.visible");
  });
});
