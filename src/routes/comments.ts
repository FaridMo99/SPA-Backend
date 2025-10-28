import {  Router } from "express";
import { isAuthenticated, isAuthorized } from "../middleware/authMiddleware.js";
import {
  createComment,
  deleteComment,
  dislikeComment,
  getAllCommentsByPostId,
  getSingleCommentByPostIdAndCommentId,
  likeComment,
} from "../controller/commentController.js";

const commentsRouter = Router();

commentsRouter.post(
  "/:postId/:commentId/like",
  isAuthenticated,
  isAuthorized,
  likeComment,
);

commentsRouter.delete(
  "/:postId/:commentId/like",
  isAuthenticated,
  isAuthorized,
  dislikeComment,
);

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
