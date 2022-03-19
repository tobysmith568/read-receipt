import LinkButton from "../link-button";
import { useResetForm } from "./use-form-state";

const Error = () => {
  const resetForm = useResetForm();

  return (
    <form onSubmit={resetForm}>
      <div>Sorry, there was an error!</div>
      <div>
        <LinkButton type="submit" ref={focusRef}>
          Try again
        </LinkButton>
      </div>
    </form>
  );
};
export default Error;

const focusRef = (ref: HTMLElement | null) => ref?.focus();
