import chalk from "chalk";
import { AuthenticatedUserRequest } from "../controller/postController";
import prisma from "../db/client";
import { signupSchema, loginSchema } from "../schemas/schemas";
import { NextFunction, Response, Request } from "express";

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  console.log(chalk.yellow(`Validating Login with Schema: ${Object.values(req.body)}`))
  const validation = loginSchema.safeParse(req.body);
  if (validation.success) {
    console.log(chalk.green("Login Validation was successful"))
    return next();
  }
  console.log(chalk.red("Login Validation failed"));
  return res.status(400).json({ message: "Invalid Input" });
}

export function validateSignup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(chalk.yellow(`Validating Signup with Schema: ${Object.values(req.body)}`));
  const validation = signupSchema.safeParse(req.body);
  if (validation.success) {
    console.log(chalk.green("Signup Validation was successful"));
    return next();
  }
  console.log(chalk.red("Signup Validation failed"));
  return res.status(400).json({ message: "Invalid Input" });
}

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(chalk.yellow("checking if user logged in"));
  console.log(req.user)
  if (!req.user || req.isUnauthenticated()) {
    console.log(chalk.red("User not logged in"))
    return res.status(401).json({ message: "User not logged in" });
  }
  console.log(chalk.yellow("user is logged in"));
  next();
}

export async function isAuthorized(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const { commentId, postId, username } = req.params;

  console.log(chalk.yellow("checking if user authorized"))

  try {
    if (commentId) {
      const comment = await prisma.comment.findFirst({
        where: {
          id: commentId,
          userId,
        },
      });
      if (!comment) {
        console.log(chalk.red("User not authorized to comment"));
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
        console.log(chalk.red("User not authorized to post"));
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
        console.log(chalk.red("User not authorized"));
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    console.log(chalk.green("user is authorized"));
    return next();
  } catch (err) {
    return next(err);
  }
}
