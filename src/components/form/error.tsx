import { useResetForm } from "./use-form-state";

const Error = () => {
  const resetForm = useResetForm();

  return (
    <div>
      Sorry, there was an error!
      <div>
        <a onClick={resetForm}>Try again</a>
      </div>
    </div>
  );
};

export default Error;
