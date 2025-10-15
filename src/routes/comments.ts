import { Request, Response, NextFunction, Router } from "express";
import { isAuthenticated, isAuthorized } from "../middleware/authMiddleware";
import {
  createComment,
  deleteComment,
  dislikeComment,
  getAllCommentsByPostId,
  getSingleCommentByPostIdAndCommentId,
  likeComment,
} from "../controller/commentController";

const commentsRouter = Router();


commentsRouter.post("/:postId/:commentId/like", isAuthenticated, isAuthorized, likeComment);

commentsRouter.delete("/:postId/:commentId/like", isAuthenticated, isAuthorized, dislikeComment);

//get single comment
commentsRouter.get(
  "/:postId/:commentId",
  isAuthenticated,
  getSingleCommentByPostIdAndCommentId,
);

//delete comment
commentsRouter.delete(
  "/:postId/:commentId",
  isAuthenticated,
  isAuthorized,
  deleteComment,
);

//get all comments
commentsRouter.get("/:postId", isAuthenticated, getAllCommentsByPostId);

//create comment
commentsRouter.post("/:postId", isAuthenticated, createComment);


export default commentsRouter;

//add commenting with images/gifs
//middleware for all routes to avoid duplicate code inside
