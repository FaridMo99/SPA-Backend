import { Router } from "express"
import {validateLogin, validateSignup} from "../middleware/authMiddleware"

const authRouter = Router()

authRouter.post("/login",validateLogin, (req, res, next) => { })
authRouter.post("/signup",validateSignup, (req, res, next) => { });
authRouter.post("/logout", (req, res, next) => { });

export default authRouter
//signup no duplicate usernames, check that