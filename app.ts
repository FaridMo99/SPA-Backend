import dotenv from "dotenv"
import chalk from "chalk"
dotenv.config()
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import authRouter from "./src/routes/auth";
import usersRouter from "./src/routes/users";
import postsRouter from "./src/routes/posts";
import commentsRouter from "./src/routes/comments";
import { disconnectAllServices } from "./src/lib/disconnectHandler";
import session from "express-session";
import passport from "./src/lib/passportConfig";
import redis from "./src/cache/redis";
import * as connectRedis from "connect-redis";
import filesRouter from "./src/routes/files";
import gifsRouter from "./src/routes/gifs";

const PORT = process.env.NODE_PORT;
const app = express();

//basic middleware 
//adds req.body only for put,patch,post
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN ?? "http://localhost:5173"],
    credentials:true
  })
);

//session middleware
const redisStore = new connectRedis.RedisStore({
  client: redis,
});
//adds. req.session with properties i set up here
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET ?? "ijfeawjiijn322489r3uogrebhou",
    resave: false,
    saveUninitialized: false,
    name: "session",
    cookie: {
      secure: process.env.NODE_ENV === "dev" ? false : true,
      httpOnly: true,
      path: "/",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
);
//adds req.login(), req.logout(), req.isAuthenticated(), req.isUnauthenticated()
app.use(passport.initialize());
//adds req.user through express.session() and deserializes the user if session exists
app.use(passport.session());


//route middleware
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.use("/files", filesRouter);
app.use("/gifs", gifsRouter);

//global error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(chalk.red(`Global Error Middleware: ${err.stack}`))
  console.error(err.stack);
  return res.status(500).json({ error: "Something went wrong" });
});

export const server = app.listen(PORT, () => {
  console.log(chalk.green("Server is Running"));
});

//process crash handler
process.on("uncaughtException", async (err: Error) => {
  await disconnectAllServices("Uncaught Exception:", err);
});
process.on("unhandledRejection", async (err: Error) => {
  await disconnectAllServices("Unhandled Rejection:", err);
});
process.on("SIGINT", async () => {
  await disconnectAllServices("SIGINT");
});
process.on("SIGTERM", async () => {
  await disconnectAllServices("SIGTERM");
});