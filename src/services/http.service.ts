import { singleton } from "tsyringe";
import axios from "axios";

@singleton()
export class HttpService {
  public async get<T>(url: string): Promise<T | undefined> {
    const result = await axios.get<T>(url);

    return result.data ?? undefined;
  }
}
