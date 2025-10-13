import { Router } from "express";
import { isAuthenticated, validateLogin, validateSignup } from "../middleware/authMiddleware";
import { checkUser, login, logout, signup } from "../controller/authController";

const authRouter = Router();

authRouter.get("/me", isAuthenticated, checkUser);
authRouter.post("/login", validateLogin, login);
authRouter.post("/signup", validateSignup, signup);
authRouter.post("/logout",isAuthenticated, logout);

export default authRouter;
