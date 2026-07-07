import { type SyntheticEvent, useCallback } from "react";
import LinkButton from "../link-button";
import { useResetForm } from "./use-form-state";

const ErrorState = () => {
  const resetForm = useResetForm();

  const onSubmit = useCallback(
    (event: SyntheticEvent) => {
      event.preventDefault();
      resetForm();
    },
    [resetForm]
  );

  return (
    <form onSubmit={onSubmit}>
      <div>Sorry, there was an error!</div>
      <div>
        <LinkButton type="submit" ref={focusRef}>
          Try again
        </LinkButton>
      </div>
    </form>
  );
};
export default ErrorState;

const focusRef = (ref: HTMLElement | null) => ref?.focus();
