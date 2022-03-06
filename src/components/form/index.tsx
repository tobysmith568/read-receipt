import styled from "@emotion/styled";
import Error from "./error";
import Form from "./form";
import Sent from "./sent";
import { Status, useFormState } from "./use-form-state";

const EmailForm = () => {
  const formState = useFormState();

  return <FormWrapper>{getFormPage(formState)}</FormWrapper>;
};
export default EmailForm;

const getFormPage = (formState: Status) => {
  switch (formState) {
    case "form":
      return <Form />;

    case "sent":
      return <Sent />;

    default:
      return <Error />;
  }
};

const FormWrapper = styled.div`
  width: 75%;
  margin: 1.5em auto 1.5em auto;

  @media (max-width: 500px) {
    &.form {
      width: 100%;
    }
  }
`;
