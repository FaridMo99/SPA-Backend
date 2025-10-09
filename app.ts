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
import connectRedis from "connect-redis";

dotenv.config();
const PORT = process.env.NODE_PORT;
const app = express();

//basic middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN ?? "http://localhost:5173"],
  }),
);

//session middleware
const RedisStore = connectRedis.default(session);
const redisStore = new RedisStore({
  client: redis,
});

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET ?? "ijfeawjiijn322489r3uogrebhou",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

//route middlware
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);

//global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
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
//check if all error handling is correct
//close conenctions on shutdown
//check if my try catches use the global middleware
