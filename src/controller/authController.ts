import prisma from "../db/client.js";
import bcrypt from "bcrypt";
import z from "zod";
import { Request, Response, NextFunction } from "express";
import { loginSchema, signupSchema } from "../schemas/schemas.js";
import passport from "../lib/passportConfig.js";
import { AuthenticatedRequest, UserWithFollowCount } from "../types/types.js";
import chalk from "chalk";
import { createSafeUser } from "./userController.js";
import redis from "../cache/redis.js";
import { v4 } from "uuid";
import { sendVerificationEmail } from "../lib/emailService.js";

export async function login(
  req: Request<{}, {}, z.infer<typeof loginSchema>>,
  res: Response,
  next: NextFunction,
) {
  console.log("hit login endpoint", req.body);
  passport.authenticate(
    "local",
    (err: Error, user: UserWithFollowCount, info: any) => {
      if (err) return next(err);
      if (!user) {
        console.log(info.message);
        return res.status(401).json({ message: info.message });
      }
      if (!user.verified)
        return res.status(400).json({ message: "User not verified" });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        //fix so it sends correct user type
        return res.status(200).json(createSafeUser(user));
      });
    },
  )(req, res, next);
}

export async function signup(
  req: Request<{}, {}, z.infer<typeof signupSchema>>,
  res: Response,
  next: NextFunction,
) {
  console.log(chalk.blue(`Hit signup endpoint: ${req.body}`));
  const { username, password, birthdate, email } = req.body;
  const formattedBirthDate = new Date(birthdate);
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
    console.log(chalk.bgCyan(`does user exist:${!!existingUser}`));
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
    });

    //storing valid url in redis for 24 hours to verify email
    const token = v4();
    await redis.setEx(`verifyUserId:${newUser.id}`, 86400, token);

    await sendVerificationEmail(
      newUser.email,
      "verify-success",
      token,
      newUser.id,
    );

    return res.status(200).json({ message: "success" });
  } catch (err) {
    next(err);
  }
}

export function logout(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  console.log(chalk.yellow("User logging out..."));
  if (!req.session) {
    return res.status(400).json({ message: "User already logged out" });
  }
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie("session");
    console.log(chalk.green("User logged out successfully"));
    return res.status(200).json({ message: "Successfully logged out" });
  });
}

export async function checkUser(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const id = req.user?.id;

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
    next(err);
  }
}

export async function sendEmailToChangePassword(
  req: Request<{}, {}, { email: string }>,
  res: Response,
  next: NextFunction,
) {
  console.log(req.body);
  const emailAddress = req.body.email;
  if (!emailAddress) return res.status(400).json({ message: "E-Mail missing" });

  try {
    const user = await prisma.user.findFirst({
      where: { email: emailAddress },
    });

    if (!user)
      return res
        .status(404)
        .json({ message: `User with E-Mail: ${emailAddress} does not exist.` });
    const token = v4();
    await redis.setEx(`changePasswordUserId:${user.id}`, 86400, token);

    await sendVerificationEmail(
      emailAddress,
      "change-password",
      token,
      user.id,
    );

    return res.status(200).json({ message: "success" });
  } catch (err) {
    next(err);
  }
}

export async function verifyUser(
  req: Request<{}, {}, { token: string; userId: string }>,
  res: Response,
  next: NextFunction,
) {
  const { token, userId } = req.body;
  console.log(req.body);
  console.log("hit verify user");

  if (!token || !userId)
    return res.status(400).json({ message: "Invalid or expired Link" });
  try {
    const redisToken = await redis.get(`verifyUserId:${userId}`);

    if (!redisToken)
      return res.status(404).json({ message: "Invalid or expired Link" });
    if (redisToken !== token)
      return res.status(403).json({ message: "Invalid Link" });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { verified: true },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    req.login(user, (err) => {
      console.log(chalk.magenta("creating session for:" + user));
      if (err) {
        console.log(chalk.red("creating session for:" + user + "failed"));
        return next(err);
      }
      console.log(chalk.green("creating session for:" + user + "successful"));
      return res.status(201).json(createSafeUser(user));
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request<{}, {}, { token: string; userId: string; password: string }>,
  res: Response,
  next: NextFunction,
) {
  console.log("hit chnage password");
  const { token, userId, password } = req.body;
  console.log(req.body);
  console.log("hit change password");

  if (!token || !userId || !password)
    return res.status(400).json({ message: "Invalid or expired Link" });
  try {
    const redisTokenKey = `changePasswordUserId:${userId}`;
    const redisToken = await redis.get(redisTokenKey);

    if (!redisToken)
      return res.status(404).json({ message: "Invalid or expired Link" });
    if (redisToken !== token)
      return res.status(403).json({ message: "Invalid Link" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    await redis.del(redisTokenKey);

    req.login(user, (err) => {
      console.log(chalk.magenta("creating session for:" + user));
      if (err) {
        console.log(chalk.red("creating session for:" + user + "failed"));
        return next(err);
      }
      console.log(chalk.green("creating session for:" + user + "successful"));
      return res.status(201).json(createSafeUser(user));
    });
  } catch (err) {
    next(err);
  }
}
