import { AuthenticatedUserRequest } from "../controller/postController";
import prisma from "../db/client";
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
) {
  if (!req.user || req.isUnauthenticated()) {
    return res.status(401).json({ message: "User not logged in" });
  }
  next();
}
export async function isAuthorized(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const { commentId, postId, username } = req.params;

  try {
    if (commentId) {
      const comment = await prisma.comment.findFirst({
        where: {
          id: commentId,
          userId,
        },
      });
      if (!comment) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    if (postId) {
      const post = await prisma.post.findFirst({
        where: {
          id: postId,
          userId,
        },
      });
      if (!post) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    if (username) {
      const user = await prisma.user.findFirst({
        where: {
          username,
          id: userId,
        },
      });
      if (!user) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
