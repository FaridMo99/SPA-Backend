// services/messageService.ts

import prisma from "../db/client.js";
import { $Enums } from "../generated/prisma/index.js";

//change typings later

//should auto add other user to chat again
export async function createMessageWS(
  senderId: string,
  chatId: string,
  message: string,
  type?: "GIF" | "TEXT",
): Promise<{
  type: $Enums.MessageType;
  id: string;
  createdAt: Date;
  content: string;
  deleted: boolean;
  read: boolean;
  sender: {
    username: string;
    profilePicture: string | null;
  };
}> {
  if (!message) throw new Error("Message missing");

  const newMessage = await prisma.message.create({
    select: {
      id: true,
      deleted: true,
      createdAt: true,
      type: true,
      content: true,
      sender: { select: { username: true, profilePicture: true } },
      read: true,
    },
    data: {
      content: message,
      chat: { connect: { id: chatId } },
      sender: { connect: { id: senderId } },
      ...(type && { type }),
    },
  });

  return newMessage;
}

export async function getAllUserChatsIdWS(
  id: string,
): Promise<{ id: string }[]> {
  const chats = await prisma.chat.findMany({
    where: { OR: [{ userOneId: id }, { userTwoId: id }] },
    select: { id: true },
  });

  return chats;
}

export async function deleteMessageWs(
  chatId: string,
  messageId: string,
  userId: string,
): Promise<{
  createdAt: Date;
  content: string;
  type: $Enums.MessageType;
  read: boolean;
  sender: {
    username: string;
    profilePicture: string | null;
  };
}> {
  const deletedMessage = await prisma.message.update({
    where: {
      id: messageId,
      sender: { id: userId },
      chat: { id: chatId },
      deleted: false,
    },
    data: {
      deleted: true,
    },
    select: {
      createdAt: true,
      content: true,
      type: true,
      sender: { select: { username: true, profilePicture: true } },
      read: true,
    },
  });

  return deletedMessage;
}
