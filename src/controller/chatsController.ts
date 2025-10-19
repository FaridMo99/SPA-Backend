import { NextFunction, Response } from "express";
import { AuthenticatedUserRequest } from "./postController.js";
import prisma from "../db/client.js";

//shouldnt get the ones where deleted is true by req.user.id
export async function getAllUserChats(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          {
            userOneId: userId,
            deletedByUserOne: false,
          },
          {
            userTwoId: userId,
            deletedByUserTwo: false,
          },
        ],
      },
      select: {
        id: true,
        userOne: { select: { profilePicture: true, username: true } },
        userTwo: { select: { profilePicture: true, username: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            sender: { select: { username: true } },
            read: true,
          },
        },
      },
    });

    return res.status(200).json(chats);
  } catch (err) {
    next(err);
  }
}

//check what to return, should return the same as get single chat
export async function createChat(
  req: AuthenticatedUserRequest<{ userTwoUsername: string }>,
  res: Response,
  next: NextFunction,
) {
  const userOneId = req.user.id;
  const userTwoUsername = req.body.userTwoUsername;

  if (!userTwoUsername)
    return res.status(400).json({ message: "Second Username doesn't exist" });

  try {
    // First, find the other user
    const userTwo = await prisma.user.findUnique({
      where: { username: userTwoUsername },
    });

    if (!userTwo) {
      return res.status(404).json({ message: "Second user not found" });
    }

    const userTwoId = userTwo.id;

    // Check if chat already exists
    let chat = await prisma.chat.findUnique({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
    });

    if (chat) {
      // Reset deleted flag only for the current user
      const updateData =
        userOneId === chat.userOneId
          ? { deletedByUserOne: false }
          : { deletedByUserTwo: false };

      chat = await prisma.chat.update({
        where: { id: chat.id },
        data: updateData,
      });
    } else {
      // Create a new chat
      chat = await prisma.chat.create({
        data: {
          userOne: { connect: { id: userOneId } },
          userTwo: { connect: { id: userTwoId } },
        },
      });
    }
    return res.status(201).json(chat);
  } catch (err) {
    next(err);
  }
}

export async function deleteChat(
  req: AuthenticatedUserRequest<{}>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const chatId = req.params.chatId;

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userOneId: true, userTwoId: true },
    });

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const updateData =
      userId === chat.userOneId
        ? { deletedByUserOne: true, deletedAtUserOne: new Date() }
        : userId === chat.userTwoId
          ? { deletedByUserTwo: true, deletedAtUserTwo: new Date() }
          : null;

    if (!updateData) return res.status(403);

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: updateData,
    });

    return res.status(204);
  } catch (err) {
    next(err);
  }
}

//check what to return, should return the same as delete and create and get single chat
export async function getSingleChatByChatId(
  req: AuthenticatedUserRequest<{ userTwoUsername: string }>,
  res: Response,
  next: NextFunction,
) {
  const id = req.params.chatId;
  const userId = req.user.id;

  try {
    const chat = await prisma.chat.findFirst({
      where: { id, OR: [{ userOneId: userId }, { userTwoId: userId }] },
      include: {
        messages: {
          select: {
            sender: { select: { username: true, profilePicture: true } },
            deleted: true,
            content: true,
            createdAt: true,
            read: true,
          },
        },
      },
    });

    if (!chat) return res.status(404).json({ message: "No Chat found" });

    //logic for when deleted messages included dont send content just the boolean
    chat.messages.forEach((message, index) => {
      if (message.deleted) {
        chat.messages[index].content = null;
      }
    });

    //logic for turning unread messages to read
    const updatedMessages = await prisma.message.updateMany({
      where: {
        chatId: id,
        receiverId: req.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    //logic for only sending messages after deletedby id and deletedat date
    if (chat.deletedByUserOne && chat.userOneId === userId) {
      chat.messages = chat.messages.filter(
        (message) => message.createdAt > chat.deletedAtUserOne,
      );
      return res.status(200).json(chat);
    }

    if (chat.deletedByUserTwo && chat.userOneId === userId) {
      chat.messages = chat.messages.filter(
        (message) => message.createdAt > chat.deletedAtUserTwo,
      );
      return res.status(200).json(chat);
    }

    return res.status(200).json(chat);
  } catch (err) {
    next(err);
  }
}

export async function createMessage(
  req: AuthenticatedUserRequest<{ receiverUsername: string; message: string }>,
  res: Response,
  next: NextFunction,
) {
  const senderId = req.user.id;
  const receiverUsername = req.body.receiverUsername;
  const message = req.body.message;
  const chatId = req.params.chatId;

  if (!receiverUsername)
    return res.status(400).json({ message: "Receiver missing" });
  if (!message) return res.status(400).json({ message: "Message missing" });

  try {
    const newMessage = await prisma.message.create({
      select: {
        createdAt: true,
        content: true,
        sender: { select: { username: true, profilePicture: true } },
        read: true,
      },
      data: {
        content: message,
        chat: { connect: { id: chatId } },
        sender: { connect: { id: senderId } },
        receiver: { connect: { username: receiverUsername } },
      },
    });
    return res.status(201).json(newMessage);
  } catch (err) {
    next(err);
  }
}

export async function deleteMessage(
  req: AuthenticatedUserRequest<{ messageId: string; chatId: string }>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  const messageId = req.body.messageId;
  const chatId = req.params.chatId;
  try {
    const deletedMessage = await prisma.message.update({
      where: { id: messageId, sender: { id: userId }, chat: { id: chatId } },
      data: {
        deleted: true,
      },
      select: {
        createdAt: true,
        content: true,
        sender: { select: { username: true, profilePicture: true } },
        read: true,
      },
    });

    return res.status(200).json(deletedMessage);
  } catch (err) {
    next(err);
  }
}

//since im using req.user.id, check if websockets even send that to my http api routes