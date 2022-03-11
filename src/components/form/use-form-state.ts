import { atom, useAtom } from "jotai";
import { useUpdateAtom } from "jotai/utils";
import { useCallback } from "react";

export type Status = "form" | "sending" | "sent" | "error";

const formStateAtom = atom<Status>("form");
const formEmailAtom = atom<string>("");

export const useFormState = () => {
  const [formState] = useAtom(formStateAtom);
  return formState;
};

export const useSetFormState = () => {
  const updateFormState = useUpdateAtom(formStateAtom);

  const setFormState = useCallback(
    (formState: Status) => {
      updateFormState(formState);
    },
    [updateFormState]
  );

  return setFormState;
};

export const useFormData = () => {
  const [email, setEmail] = useAtom(formEmailAtom);
  return { email, setEmail };
};

export const useResetForm = () => {
  const updateFormState = useUpdateAtom(formStateAtom);
  const updateFormEmail = useUpdateAtom(formEmailAtom);

  const resetForm = useCallback(() => {
    updateFormEmail("");
    updateFormState("form");
  }, [updateFormState, updateFormEmail]);

  return resetForm;
};
