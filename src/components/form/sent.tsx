import { SyntheticEvent, useCallback } from "react";
import LinkButton from "../link-button";
import { useFormData, useResetForm } from "./use-form-state";

const Sent = () => {
  const resetForm = useResetForm();
  const { email } = useFormData();

  const onSubmit = useCallback(
    (event?: SyntheticEvent) => {
      event?.preventDefault();
      resetForm();
    },
    [resetForm]
  );

  return (
    <form onSubmit={onSubmit}>
      <div>Successfully sent to {email}!</div>
      <div>
        <LinkButton type="submit" ref={focusRef}>
          Send another
        </LinkButton>
      </div>
    </form>
  );
};
export default Sent;

const focusRef = (ref: HTMLElement | null) => ref?.focus();
