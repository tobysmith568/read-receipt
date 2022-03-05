import Error from "./error";
import Form from "./form";
import Sending from "./sending";
import Sent from "./sent";
import { useFormState } from "./use-form-state";

const EmailForm = () => {
  const formState = useFormState();

  switch (formState) {
    case "form":
      return <Form />;

    case "sending":
      return <Sending />;

    case "sent":
      return <Sent />;

    default:
      return <Error />;
  }
};

export default EmailForm;
