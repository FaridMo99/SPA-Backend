import { NextFunction, Response } from "express";
import prisma from "../db/client";
import { AuthenticatedUserRequest } from "./postController";

export async function getAllUser(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction,
) {
  try {
  } catch (err) {
    next(err);
  }
}

export async function getUserById(
  req: AuthenticatedUserRequest<string>,
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
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction,
) {
  try {
    const username = req.params.username;
    const userId = req.user.id;
    const user = await prisma.user.findFirst({
      where: {
        username,
        id: userId,
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });
    return res.status(200).json(deletedUser);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction,
) {
  try {
    const username = req.params.username;
    const userId = req.user.id;
    const user = await prisma.user.findFirst({
      where: {
        username,
        id: userId,
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
      const updatedUser = await prisma.user.update(
          {
              where: { id: userId },
              data: {
                  //logic for optional fields that get updated
              }
        }
    )
    return res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
}
