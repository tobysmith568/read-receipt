import LinkButton from "../link-button";
import { useFormData, useResetForm } from "./use-form-state";

const Sent = () => {
  const resetForm = useResetForm();
  const { email } = useFormData();

  return (
    <form onSubmit={resetForm}>
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
