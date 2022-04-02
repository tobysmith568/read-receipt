import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { Provider } from "jotai";
import Index from "src/pages";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);

const email = "myEmail@company.com";

const non200StatusCodes = [301, 302, 400, 401, 403, 404, 500];

describe("Index", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should show a spinner when an email is submitted", async () => {
    setupPostStatusCode(200, 500);

    render(
      <Provider>
        <Index />
      </Provider>
    );

    const emailInput = await waitFor(() => screen.getByLabelText("Enter Your Email:"));
    await userEvent.type(emailInput, email);

    await userEvent.click(screen.getByText("Send Email"));

    await waitFor(() => screen.getByText("Sending"));
  });

  it("should submit the email to the api when an email is submitted", async () => {
    setupPostStatusCode(200, 500);

    render(
      <Provider>
        <Index />
      </Provider>
    );

    const emailInput = await waitFor(() => screen.getByLabelText("Enter Your Email:"));
    await userEvent.type(emailInput, email);

    await userEvent.click(screen.getByText("Send Email"));

    await waitFor(() => screen.getByText("Sending"));
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/submit", { email });
  });

  it("should show a success message if the server responds with a 200", async () => {
    setupPostStatusCode(200);

    render(
      <Provider>
        <Index />
      </Provider>
    );

    const emailInput = await waitFor(() => screen.getByLabelText("Enter Your Email:"));
    await userEvent.type(emailInput, email);

    await userEvent.click(screen.getByText("Send Email"));

    await waitFor(() => screen.getByText(`Successfully sent to ${email}!`));
  });

  non200StatusCodes.forEach(status =>
    it(`should show an error message if the server does not respond with a 200 (${status})`, async () => {
      setupPostStatusCode(status);

      render(
        <Provider>
          <Index />
        </Provider>
      );

      const emailInput = await waitFor(() => screen.getByLabelText("Enter Your Email:"));
      await userEvent.type(emailInput, email);

      await userEvent.click(screen.getByText("Send Email"));

      await waitFor(() => screen.getByText("Sorry, there was an error!"));
    })
  );

  it("should re-show the original form when 'Send another' is clicked", async () => {
    setupPostStatusCode(200);

    render(
      <Provider>
        <Index />
      </Provider>
    );

    const emailInput = await waitFor(() => screen.getByLabelText("Enter Your Email:"));
    await userEvent.type(emailInput, email);

    await userEvent.click(screen.getByText("Send Email"));

    await waitFor(() => screen.getByText(`Successfully sent to ${email}!`));

    const sendAnotherButton = await waitFor(() => screen.getByText("Send another"));
    await userEvent.click(sendAnotherButton);

    await waitFor(() => screen.getByLabelText("Enter Your Email:"));
  });

  it("should re-show the original form when 'Try again' is clicked", async () => {
    setupPostStatusCode(500);

    render(
      <Provider>
        <Index />
      </Provider>
    );

    const emailInput = await waitFor(() => screen.getByLabelText("Enter Your Email:"));
    await userEvent.type(emailInput, email);

    await userEvent.click(screen.getByText("Send Email"));

    await waitFor(() => screen.getByText("Sorry, there was an error!"));

    const sendAnotherButton = await waitFor(() => screen.getByText("Try again"));
    await userEvent.click(sendAnotherButton);

    await waitFor(() => screen.getByLabelText("Enter Your Email:"));
  });

  it("should show a form validation message if the email input is emptied", async () => {
    render(
      <Provider>
        <Index />
      </Provider>
    );

    const emailInput = await waitFor(() => screen.getByLabelText("Enter Your Email:"));
    await userEvent.type(emailInput, email);

    await userEvent.clear(emailInput);

    await waitFor(() => screen.getByText("An email address is required"));
  });
});

const setupPostStatusCode = (status: number, requestDuration: number = 0) => {
  mockedAxios.post = jest.fn().mockReturnValue(
    new Promise(resolve => {
      setTimeout(() => {
        resolve({ status, data: undefined });
      }, requestDuration);
    })
  );
};
