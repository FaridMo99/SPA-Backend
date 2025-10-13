import { Router } from "express";
import { isAuthenticated, isAuthorized } from "../middleware/authMiddleware";
import { getTrendingGifs, searchGifs } from "../controller/gifsController";

const gifsRouter = Router();

//change route names later for what u usually should name them
gifsRouter.get("/trending", isAuthenticated, isAuthorized, getTrendingGifs);

gifsRouter.post("/search", isAuthenticated, isAuthorized, searchGifs);

export default gifsRouter;
