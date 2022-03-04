import { HttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { ENVIRONMENT } from "./injection-tokens";
import { IEnvironment } from "src/environments/environment.interface";
import { FormsModule } from "@angular/forms";

jest.mock("@angular/common/http");

const mockEnvironment: IEnvironment = {
  production: false,
  sendEmailEndpoint: "http://localhost:3000/send-email-endpoint"
};

describe("AppComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [FormsModule],
      providers: [
        { provide: HttpClient, useClass: HttpClient },
        { provide: ENVIRONMENT, useValue: mockEnvironment }
      ]
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);

    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });
});
