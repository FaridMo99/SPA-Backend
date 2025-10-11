import { Request } from "express";
import session from "express-session";
import { User } from "../generated/prisma";

export interface AuthenticatedRequest<T> extends Request {
  // Passport
  user?: User;
  login: Request["login"];
  logout: Request["logout"];
  isAuthenticated: Request["isAuthenticated"];
  isUnauthenticated: Request["isUnauthenticated"];
  body: T;
  // Session
  session: session.Session & Partial<session.SessionData>;
}
