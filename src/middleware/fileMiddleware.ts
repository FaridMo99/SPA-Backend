import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types/types.js";
import { serverImageSchema } from "../schemas/schemas.js";

export function validateFile(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const file = req.file;
  if (!file) return next();

  const result = serverImageSchema.safeParse(file);
  if (!result.success) {
    //clear memory if it fails
    delete req.file?.buffer;
    delete req.file;
    return res.status(400).json({ message: result.error.message });
  }
  next();
}
