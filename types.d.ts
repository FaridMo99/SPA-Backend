import { User as PrismaUser } from "./src/generated/prisma/index.js";

declare global {
  namespace Express {
    interface User extends PrismaUser {}
  }
}
