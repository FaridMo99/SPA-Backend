import { Router } from "express"
import { isAuthenticated } from "../middleware/authMiddleware"

const postsRouter = Router()

postsRouter.get("/", isAuthenticated, (req, res, next) => {});

postsRouter.get("/:postId", isAuthenticated, (req, res, next) => {
    
})

postsRouter.post("/", isAuthenticated, (req, res, next) => {});

postsRouter.delete("/", isAuthenticated, (req, res, next) => {});

// like/dislike update interaction
postsRouter.patch("/", isAuthenticated, (req, res, next) => {});


export default postsRouter


//look how you make algorithm for fyp
//query params to sort,paginate,filter
//check if this isAuthenticated makes more sense on the backend
//or frontend
//check how you would redirect on 
//everything also for other api routes
//add functionality for posting images/gifs