import { Request } from "express";
import session from "express-session";
import { User } from "../generated/prisma/index.js";

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

type GifMetadata = {
  url: string;
  width: number;
  height: number;
  size: number;
};

type GifMetadataGroup = {
  gif: GifMetadata;
  webp: GifMetadata;
  jpg: GifMetadata;
  mp4: GifMetadata;
  webm: GifMetadata;
};

export type Gif = {
  result: true;
  data: {
    data: [
      {
        url: string;
        width: number;
        height: number;
        size: number;
        file: {
          hd: GifMetadataGroup;
          md: GifMetadataGroup;
          sm: GifMetadataGroup;
          xs: GifMetadataGroup;
        };
        tags: [];
        type: string;
        blur_preview: string;
      },
    ];
    current_page: number;
    per_page: number;
    has_next: boolean;
  };
};
