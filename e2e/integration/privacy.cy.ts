export {};

describe("Privacy", () => {
  const pageTitle = "Privacy Policy";
  const indexTitle = "Read Receipt";

  it("Can be routed to from the index", () => {
    cy.visit("/");

    cy.get(`a:contains("Privacy.")`).click();

    cy.get(`h1:contains("${pageTitle}")`).should("exist");
  });

  it("Can route back to the index", () => {
    cy.visit("/privacy");

    cy.get(`a:contains("<- Home")`).click();

    cy.get(`h1:contains("${pageTitle}")`).should("not.exist");
    cy.get(`h1:contains("${indexTitle}")`).should("exist");
  });
});
