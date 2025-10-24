import { Router } from "express";
import {
  isAuthenticated,
  isAuthorized,
  validateEdit,
} from "../middleware/authMiddleware.js";
import {
  deleteUser,
  follow,
  getFollowers,
  getFollowing,
  getFullUser,
  getUserByUsername,
  isFollowing,
  searchUsers,
  unfollow,
  updateUser,
} from "../controller/userController.js";
import multer from "multer";
import { validateFile } from "../middleware/fileMiddleware.js";

const usersRouter = Router();

//could become potential issue over time when theres a lot of traffic
export const upload = multer({ storage: multer.memoryStorage() });

usersRouter.get("/user", isAuthenticated, isAuthorized, getFullUser);

usersRouter.get("/:username/following", isAuthenticated, getFollowing);

usersRouter.get("/:username/followers", isAuthenticated, getFollowers);

usersRouter.get("/:username/mutual", isAuthenticated, isFollowing);

usersRouter.post("/:username/follow", isAuthenticated, follow);

usersRouter.delete("/:username/follow", isAuthenticated, unfollow);

usersRouter.get("/search/:username", isAuthenticated, searchUsers);

usersRouter.get("/:username", isAuthenticated, getUserByUsername);

usersRouter.delete("/:username", isAuthenticated, isAuthorized, deleteUser);

usersRouter.patch(
  "/:username",
  isAuthenticated,
  isAuthorized,
  upload.single("profilePicture"),
  validateFile,
  validateEdit,
  updateUser,
);

export default usersRouter;
