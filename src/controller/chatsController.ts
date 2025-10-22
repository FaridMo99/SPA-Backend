import { NextFunction, Response } from "express";
import { AuthenticatedUserRequest } from "./postController.js";
import prisma from "../db/client.js";
import { io } from "../app.js";

//when chat deleted and created again shouldnt have a preview
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
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                senderId: {
                  not: userId,
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            type: true,
            createdAt: true,
            deleted: true,
            sender: { select: { username: true } },
            read: true,
          },
        },
      },
    });

    //remove content when deleted is true
    chats.forEach((chat) => {
      const firstMessage = chat.messages?.[0];
      if (firstMessage?.deleted) {
        firstMessage.content = null;
      }
    });
    //raw sql sorting would also be possible and performance wise better but then i would lose typesafety so i traded a little bit of performance for typesafety here
    const sortedChats = chats.sort((a, b) => {
      const aLatest = a.messages[0]?.createdAt.getTime() ?? 0;
      const bLatest = b.messages[0]?.createdAt.getTime() ?? 0;
      return bLatest - aLatest;
    });

    return res.status(200).json(sortedChats);
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
    const userTwo = await prisma.user.findFirst({
      where: { username: userTwoUsername },
    });

    if (!userTwo) {
      console.log("3");
      return res.status(404).json({ message: "Second user not found" });
    }

    const userTwoId = userTwo.id;

    // Check if chat already exists
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { userOneId, userTwoId },
          { userOneId: userTwoId, userTwoId: userOneId },
        ],
      },
    });

    //check if not deleted by user that requested, if not deleted just send alreadyExists=true to just navigate to it on frontend
    if (
      chat &&
      ((chat.userOneId === userOneId && !chat.deletedByUserOne) ||
        (chat.userTwoId === userOneId && !chat.deletedByUserTwo))
    ) {
      console.log("1");
      return res.status(200).json({ ...chat, alreadyExists: true });
    }

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

    io.to(userTwoId).socketsJoin(chat.id);
    io.to(userTwoId).emit("newChat", {
      chatId: chat.id,
    });

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

    return res.status(204).end();
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
            id: true,
            type: true,
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
        NOT: { senderId: req.user.id },
        read: false,
      },
      data: {
        read: true,
      },
    });

    //logic for only sending messages after deletedby id and deletedat date
    // Filter messages after the user deleted the chat

    if (chat.userOneId === userId && chat.deletedAtUserOne) {
      chat.messages = chat.messages.filter(
        (message) => message.createdAt > chat.deletedAtUserOne,
      );
    }

    if (chat.userTwoId === userId && chat.deletedAtUserTwo) {
      chat.messages = chat.messages.filter(
        (message) => message.createdAt > chat.deletedAtUserTwo,
      );
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
  const message = req.body.message;
  const chatId = req.params.chatId;

  if (!message) return res.status(400).json({ message: "Message missing" });

  try {
    const newMessage = await prisma.message.create({
      select: {
        createdAt: true,
        content: true,
        type: true,
        sender: { select: { username: true, profilePicture: true } },
        read: true,
      },
      data: {
        content: message,
        chat: { connect: { id: chatId } },
        sender: { connect: { id: senderId } },
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
  const messageId = req.params.messageId;
  const chatId = req.params.chatId;
  try {
    const deletedMessage = await prisma.message.update({
      where: {
        id: messageId,
        sender: { id: userId },
        chat: { id: chatId },
        deleted: false,
      },
      data: {
        deleted: true,
        read: true,
      },
      select: {
        createdAt: true,
        content: true,
        type: true,
        sender: { select: { username: true, profilePicture: true } },
        read: true,
      },
    });

    return res.status(200).json(deletedMessage);
  } catch (err) {
    //use this more in other mutations
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Message not found",
      });
    }
    next(err);
  }
}

export async function getAllMessages(
  req: AuthenticatedUserRequest<{ messageId: string; chatId: string }>,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  try {
    const { read } = req.query;
    console.log(read);
    if (read) {
      const messages = await prisma.message.count({
        where: {
          read: read === "false" ? false : true,
          senderId: {
            not: userId,
          },
          chat: {
            OR: [{ userOneId: userId }, { userTwoId: userId }],
            AND: [
              {
                OR: [
                  { userOneId: userId, deletedByUserOne: false },
                  { userTwoId: userId, deletedByUserTwo: false },
                ],
              },
            ],
          },
        },
      });
      return res.status(200).json(messages);
    } else {
      const messages = await prisma.message.findMany({
        where: {
          chat: { OR: [{ userOneId: userId }, { userTwoId: userId }] },
        },
      });
      return res.status(200).json(messages);
    }
  } catch (err) {
    next(err);
  }
}
