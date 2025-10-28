import prisma from "../db/client.js";
import { $Enums } from "../generated/prisma/index.js";

//update frontend type
type MessageType = {
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
};

export async function createMessageWS(
  senderId: string,
  chatId: string,
  message: string,
  type?: "GIF" | "TEXT",
): Promise<MessageType> {
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
      chat:{select:{deletedByUserOne:true, deletedByUserTwo:true, id:true}}
    },
    data: {
      content: message,
      chat: { connect: { id: chatId } },
      sender: { connect: { id: senderId } },
      ...(type && { type }),
    },
  });

  if (newMessage.chat.deletedByUserOne || newMessage.chat.deletedByUserTwo) {
    await prisma.chat.update({
      where: { id: newMessage.chat.id },
      data: {
        ...(newMessage.chat.deletedByUserOne && { deletedByUserOne: false }),
        ...(newMessage.chat.deletedByUserTwo && { deletedByUserTwo: false }),
      },
    });
  }


  const {chat, ...messageToReturn} = newMessage
  return messageToReturn;
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
): Promise<MessageType> {
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
      deleted: true,
      id:true,
      createdAt: true,
      content: true,
      type: true,
      sender: { select: { username: true, profilePicture: true } },
      read: true,
    },
  });

  return deletedMessage;
}
