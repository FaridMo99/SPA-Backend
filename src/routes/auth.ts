import { Router } from "express";
import {
  isAuthenticated,
  validateLogin,
  validateSignup,
} from "../middleware/authMiddleware.js";
import {
  changePassword,
  checkUser,
  login,
  logout,
  sendEmailToChangePassword,
  signup,
  verifyUser,
} from "../controller/authController.js";

const authRouter = Router();


authRouter.post("/forgot-password", sendEmailToChangePassword);
authRouter.patch("/change-password", changePassword);
authRouter.post("/verify-user", verifyUser);
authRouter.get("/me", isAuthenticated, checkUser);
authRouter.post("/login", validateLogin, login);
authRouter.post("/signup", validateSignup, signup);
authRouter.post("/logout", isAuthenticated, logout);

export default authRouter;