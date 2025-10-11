import { Request, Response, NextFunction, Router } from "express";
import { isAuthenticated, isAuthorized } from "../middleware/authMiddleware";
import {
  createComment,
  deleteComment,
  getAllCommentsByPostId,
  getSingleCommentByPostIdAndCommentId,
  toggleLikeComment,
} from "../controller/commentController";

const commentsRouter = Router();

//get all comments
commentsRouter.get("/:postId", isAuthenticated, getAllCommentsByPostId);

//get single comment
commentsRouter.get(
  "/:postId/:commentId",
  isAuthenticated,
  getSingleCommentByPostIdAndCommentId,
);

//create comment
commentsRouter.post("/:postId", isAuthenticated, isAuthorized, createComment);

//delete comment
commentsRouter.delete(
  "/:postId/:commentId",
  isAuthenticated,
  isAuthorized,
  deleteComment,
);

//like/dislike comment
commentsRouter.patch("/:postId/:commentId", isAuthenticated, toggleLikeComment);

export default commentsRouter;

//add commenting with images/gifs
//middleware for all routes to avoid duplicate code inside
