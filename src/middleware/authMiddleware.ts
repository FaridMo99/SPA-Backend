import { signupSchema, loginSchema } from "../schemas/schemas";
import { NextFunction, Response, Request } from "express";

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const validation = loginSchema.safeParse(req.body);
  if (validation.success) {
    return next();
  }
  return res.status(400).json({ message: "Invalid Input" });
}

export function validateSignup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const validation = signupSchema.safeParse(req.body);
  if (validation.success) {
    return next();
  }
  return res.status(400).json({ message: "Invalid Input" });
}

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {}
export function isAuthorized(req: Request, res: Response, next: NextFunction) {}
