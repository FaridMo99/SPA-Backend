import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import {
  createPost,
  deletePost,
  getPostByPostId,
  toggleLike,
} from "../controller/postController";

const postsRouter = Router();

postsRouter.get("/", isAuthenticated, (req, res, next) => {});

postsRouter.get("/:postId", isAuthenticated, getPostByPostId);

postsRouter.post("/", isAuthenticated, createPost);

postsRouter.delete("/", isAuthenticated, deletePost);

postsRouter.patch("/", isAuthenticated, toggleLike);

export default postsRouter;

//check schema with middleware
//look how you make algorithm for fyp
//query params to sort,paginate,filter
//check if this isAuthenticated makes more sense on the backend
//or frontend
//check how you would redirect on
//everything also for other api routes
//add functionality for posting images/gifs
