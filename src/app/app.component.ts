import { HttpClient } from "@angular/common/http";
import { Component, Inject } from "@angular/core";
import { IEnvironment } from "src/environments/environment.interface";
import { ENVIRONMENT } from "./injection-tokens";

type Status = "form" | "sending" | "sent" | "error";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  public emailValue: string = "";
  public status: Status = "form";

  public get year(): string {
    return new Date().getFullYear().toString();
  }

  constructor(
    private readonly httpClient: HttpClient,
    @Inject(ENVIRONMENT) private readonly environment: IEnvironment
  ) {}

  public async send(): Promise<void> {
    this.status = "sending";

    try {
      const httpPromise = this.httpClient
        .post(this.environment.sendEmailEndpoint, { email: this.emailValue }, { observe: "response" })
        .toPromise();

      const minDelayPromise = new Promise(resolve => setTimeout(resolve, 500));

      const [response] = await Promise.all([httpPromise, minDelayPromise]);
      this.status = response.ok ? "sent" : "error";
    } catch {
      this.status = "error";
    }
  }

  public reset(): void {
    this.emailValue = "";
    this.status = "form";
  }
}
