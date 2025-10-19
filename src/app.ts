import dotenv from "dotenv";
import chalk from "chalk";
dotenv.config();
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import postsRouter from "./routes/posts.js";
import commentsRouter from "./routes/comments.js";
import { disconnectAllServices } from "./lib/disconnectHandler.js";
import session from "express-session";
import passport from "./lib/passportConfig.js";
import redis from "./cache/redis.js";
import * as connectRedis from "connect-redis";
import filesRouter from "./routes/files.js";
import gifsRouter from "./routes/gifs.js";
import { createServer } from "http";
import chatsRouter from "./routes/chats.js";

const PORT = process.env.PORT;
const app = express();

//basic middleware
//adds req.body only for put,patch,post
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN ?? "http://localhost:5173"],
    credentials: true,
  }),
);

//session middleware
// @ts-ignore fill fix later
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
  }),
);
//adds req.login(), req.logout(), req.isAuthenticated(), req.isUnauthenticated()
app.use(passport.initialize());
//adds req.user through express.session() and deserializes the user if session exists
app.use(passport.session());

//route middleware
app.use("/auth", authRouter);
app.use("/chats", chatsRouter);
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.use("/files", filesRouter);
app.use("/gifs", gifsRouter);

//global error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(chalk.red(`Global Error Middleware: ${err.stack}`));
  console.error(err.stack);
  return res.status(500).json({ error: "Something went wrong" });
});

export const server = createServer(app);

server.listen(PORT, () => {
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
