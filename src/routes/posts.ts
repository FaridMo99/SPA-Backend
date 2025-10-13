import { Router } from "express";
import { isAuthenticated, isAuthorized } from "../middleware/authMiddleware";
import {
  createPost,
  deletePost,
  getAllPostsByFollow,
  getAllPostsByUsername,
  getPostByPostId,
  getRandomPosts,
  like,
  unlike,
} from "../controller/postController";

const postsRouter = Router();


postsRouter.post("/", isAuthenticated, createPost);

postsRouter.get("/follow", isAuthenticated, getAllPostsByFollow);

//has to be post request since it needs the seenids in the body, search params and cookies cant hold enough data
postsRouter.get("/fyp", isAuthenticated, getRandomPosts);

postsRouter.get("/:username/posts", isAuthenticated, getAllPostsByUsername);

postsRouter.post("/:postId/like", isAuthenticated, isAuthorized, like);

postsRouter.delete("/:postId/like", isAuthenticated, isAuthorized, unlike);

postsRouter.delete("/:postId", isAuthenticated, isAuthorized, deletePost);

postsRouter.get("/:postId", isAuthenticated, getPostByPostId);

export default postsRouter;

//check schema with middleware
//look how you make algorithm for fyp
//query params to sort,paginate,filter
//check if this isAuthenticated makes more sense on the backend
//or frontend
//check how you would redirect on
//everything also for other api routes
//add functionality for posting images/gifs
