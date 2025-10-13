import { Router } from "express";
import { isAuthenticated, isAuthorized } from "../middleware/authMiddleware";
import {
  deleteUser,
  follow,
  getFollowers,
  getFollowing,
  getUserByUsername,
  searchUsers,
  unfollow,
  updateUser,
} from "../controller/userController";

const usersRouter = Router();


usersRouter.get("/:username/following", isAuthenticated, getFollowing);

usersRouter.get("/:username/followers", isAuthenticated, getFollowers);

usersRouter.post("/:username/follow", isAuthenticated, follow);

usersRouter.delete("/:username/follow", isAuthenticated, unfollow);

usersRouter.get("/search/:username", isAuthenticated, searchUsers);

usersRouter.get("/:username", isAuthenticated, getUserByUsername);

usersRouter.delete("/:username", isAuthenticated, isAuthorized, deleteUser);

usersRouter.patch("/:username", isAuthenticated, isAuthorized, updateUser);

export default usersRouter;
