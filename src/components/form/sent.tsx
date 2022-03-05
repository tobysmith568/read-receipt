import { useFormData, useResetForm } from "./use-form-state";

const Sent = () => {
  const resetForm = useResetForm();
  const { email } = useFormData();

  return (
    <div>
      <div>Successfully sent to {email}!</div>
      <div>
        <a onClick={resetForm}>Send another</a>
      </div>
    </div>
  );
};

export default Sent;
