import { config } from "dotenv";
import { singleton } from "tsyringe";

config();

interface IConfig {
  email: {
    host: string;
    port: number;
    sender: string;
    user: string;
    pass: string;
  };
  dev: {
    ip?: string;
  };
}

@singleton()
export class EnvironmentService {
  private _config: IConfig;

  public get config(): IConfig {
    return this._config;
  }

  constructor() {
    this._config = {
      email: {
        host: process.env.EMAIL_HOST ?? "",
        port: this.parseNumber(process.env.EMAIL_PORT, 465),
        sender: process.env.EMAIL_SENDER ?? "",
        user: process.env.EMAIL_USER ?? "",
        pass: process.env.EMAIL_PASS ?? ""
      },
      dev: {
        ip: process.env.DEV_IP ?? undefined
      }
    };
  }

  private parseNumber(value: string | undefined | null, fallback: number): number {
    const result = Number(value);

    return isNaN(result) ? fallback : result;
  }
}
