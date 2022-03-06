import styled from "@emotion/styled";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import Sending from "./sending";
import { useFormData, useSetFormState } from "./use-form-state";
import { useSubmitEmail } from "./use-submit-email";

const Form = () => {
  const [isEmailPristine, setIsEmailPristine] = useState(true);
  const { email, setEmail } = useFormData();
  const [submitEmail, isSubmittingEmail] = useSubmitEmail();
  const setFormState = useSetFormState();

  const isEmailValid = useMemo(() => {
    if (isEmailPristine) {
      return true;
    }

    return email.length > 0;
  }, [email, isEmailPristine]);

  const handleEmailChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setIsEmailPristine(false);
      setEmail(value);
    },
    [setEmail]
  );

  const handleOnSubmit = useCallback(() => {
    submitEmail(email)
      .then(() => setFormState("sent"))
      .catch(() => setFormState("error"));
  }, [email, setFormState, submitEmail]);

  if (isSubmittingEmail) {
    return <Sending />;
  }

  return (
    <>
      <div>
        <EmailLabel htmlFor="email">Enter Your Email:</EmailLabel>
        <br />
        <EmailInput
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          onChange={handleEmailChange}
        />
      </div>
      {!isEmailValid && (
        <Errors>
          <p>An email address is required</p>
        </Errors>
      )}
      <Submit disabled={!isEmailValid || isEmailPristine} onClick={handleOnSubmit}>
        Send Email
      </Submit>
    </>
  );
};

export default Form;

const EmailLabel = styled.label`
  text-align: left;
`;

const EmailInput = styled.input`
  width: 100%;
  margin: 0.5em 0 0.5em 0;
  padding: 10px;
  font-size: 1em;
  text-align: center;
`;

const Errors = styled.div`
  color: red;
`;

const Submit = styled.button`
  cursor: pointer;
  width: 100%;
  border: none;
  background: dodgerblue;
  color: #fff;
  margin: 0;
  padding: 10px;
  font-size: 0.7em;

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
`;
