import { Router } from "express"
import { isAuthenticated } from "../middleware/authMiddleware";

const commentsRouter = Router()

commentsRouter.get("/:postId", isAuthenticated, (req, res, next) => {
    
})

commentsRouter.get("/:postId/:commentId", isAuthenticated, (req, res, next) => {

});

//create comment
commentsRouter.post("/:postId", isAuthenticated, (req, res, next) => { });

//like/dislike comment
commentsRouter.patch("/:postId", isAuthenticated, (req, res, next) => {});

//comment on comment
commentsRouter.post("/:postId/:commentId", isAuthenticated, (req, res, next) => {});

export default commentsRouter

//check if isauthed or isauthz makes more sense
//check how you handle commenting on comments like infinitely
//add also commenting with images/gifs