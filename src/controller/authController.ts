import prisma from "../db/client";
import bcrypt from "bcrypt";
import z from "zod";
import { Request, Response, NextFunction } from "express";
import { loginSchema, signupSchema } from "../schemas/schemas";

interface SignupRequest extends Request {
  body: z.infer<typeof signupSchema>;
}

interface LoginRequest extends Request {
  body: z.infer<typeof loginSchema>;
}

export async function login(
  req: LoginRequest,
  res: Response,
  next: NextFunction
) {}

export async function signup(
  req: SignupRequest,
  res: Response,
  next: NextFunction
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
    const newUser = prisma.user.create({
      data: { username, email, birthdate, password: hashedPassword },
    });
    //create session here and login user
    return res.status(201).json({
      /*fill here */
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  //make schema and interface for it
}
