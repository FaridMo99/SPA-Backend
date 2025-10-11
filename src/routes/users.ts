import { Router } from "express";
import { isAuthenticated, isAuthorized } from "../middleware/authMiddleware";
import {
  deleteUser,
  getUserByUsername,
  updateUser,
} from "../controller/userController";

const usersRouter = Router();

usersRouter.get("/:username", isAuthenticated, getUserByUsername);

usersRouter.delete("/:username", isAuthenticated, isAuthorized, deleteUser);

usersRouter.patch("/:username", isAuthenticated, isAuthorized, updateUser);

export default usersRouter;
