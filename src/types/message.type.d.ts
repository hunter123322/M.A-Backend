export type IReaction = {
  userID: number;
  emoji?: string;
}

export type MessageDataType = {
  senderID: number,
  receiverID: number,
  conversationID: string,
  reactions: Array<IReaction>,
  content: string,
  createdAt?: Date
}

type MessageStatus = "sent" | "sending" | "delivered" | "seen" | "invalid";
type ContentType = "text" | "image" | "video" | "file" | "audio";

export type IMessage = {
  senderID: number;
  receiverID: number;
  conversationID: string;
  content: string;
  contentType: ContentType;
  status: MessageStatus;
  reactions: IReaction[];
  hide: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}