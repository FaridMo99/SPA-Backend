import { Response, NextFunction } from "express";
import prisma from "../db/client.js";
import { AuthenticatedUserRequest } from "./postController.js";
import { Comment } from "../generated/prisma/index.js";

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
      type: true,
      id: true,
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
  req: AuthenticatedUserRequest<{
    content: string;
    contentType?: "GIF" | "TEXT";
  }>,
  res: Response,
  next: NextFunction,
) {
  const { postId } = req.params;
  const userId = req.user.id;
  const { content, contentType } = req.body;

  try {
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
        type: contentType ?? "TEXT",
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

export async function likeComment(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const postId = req.params.postId;
  const commentId = req.params.commentId;

  try {
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, postId: postId },
    });

    if (!comment) {
      return res
        .status(404)
        .json({ message: "Comment not found on this post" });
    }
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        likedBy: { connect: { id: userId } },
      },
      select: commentObjectStructure(userId, { id: commentId }).select,
    });

    return res.status(200).json(updatedComment);
  } catch (err) {
    return next(err);
  }
}

export async function dislikeComment(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const postId = req.params.postId;
  const commentId = req.params.commentId;

  try {
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, postId: postId },
    });

    if (!comment) {
      return res
        .status(404)
        .json({ message: "Comment not found on this post" });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        likedBy: { disconnect: { id: userId } },
      },
      select: commentObjectStructure(userId, { id: commentId }).select,
    });

    return res.status(200).json(updatedComment);
  } catch (err) {
    return next(err);
  }
}
