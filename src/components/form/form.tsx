import styled from "@emotion/styled";
import { type ChangeEvent, type SyntheticEvent, useCallback, useMemo, useState } from "react";
import { useFormData } from "./use-form-state";
import { useSubmitEmail } from "./use-submit-email";

const Form = () => {
  const [isEmailPristine, setIsEmailPristine] = useState(true);
  const { email, setEmail } = useFormData();
  const submitEmail = useSubmitEmail();

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

  const handleOnSubmit = useCallback(
    (event: SyntheticEvent) => {
      event.preventDefault();
      submitEmail(email);
    },
    [submitEmail, email]
  );

  return (
    <form onSubmit={handleOnSubmit}>
      <EmailLabel htmlFor="email">Enter Your Email:</EmailLabel>
      <br />
      <EmailInput
        id="email"
        name="email"
        ref={focusRef}
        autoComplete="username"
        placeholder="you@website.com"
        onChange={handleEmailChange}
      />
      {!isEmailValid && (
        <Errors>
          <p>An email address is required</p>
        </Errors>
      )}
      <Submit disabled={!isEmailValid || isEmailPristine} type="submit">
        Send Email
      </Submit>
    </form>
  );
};
export default Form;

const focusRef = (ref: HTMLElement | null) => ref?.focus();

const EmailLabel = styled.label`
  display: inline-block;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 0.4em;
`;

const EmailInput = styled.input`
  width: 100%;
  margin: 0 0 0.5em 0;
  padding: 0.5rem 0.6rem;
  font-size: 1rem;
  text-align: center;
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-sm);
  background: var(--color-input-bg);
  color: var(--color-heading);
`;

const Errors = styled.div`
  color: red;
  font-size: 1rem;
`;

const Submit = styled.button`
  cursor: pointer;
  width: 100%;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: #fff;
  margin: 0;
  padding: 0.55rem;
  font-size: 1rem;
  font-weight: 600;

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
`;
