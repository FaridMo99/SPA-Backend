import { Router } from "express";
import { isAuthenticated, isAuthorized } from "../middleware/authMiddleware.js";
import {
  createChat,
  createMessage,
  deleteChat,
  deleteMessage,
  getAllUserChats,
  getSingleChatByChatId,
} from "../controller/chatsController.js";

const chatsRouter = Router();

//get all user chats(except the one with the deleted flag)
chatsRouter.get("/", isAuthenticated, getAllUserChats);

//create chat(when a user creates a chat again he already deleted before, shouldnt render the previous messages(basically on get all chats dont send messages by deleted at before deleted at))
chatsRouter.post("/", isAuthenticated, isAuthorized, createChat);

//delete chat(should only trigger a flag that doesnt render the chat for the user that deleted it anymore)
chatsRouter.delete("/:chatId", isAuthenticated, isAuthorized, deleteChat);

//get single chat details like messages etc.
chatsRouter.get("/:chatId/messages", isAuthenticated, getSingleChatByChatId);

//create message
chatsRouter.post(
  "/:chatId/messages",
  isAuthenticated,
  isAuthorized,
  createMessage,
);

//delete message
chatsRouter.delete(
  "/:chatId/messages/:messageId",
  isAuthenticated,
  isAuthorized,
  deleteMessage,
);

export default chatsRouter;
