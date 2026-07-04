declare module "smtp-tester" {
  interface CapturedEmail {
    html: string;
    headers: {
      to: string;
      subject: string;
    };
  }

  interface MailServer {
    bind(handler: (addr: string | null, id: string, email: CapturedEmail) => void): void;
    stop(callback?: () => void): void;
  }

  export function init(port: number): MailServer;
}
