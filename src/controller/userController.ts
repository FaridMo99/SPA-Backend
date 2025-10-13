import { NextFunction, Response } from "express";
import prisma from "../db/client";
import { AuthenticatedUserRequest } from "./postController";
import { User } from "../generated/prisma";

export type UserWithFollowCount = User & {
  _count: {
    followers: number;
    following: number;
  };
};

export type safeUser = Omit<
  UserWithFollowCount,
  "password" | "email" | "birthdate" | "createdAt" | "id"
>;

export function createSafeUser(user: UserWithFollowCount): safeUser {
  const { password, id, email, birthdate, createdAt, ...safeUser } = user;
  return safeUser;
}

export async function getUserByUsername(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction
) {
  const username = req.params.username;
  try {
    const user = await prisma.user.findFirst({
      where: { username },
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

export async function deleteUser(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user.id;
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });
    return res.status(200).json(createSafeUser(deletedUser));
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: AuthenticatedUserRequest<Partial<User>>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user.id;
    const fieldsToUpdate = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { ...fieldsToUpdate },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });
    return res.status(200).json(createSafeUser(updatedUser));
  } catch (err) {
    next(err);
  }
}

export async function follow(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction
) {
  const followerId = req.user.id;
  const followingId = req.params.username; //followingid and username kinda doesnt make sense, double check

  if (followerId === followingId) {
    return res.status(400).json({ message: "You can not follow yourself" });
  }

  try {
    const alreadyFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    if (alreadyFollowing) {
      return res
        .status(400)
        .json({ message: "You are already following this user" });
    }

    await prisma.follow.create({
      data: {
        followerId: followerId,
        followingId: followingId,
      },
    });

    const followedUser = await prisma.user.findFirst({
      where: { id: followingId },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!followedUser) {
      return res
        .status(404)
        .json({ message: "Follow successful, but followed user not found" });
    }
    return res.status(201).json(createSafeUser(followedUser));
  } catch (err) {
    next(err);
  }
}

export async function unfollow(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction
) {
  const followerId = req.user.id;
  const followingId = req.params.username;

  try {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    if (!existingFollow) {
      return res
        .status(400)
        .json({ message: "You already dont follow this user" });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    const followedUser = await prisma.user.findFirst({
      where: { id: followingId },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!followedUser) {
      return res.status(404).json({
        message: "Unfollow successful, but unfollowed user not found",
      });
    }
    return res.status(204).json(createSafeUser(followedUser));
  } catch (err) {
    next(err);
  }
}

export async function getFollowers(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction
) {
  const username = req.params.username;

  try {
    const user = await prisma.user.findFirst({
      where: { username },
      select: {
        followers: {
          select: {
            follower: {
              select: {
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });
    if (!user) return res.status(404).json({ messsage: "User not found" });

    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function getFollowing(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction
) {
  const username = req.params.username;

  try {
    const user = await prisma.user.findFirst({
      where: { username },
      select: {
        following: {
          select: {
            follower: {
              select: {
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });
    if (!user) return res.status(404).json({ messsage: "User not found" });

    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function searchUsers(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction
) {
  const username = req.params.username;

  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          startsWith: username,
          mode: "insensitive",
        },
      },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
      orderBy: {
        username: "desc",
      },
      take: 20,
    });

    const safeUsers = users.map((u) => createSafeUser(u));
    return res.status(200).json(safeUsers);
  } catch (err) {
    next(err);
  }
}