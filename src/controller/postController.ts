import { NextFunction, Request, Response } from "express";
import prisma from "../db/client";
import { User } from "../generated/prisma";

export interface AuthenticatedUserRequest<T> extends Request {
  user: User;
  body: T;
}

export async function createPost(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const content = req.body;
  try {
    const post = await prisma.post.create({ data: { userId, content } });
    return res.status(201).json(post);
  } catch (err) {
    next(err);
  }
}

export async function deletePost(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction,
) {
  const postId = req.params.postId;
  const userId = req.user.id;

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        userId: userId,
      },
    });
    if (!post) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deletedPost = await prisma.post.delete({
      where: {
        id: postId,
      },
    });
    return res.status(200).json(deletedPost);
  } catch (err) {
    next(err);
  }
}

export async function toggleLike(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction,
) {
  const postId = req.params.postId;
  const userId = req.user.id;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { likedBy: { where: { id: userId } } },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likedBy.length > 0;

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likedBy: alreadyLiked
          ? { disconnect: { id: userId } }
          : { connect: { id: userId } },
      },
    });

    return res.status(200).json(updatedPost);
  } catch (err) {
    next(err);
  }
}

export async function getPostByPostId(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction,
) {
  try {
    const postId = req.params.postId;
    const post = await prisma.post.findFirst({
      where: { id: postId },
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(200).json(post);
  } catch (err) {
    next(err);
  }
}

export async function getAllPostsByUserId(
  req: AuthenticatedUserRequest<string>,
  res: Response,
  next: NextFunction,
) {}

export async function getAllPostsByFollow() {}

export async function getRandomPosts() {
  //for fyp, should not show duplicates,
  //pagination for infinite scrolling
}

//interface type kinda wrong since not all get body, fix that
