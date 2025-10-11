import { NextFunction, Response } from "express";
import prisma from "../db/client";
import { AuthenticatedUserRequest } from "./postController";
import { User } from "../generated/prisma";

type safeUser = Omit<
  User,
  "password" | "email" | "birthdate" | "createdAt" | "id"
>;

function createSafeUser(user: User): safeUser {
  const { password, id, email, birthdate, createdAt, ...safeUser } = user;
  return safeUser;
}

export async function getUserByUsername(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction,
) {
  const username = req.params.username;
  try {
    const user = await prisma.user.findFirst({
      where: { username },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(createSafeUser(user));
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
    const userId = req.user.id;
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });
    return res.status(200).json(createSafeUser(deletedUser));
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: AuthenticatedUserRequest<Partial<User>>,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user.id;
    const fieldsToUpdate = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { ...fieldsToUpdate },
    });
    return res.status(200).json(createSafeUser(updatedUser));
  } catch (err) {
    next(err);
  }
}
