import { Response, NextFunction } from "express";
import prisma from "../db/client";
import { AuthenticatedUserRequest } from "./postController";
import { Comment } from "../generated/prisma";

//update type later

function commentObjectStructure(
  userId: string,
  commentIdentifiers: Partial<Comment>,
) {
  const commentObject = {
    where: {
      ...commentIdentifiers,
    },
    select: {
      content: true,
      createdAt: true,
      user: {
        select: {
          username: true,
          profilePicture: true,
        },
      },
      _count: {
        select: {
          likedBy: true,
        },
      },
      likedBy: {
        where: { id: userId },
        select: { id: true },
      },
    },
  };
  return commentObject;
}

export async function getAllCommentsByPostId(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const postId = req.params.postId;
  const userId = req.user.id;

  try {
    const comments = await prisma.comment.findMany({
      ...commentObjectStructure(userId, { postId }),
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
}

export async function getSingleCommentByPostIdAndCommentId(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const postId = req.params.postId;
  const userId = req.user.id;
  const commentId = req.params.commentId;

  try {
    const comment = await prisma.comment.findFirst(
      commentObjectStructure(userId, { postId, id: commentId }),
    );
    if (!comment) {
      return res.status(404).json({ message: "Comment not Found" });
    }
    return res.status(200).json(comment);
  } catch (err) {
    next(err);
  }
}

export async function createComment(
  req: AuthenticatedUserRequest<{ content: string }>,
  res: Response,
  next: NextFunction,
) {
  const postId = req.params.postId;
  const userId = req.user.id;
  const content = req.body.content;

  try {
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
      },
      select: commentObjectStructure(userId, { postId }).select,
    });
    return res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(
  req: AuthenticatedUserRequest<Comment>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const commentId = req.params.commentId;

  try {
    const deletedComment = await prisma.comment.delete({
      where: { id: commentId },
      select: commentObjectStructure(userId, { id: commentId }).select,
    });
    return res.status(200).json(deletedComment);
  } catch (err) {
    next(err);
  }
}

export async function toggleLikeComment(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const commentId = req.params.commentId;

  try {
    const comment = await prisma.comment.findFirst({
      where: { id: commentId },
      include: { likedBy: { where: { id: userId } } },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const alreadyLiked = comment.likedBy.length > 0;
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        likedBy: alreadyLiked
          ? { disconnect: { id: userId } }
          : { connect: { id: userId } },
      },
      select: commentObjectStructure(userId, { id: commentId }).select,
    });
    return res.status(200).json(updatedComment);
  } catch (err) {
    return next(err);
  }
}
