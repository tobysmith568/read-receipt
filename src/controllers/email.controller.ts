import { Request, Router, Response } from "express";
import { ExpressService } from "src/services/express.service";
import { singleton } from "tsyringe";
import { IController } from "./controller.interface";

@singleton()
export class EmailController implements IController {
  constructor(private readonly expressService: ExpressService) {}

  public getRouter(): Router {
    const router = this.expressService.createRouter();

    router.post("/", (req, res) => this.post(req, res));

    return router;
  }

  private async post(req: Request, res: Response): Promise<void> {
    res.json({ sentTo: req.body.email });
  }
}
