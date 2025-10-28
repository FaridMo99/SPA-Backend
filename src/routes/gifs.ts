import { Router } from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import { getTrendingGifs, searchGifs } from "../controller/gifsController.js";

const gifsRouter = Router();


gifsRouter.get("/trending", isAuthenticated, getTrendingGifs);

gifsRouter.get("/", isAuthenticated, searchGifs);

export default gifsRouter;
