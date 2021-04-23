import { Router } from "express";
import { singleton } from "tsyringe";

@singleton()
export class ExpressService {
  public createRouter(): Router {
    return Router();
  }
}
