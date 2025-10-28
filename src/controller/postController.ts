import { NextFunction, Response } from "express";
import prisma from "../db/client.js";
import { AuthenticatedRequest } from "../types/types.js";
import { deleteCloudAsset, handleCloudUpload } from "../lib/fileHandlers.js";

function postObjectStructure(userId: string) {
  const postObject = {
    id: true,
    content: true,
    createdAt: true,
    type: true,
    user: {
      select: {
        username: true,
        profilePicture: true,
      },
    },
    _count: {
      select: {
        likedBy: true,
        comments: true,
      },
    },
    likedBy: {
      where: { id: userId },
      select: { id: true },
    },
  };

  return postObject;
}

export async function createPost(
  req: AuthenticatedRequest<{ content: string }>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id;
  const content = req.body.content;
  const file = req.file;


  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {

    let fileUrl: string = "";
    if (file) {
      fileUrl = (await handleCloudUpload(file)).secure_url
    }

    const post = await prisma.post.create({
      data: {
        userId,
        content: file ? fileUrl : content,
        type: file ? "IMAGE" : "TEXT",
      },
      select: postObjectStructure(userId),
    });
    return res.status(201).json(post);
  } catch (err) {
    return next(err);
  }
}

export async function deletePost(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const postId = req.params.postId;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Unauthroized" });

  try {
    const deletedPost = await prisma.post.delete({
      where: {
        id: postId,
      },
      select: postObjectStructure(userId),
    });

    //delete image on disk if theres one
    if (deletedPost.type === "IMAGE") {
      await deleteCloudAsset(deletedPost.content)
    }

    return res.status(200).json(deletedPost);
  } catch (err) {
    return next(err);
  }
}

export async function like(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const postId = req.params.postId;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Unauthroized" });

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { likedBy: { where: { id: userId } } },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likedBy.length > 0;
    if (alreadyLiked) {
      return res.status(400).json({ message: "Already liked" });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { likedBy: { connect: { id: userId } } },
      select: postObjectStructure(userId),
    });
    return res.status(200).json(updatedPost);
  } catch (err) {
    return next(err);
  }
}

export async function unlike(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const postId = req.params.postId;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Unauthroized" });

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { likedBy: { where: { id: userId } } },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyNotLiked = post.likedBy.length === 0;
    if (alreadyNotLiked) {
      return res.status(400).json({ message: "Already not liked" });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { likedBy: { disconnect: { id: userId } } },
      select: postObjectStructure(userId),
    });
    return res.status(200).json(updatedPost);
  } catch (err) {
    return next(err);
  }
}

export async function getPostByPostId(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  try {
    const postId = req.params.postId;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: postObjectStructure(userId),
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(200).json(post);
  } catch (err) {
    return next(err);
  }
}

export async function getAllPostsByUsername(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id;
  const username = req.params.username;

  if (!userId) return res.status(401).json({ message: "Unauthroized" });

  console.log("Hit get all posts by username username: " + username);
  try {
    const posts = await prisma.post.findMany({
      where: {
        user: {
          username,
        },
      },
      select: postObjectStructure(userId),
      orderBy: { createdAt: "desc" },
    });
    console.log("Hit successfully, Posts:");
    console.log(posts);
    return res.status(200).json(posts);
  } catch (err) {
    return next(err);
  }
}

export async function getPostsByFollow(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Unauthroized" });

  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;

  try {
    const posts = await prisma.post.findMany({
      select: postObjectStructure(userId),
      where: {
        user: {
          followers: {
            some: {
              followerId: userId,
            },
          },
        },
      },
      take: limit,
      skip: limit * (page - 1),
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(posts);
  } catch (err) {
    return next(err);
  }
}

export async function getRandomPosts(
  req: AuthenticatedRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;

  try {
    const posts = await prisma.post.findMany({
      select: postObjectStructure(userId),
      take: limit,
      skip: limit * (page - 1),
      orderBy: { createdAt: "desc" },
    });
    console.log(posts);
    return res.status(200).json(posts);
  } catch (err) {
    return next(err);
  }
}