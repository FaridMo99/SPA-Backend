import { NextFunction, Request, Response } from "express";
import prisma from "../db/client";

export async function getAllUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
  } catch (err) {
    next(err);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const username = req.params.username;
  try {
    const user = prisma.user.findFirst({
      where: { username },
    });
    if (!username) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
  } catch (err) {
    next(err);
  }
}
