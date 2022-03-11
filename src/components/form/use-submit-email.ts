import axios from "axios";
import { useCallback } from "react";
import { SubmitResponse } from "../../pages/api/submit";
import { useSetFormState } from "./use-form-state";

export const useSubmitEmail = () => {
  const setFormState = useSetFormState();

  const submit = useCallback(
    async (email: string) => {
      setFormState("sending");

      try {
        const res = await axios.post<SubmitResponse>("/api/submit", { email });

        if (res.status !== 200) {
          setFormState("error");
          throw new Error("Failed to submit email");
        }

        setFormState("sent");
        return res.data;
      } catch {
        setFormState("error");
      }
    },
    [setFormState]
  );

  return submit;
};
