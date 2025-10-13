import { Router } from "express";
import multer from "multer";
import path from "path";

//look if you have to give name to asset or it auto gets from user
//check if you have to create filepath and store in db to access file on requests
//if not delete field in db

const filesRouter = Router();
const upload = multer({ dest: path.join(import.meta.dirname, "../public/") });

//get single file
filesRouter.get("/:filePath", (req, res, next) => {});
//upload single file
filesRouter.post("/", upload.single("asset"), (req, res, next) => {});
//delete single file, add auth and authz to check if allowed
filesRouter.delete("/:filePath", (req, res, next) => {});

export default filesRouter;
