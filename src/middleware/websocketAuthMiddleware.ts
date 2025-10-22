import { ExtendedError } from "socket.io";
import { UserSocket } from "../types/types.js";
import cookie from "cookie";
import signature from "cookie-signature";
import redis from "../cache/redis.js";

export async function websocketAuthMiddleware(
  socket: UserSocket,
  next: (err?: ExtendedError) => void,
) {
  const signedCookie = socket.handshake.headers.cookie;
  if (!signedCookie) return next(new Error("User not authenticated"));

  const parsedCookie = cookie.parse(signedCookie);
  const rawCookie = parsedCookie.session.slice(2);
  const sessionId = signature.unsign(rawCookie, process.env.SESSION_SECRET);

  try {
    const sessionData = await redis.get(`sess:${sessionId}`);

    if (!sessionData) return next(new Error("User not authenticated"));
    const userId = JSON.parse(sessionData as string).passport.user;
    socket.userId = userId;
    if (!userId) return next(new Error("User not authenticated"));
    next();
  } catch (err) {
    console.error("Websocket error: " + err);
    next(err);
  }
}
