import { stopMailServer } from "./mail-server";

export default async function globalTeardown() {
  await stopMailServer();
}
