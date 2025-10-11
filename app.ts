import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
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

dotenv.config();
const PORT = process.env.NODE_PORT;
const app = express();

//basic middleware
//adds req.body only for put,patch,post
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN ?? "http://localhost:5173"],
  }),
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
      httpOnly: true,
      path: "/",
      sameSite: "strict",
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
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);

//global error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  return res.status(500).json({ error: "Something went wrong" });
});

export const server = app.listen(PORT, () => {
  console.log("Server is Running");
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

//add restart behavior and solution
