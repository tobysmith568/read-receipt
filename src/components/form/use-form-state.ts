import { atom, useAtom } from "jotai";
import { useUpdateAtom } from "jotai/utils";
import { useCallback } from "react";

type Status = "form" | "sending" | "sent" | "error";

const formStateAtom = atom<Status>("form");
const formEmailAtom = atom<string>("");

export const useFormState = () => {
  const [formState] = useAtom(formStateAtom);
  return formState;
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
