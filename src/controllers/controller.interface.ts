import { Router } from "express";

export interface IController {
  getRouter(): Router;
}
