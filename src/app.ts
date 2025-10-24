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
import gifsRouter from "./routes/gifs.js";
import { createServer } from "http";
import chatsRouter from "./routes/chats.js";
import { Server as SocketServer } from "socket.io";
import { websocketAuthMiddleware } from "./middleware/websocketAuthMiddleware.js";
import { UserSocket } from "./types/types.js";
import {
  createMessageWS,
  deleteMessageWs,
  getAllUserChatsIdWS,
} from "./controller/websocket.js";
import { isAuthenticated } from "./middleware/authMiddleware.js";
import { getSingleFileByFileName } from "./controller/uploadsController.js";

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
const redisStore = new (connectRedis as any).RedisStore({
  client: redis,
});

//adds req.session with properties i set up here
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET!,
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
app.use("/gifs", gifsRouter);
app.get("/uploads/:filename", isAuthenticated, getSingleFileByFileName);

//global error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(chalk.red(`Global Error Middleware: ${err.stack}`));
  console.error(err.stack);
  return res.status(500).json({ error: "Something went wrong" });
});

export const server = createServer(app);
server.listen(PORT, async () => {
  console.log(chalk.green("Server is Running"));
});

//websocket server
//if using https without load balancer you have to give the cert paths to client and to server to upgrade to wss
export const io = new SocketServer(server, {
  cors: {
    origin: [process.env.CLIENT_ORIGIN!],
    credentials: true,
  },
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const allowedOrigins = [process.env.CLIENT_ORIGIN];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Bad WebSocket connection attempt from: " + origin);
      callback("Not allowed", false);
    }
  },
});

//websocket middleware
io.use(websocketAuthMiddleware);

//websocket connection
//add logic so it only sends to correct users, right now it sends to everyone
io.on("connection", async (socket: UserSocket) => {
  const userId = socket.userId;

  if (!userId) {
    console.error("Socket missing userId!");
    console.log("User not authenticated for websocket connection");
    socket.disconnect();
    return;
  }
  console.log(chalk.magenta("connected to ws: " + userId));

  //getting all chat ids
  try {
    const userChats = await getAllUserChatsIdWS(userId);
    if (userChats.length > 0) {
      await Promise.all(
        userChats.map((chat) => {
          socket.join(chat.id);
          console.log(chalk.green(`${userId} joined chat: ${chat.id}`));
        }),
      );
    }
  } catch (err) {
    console.error("Failed to fetch user chats:", err);
    socket.emit("error", { message: "Failed to load chats" });
  }

  //message creation
  socket.on(
    "message",
    async (
      arg: { message: string; chatId: string; type?: "GIF" | "TEXT" },
      notifyUser,
    ) => {
      try {
        const { message, chatId, type } = arg;
        console.log(chalk.bgRedBright(`sending message from:${userId}`));

        const newMessage = type
          ? await createMessageWS(userId, chatId, message, type)
          : await createMessageWS(userId, chatId, message);

        io.to(chatId).emit("message", newMessage);

        if (notifyUser) {
          notifyUser({ status: "successful" });
        }
      } catch (err) {
        if (notifyUser) {
          notifyUser({ status: "failed" });
        }
        console.error("Failed to send message:", err);
        socket.emit("error", {
          message: err instanceof Error ? err : new Error("Failure"),
        });
      }
    },
  );

  //message deletion
  socket.on(
    "deleteMessage",
    async (arg: { messageId: string; chatId: string }, notifyUser) => {
      try {
        const { messageId, chatId } = arg;
        const message = await deleteMessageWs(chatId, messageId, userId);
        io.to(chatId).emit("messageDeleted");

        if (notifyUser) {
          notifyUser({ status: "successful" });
        }
      } catch (err) {
        if (notifyUser) {
          notifyUser({ status: "failed" });
        }
        console.error("Failed to delete message:", err);
        socket.emit("error", {
          message: err instanceof Error ? err : new Error("Failure"),
        });
      }
    },
  );

  socket.on("joinChat", (chatId: string) => {
    socket.join(chatId);
  });

  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);
  });

  socket.on("disconnect", () => {
    console.log(chalk.magenta("disconnected from ws: " + userId));
  });
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
