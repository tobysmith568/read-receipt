import { HttpClient } from "@angular/common/http";
import { Component, Inject } from "@angular/core";
import { IEnvironment } from "src/environments/environment.interface";
import { ENVIRONMENT } from "./injection-tokens";

type Status = "form" | "sent" | "error";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  public emailValue: string = "";
  public status: Status = "form";

  constructor(
    private readonly httpClient: HttpClient,
    @Inject(ENVIRONMENT) private readonly environment: IEnvironment
  ) {}

  public async send(): Promise<void> {
    try {
      const response = await this.httpClient
        .post(this.environment.sendEmailEndpoint, { email: this.emailValue }, { observe: "response" })
        .toPromise();

      this.status = response.ok ? "sent" : "error";
    } catch {
      this.status = "error";
    }
  }
}
