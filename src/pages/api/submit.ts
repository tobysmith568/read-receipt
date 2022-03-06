import type { NextApiRequest, NextApiResponse } from "next";

export interface SubmitRequest {}

export interface SubmitResponse {
  success: boolean;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<SubmitResponse>) {
  res.status(200).json({ success: true });
}
