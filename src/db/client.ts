import { PrismaClient } from "../generated/prisma/index.js";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

export default prisma;
