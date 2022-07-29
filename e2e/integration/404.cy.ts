export {};

describe("404", () => {
  const pageTitle = "404";
  const indexTitle = "Read Receipt";

  it("Shows for invalid urls", () => {
    cy.visit("/this-is-not-a-valid-url", { failOnStatusCode: false });

    cy.get(`h1:contains("${pageTitle}")`).should("exist");
    cy.get(`h4:contains("Not Found!")`).should("exist");
  });

  it("Can route back to the index", () => {
    cy.visit("/this-is-not-a-valid-url", { failOnStatusCode: false });

    cy.get(`a:contains("<- Home")`).click();

    cy.get(`h1:contains("${pageTitle}")`).should("not.exist");
    cy.get(`h1:contains("${indexTitle}")`).should("exist");
  });
});
