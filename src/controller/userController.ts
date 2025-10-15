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

    if (
      fieldsToUpdate.username &&
      fieldsToUpdate.username !== req.user.username
    ) {
      const user = await prisma.user.findFirst({
        where: { username: fieldsToUpdate.username },
      });
      if (user)
        return res.status(400).json({ message: "Username already taken" });
    }

    if (fieldsToUpdate.email && fieldsToUpdate.email !== req.user.email) {
      const user = await prisma.user.findFirst({
        where: {
          email: fieldsToUpdate.email,
        },
      });
      if (user) return res.status(400).json({ message: "Email already taken" });
    }

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

  //id is the one trying to follow the username so id has to be added to usernames followers 
  const followerId = req.user.id;
  const username = req.params.username;

  try {
    const userToFollow = await prisma.user.findFirst({
      where: { username },
    });

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingId = userToFollow.id;

    if (followerId === followingId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const alreadyFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
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
        followerId,
        followingId,
      },
    });

    const followedUser = await prisma.user.findUnique({
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
        message: "Follow successful, but followed user not found",
      });
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
  const username = req.params.username;

  try {
    //Username only works in this db model because it also has to be unique
    const userToUnfollow = await prisma.user.findFirst({
      where: { username },
    });

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    const followingId = userToUnfollow.id;

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    const unfollowedUser = await prisma.user.findUnique({
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

    if (!unfollowedUser) {
      return res.status(404).json({
        message: "Unfollow successful, but unfollowed user not found",
      });
    }
    return res.status(200).json(createSafeUser(unfollowedUser));
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
            following: {
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

export async function getFullUser(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction
) {
  const id = req.user.id;
  console.log("hit new route");

  try {
    const user = await prisma.user.findFirst({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { birthdate, createdAt, ...newUser } = user;
    return res.status(200).json(newUser);
  } catch (err) {
    next(err);
  }
}


export async function isFollowing(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction
) {
  const username = req.params.username; // user to check
  const userId = req.user.id; // logged-in user

  try {
    // Find the target userId
    const targetUser = await prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if logged-in user follows target user
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUser.id,
        },
      },
    });

    return res.status(200).json({ following: !!follow });
  } catch (err) {
    next(err);
  }
}