import chalk from "chalk";
import { AuthenticatedUserRequest } from "../controller/postController.js";
import prisma from "../db/client.js";
import {
  signupSchema,
  loginSchema,
  editUserSchema,
} from "../schemas/schemas.js";
import { NextFunction, Response, Request } from "express";

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  console.log(
    chalk.yellow(`Validating Login with Schema: ${Object.values(req.body)}`),
  );
  const validation = loginSchema.safeParse(req.body);
  if (validation.success) {
    console.log(chalk.green("Login Validation was successful"));
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
  console.log(
    chalk.yellow(`Validating Signup with Schema: ${Object.values(req.body)}`),
  );
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
  console.log(req.user);
  if (!req.user || req.isUnauthenticated()) {
    console.log(chalk.red("User not logged in"));
    return res.status(401).json({ message: "User not logged in" });
  }

  if (!req.user.verified)
    return res.status(400).json({ message: "User is not verified yet" });
  next();
}

export async function isAuthorized(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const { commentId, postId, username, chatId, messageId } = req.params;

  console.log(chalk.yellow("Checking if user is authorized..."));

  try {
    if (commentId && postId) {
      //comment actions
      const comment = await prisma.comment.findFirst({
        where: { id: commentId, userId },
      });
      if (!comment) {
        console.log(chalk.red("User not authorized to modify comment"));
        return res.status(403).json({ message: "Forbidden" });
      }
    } else if (postId) {
      // post actions
      const post = await prisma.post.findFirst({
        where: { id: postId, userId },
      });
      if (!post) {
        console.log(chalk.red("User not authorized to modify post"));
        return res.status(403).json({ message: "Forbidden" });
      }
    } else if (username) {
      //user actions
      const user = await prisma.user.findFirst({
        where: { username, id: userId },
      });
      if (!user) {
        console.log(chalk.red("User not authorized to modify user"));
        return res.status(403).json({ message: "Forbidden" });
      } else if (messageId) {
        //message actions
        const message = await prisma.message.findFirst({
          where: { senderId: userId },
        });
        if (!message) {
          console.log(chalk.red("User not authorized to delete message"));
          return res.status(403).json({ message: "Forbidden" });
        }
      } else if (chatId) {
        //chat actions
        const chat = await prisma.chat.findUnique({
          where: {
            id: chatId,
            OR: [{ userOneId: userId }, { userTwoId: userId }],
          },
        });
        if (!chat) {
          console.log(
            chalk.red("User not authorized to access or modify chat"),
          );
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      //general authz without params
      else {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          console.log(chalk.red("User not authorized"));
          return res.status(403).json({ message: "Forbidden" });
        }
      }
    }

    console.log(chalk.green("User is authorized"));
    return next();
  } catch (err) {
    console.error(chalk.red("Authorization error:"), err);
    return next(err);
  }
}

export function validateEdit(
  req: AuthenticatedUserRequest<{ username?: string; bio?: string }>,
  res: Response,
  next: NextFunction,
) {
  console.log(
    chalk.yellow(`Validating Edit with Schema: ${Object.values(req.body)}`),
  );
  const { username, bio } = req.body;
  const file = req.file;
  const validation = editUserSchema.safeParse({
    username,
    bio,
    profilePicture: file,
  });
  if (validation.success) {
    console.log(chalk.green("Edit Validation was successful"));
    return next();
  }
  console.log(chalk.red("Edit Validation failed"));
  return res.status(400).json({ message: "Invalid Input" });
}
