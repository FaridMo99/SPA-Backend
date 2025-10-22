import { Request } from "express";
import session from "express-session";
import { User } from "../generated/prisma/index.js";
import { Socket } from "socket.io";

export interface UserSocket extends Socket {
  userId?: string;
}

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

export type GifMetadata = {
  url: string;
  width: number;
  height: number;
  size: number;
};

export type GifMetadataGroup = {
  gif: GifMetadata;
  webp: GifMetadata;
  jpg: GifMetadata;
  mp4: GifMetadata;
  webm: GifMetadata;
};

export type GifFile = {
  hd: GifMetadataGroup;
  md: GifMetadataGroup;
  sm: GifMetadataGroup;
  xs: GifMetadataGroup;
};

//gifs.data.data[0]
export type GifItem = {
  id: number;
  slug: string;
  title: string;
  file: GifFile;
  tags: string[];
  type: "gif";
  blur_preview: string; // base64
};

//gifs.data.data
export type Gifs = GifItem[];

//gifs.data
export type GifsData = {
  data: Gifs;
  current_page: number;
  per_page: number;
  has_next: boolean;
  meta: { item_min_width: number; ad_max_resize_percent: number };
};

//gifs root
export type GifsRoot = {
  result: boolean;
  data: GifsData;
};

//for frontend
export type GifForClient = {
  url: string;
  width: number;
  height: number;
  blur_preview?: string;
};
