import prisma from "../db/client";
import bcrypt from "bcrypt";
import z from "zod";
import { Request, Response, NextFunction } from "express";
import { loginSchema, signupSchema } from "../schemas/schemas";
import { Session } from "express-session";
import passport from "../lib/passportConfig";
import { User } from "../generated/prisma";
import { AuthenticatedRequest } from "../types/types";

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
  passport.authenticate("local", (err: Error, user: User, info: any) => {
    if (err) return next(err);
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      //check if i should send message or user object
      return res.status(200).json({ message: "Login successful" });
    });
  })(req, res, next);
}

export async function signup(
  req: SignupRequest,
  res: Response,
  next: NextFunction,
) {
  const { username, password, birthdate, email } = req.body;
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or Email already taken" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, email, birthdate, password: hashedPassword },
    });

    //create session
    req.login(newUser, (err) => {
      if (err) {
        return next(err);
      }
      //check if i should send message or user object
      return res.status(201).json({
        message: "Account creation and login successful",
      });
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
  if (!req.session) {
    return res.status(400).json({ message: "User already logged out" });
  }
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie("session");
    return res.status(200).json({ message: "Successfully logged out" });
  });
}
