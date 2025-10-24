import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types/types.js";
import path from "path";
import fs from "fs";

export async function getSingleFileByFileName(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const filename = req.params.filename;
    const fullPath = path.resolve("src", "uploads", filename);
    if (!fullPath || !fs.existsSync(fullPath))
      return res.status(404).json({ message: "File not found" });
    return res.sendFile(fullPath);
  } catch (err) {
    next(err);
  }
}
