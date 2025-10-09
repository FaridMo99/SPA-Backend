import { Router } from "express"
import {validateLogin, validateSignup} from "../middleware/authMiddleware"
import {login,logout,signup} from "../controller/authController"

const authRouter = Router()

authRouter.post("/login",validateLogin, login)
authRouter.post("/signup",validateSignup,signup);
authRouter.post("/logout",logout);

export default authRouter
//signup no duplicate usernames, check that