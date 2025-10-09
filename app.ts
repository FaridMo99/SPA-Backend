import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv"
import cors from "cors"
import authRouter from "./routes/auth"
import usersRouter from "./routes/users";
import postsRouter from "./routes/posts";

dotenv.config()

const PORT = process.env.PORT

const app = express()

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin:[process.env.CLIENT_ORIGIN ?? "http://localhost:5173"]
}))

app.use("/auth", authRouter)
app.use("/users", usersRouter)
app.use("/posts", postsRouter)
app.use("/comments", postsRouter);


app.use((err:Error, req:Request, res:Response, next:NextFunction) => {
  console.error(err.stack); 
  res.status(500).json({ error: "Something went wrong" });
});


const server = app.listen(PORT, () => {
    console.log("Server is Running")
})

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  server.close(() => {
    console.log("Closing server");
    process.exit(1);
  });
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => {
    console.log("Closing server");
    process.exit(1);
  });
});

//add restart behavior and solution
//check if all error handling is correct
//close conenctions on shutdown
//check if my try catches use the global middleware