import { startMailServer } from "./mail-server";

export default async function globalSetup() {
  await startMailServer();
}
