import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware";

const usersRouter = Router();

usersRouter.get("/", isAuthenticated, (req, res, next) => {
    
})

usersRouter.get("/:username", isAuthenticated, (req, res, next) => {
    
});

usersRouter.delete("/:username", isAuthenticated, (req, res, next) => {});

usersRouter.patch("/:username", isAuthenticated, (req, res, next) => { });

export default usersRouter;
