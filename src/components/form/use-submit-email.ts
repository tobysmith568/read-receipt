import axios from "axios";
import { useCallback, useState } from "react";
import { SubmitResponse } from "../../pages/api/submit";

type UseSubmitEmail = () => [(email: string) => Promise<SubmitResponse>, boolean];

export const useSubmitEmail: UseSubmitEmail = () => {
  const [isLoading, setIsLoading] = useState(false);

  const submit = useCallback(async (email: string) => {
    const res = await axios.post<SubmitResponse>("/api/submit", { email });
    setIsLoading(false);

    if (res.status !== 200) {
      throw new Error("Failed to submit email");
    }

    return res.data;
  }, []);

  return [submit, isLoading];
};
