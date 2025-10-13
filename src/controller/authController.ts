import prisma from "../db/client";
import bcrypt from "bcrypt";
import z from "zod";
import { Request, Response, NextFunction } from "express";
import { loginSchema, signupSchema } from "../schemas/schemas";
import { Session } from "express-session";
import passport from "../lib/passportConfig";
import { User } from "../generated/prisma";
import { AuthenticatedRequest } from "../types/types";
import chalk from "chalk";
import { createSafeUser, UserWithFollowCount } from "./userController";

interface SignupRequest extends Request {
  body: z.infer<typeof signupSchema>;
}

interface LoginRequest extends Request {
  body: z.infer<typeof loginSchema>;
}

interface LogoutRequest extends Request {
  session: Session;
}

export async function login(
  req: LoginRequest,
  res: Response,
  next: NextFunction,
) {
  console.log("hit login endpoint", req.body)
  passport.authenticate("local", (err: Error, user:UserWithFollowCount, info: any) => {
    if (err) return next(err);
        if (!user) {
          console.log(info.message);
          return res
            .status(401)
            .json({ message: info.message });
        }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      //fix so it sends correct user type
      return res.status(200).json(createSafeUser(user));
    });
  })(req, res, next);
}

export async function signup(
  req: SignupRequest,
  res: Response,
  next: NextFunction,
) {
  console.log(chalk.blue(`Hit signup endpoint: ${req.body}`))
  const { username, password, birthdate, email } = req.body;
  const formattedBirthDate = new Date(birthdate)
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
    console.log(chalk.bgCyan(`does user exist:${!!existingUser}`))
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or Email already taken" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        birthdate: formattedBirthDate,
        password: hashedPassword,
      },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    //create session
    req.login(newUser, (err) => {
      console.log(chalk.magenta("creating session for:" + newUser))
      if (err) {
      console.log(chalk.red("creating session for:" + newUser + "failed"));
        return next(err);
      }
      console.log(chalk.green("creating session for:" + newUser + "successful"));
      return res.status(201).json(createSafeUser(newUser));
    });
  } catch (err) {
    next(err);
  }
}

export function logout(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  console.log(chalk.yellow("User logging out..."))
  if (!req.session) {
    return res.status(400).json({ message: "User already logged out" });
  }
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie("session");
    console.log(chalk.green("User logged out successfully"))
    return res.status(200).json({ message: "Successfully logged out" });
  });
}

export async function checkUser(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction
) {
  const id = req.user?.id

    if (!id) {
      return res.status(404).json({ message: "User not found" });
    }
  try {
    const user = await prisma.user.findFirst({
      where: { id },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
    return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(createSafeUser(user));
  } catch (err) {
    next(err)
  }
}