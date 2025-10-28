import { Router } from "express";
import { isAuthenticated, isAuthorized } from "../middleware/authMiddleware.js";
import {
  createPost,
  deletePost,
  getPostsByFollow,
  getAllPostsByUsername,
  getPostByPostId,
  getRandomPosts,
  like,
  unlike,
} from "../controller/postController.js";
import { validateFile } from "../middleware/fileMiddleware.js";
import { upload } from "./users.js";

const postsRouter = Router();

postsRouter.post(
  "/",
  isAuthenticated,
  upload.single("image"),
  validateFile,
  createPost,
);

postsRouter.get("/follow", isAuthenticated, getPostsByFollow);

postsRouter.get("/fyp", isAuthenticated, getRandomPosts);

postsRouter.get("/:username/posts", isAuthenticated, getAllPostsByUsername);

postsRouter.post("/:postId/like", isAuthenticated, like);

postsRouter.delete("/:postId/like", isAuthenticated, unlike);

postsRouter.delete("/:postId", isAuthenticated, isAuthorized, deletePost);

postsRouter.get("/:postId", isAuthenticated, getPostByPostId);

export default postsRouter;
