import { test, describe, expect, mock, beforeEach } from "bun:test";
import * as messageService from "./user.mongo.model"; // replace with actual path
import type { IMessageDocument } from "../message/messages.model";
import type { ContactList } from "../../types/contact.list.type";
import type { Conversation } from "../../types/conversation.list.type";

// ---- Sample data ----
const sampleMessage: IMessageDocument = {
  _id: "6897191f78e25ae37bf6bfd6" as any,
  senderID: "1",
  receiverID: "userB",
  conversationID: "convAB",
  content: "hi",
  contentType: "text",
  reactions: [],
  status: "sent",
  hide: false,
  createdAt: new Date("2025-08-09T09:47:11.447Z"),
  updatedAt: new Date("2025-08-09T09:47:11.447Z"),
  __v: 0,
} as any;

const sampleContact: ContactList = {
  _id: "687233f088fe580f6a077605" as any,
  userID: "1",
  conversationID: ["1_14"],
} as any;

const sampleConversation: Conversation = {
  _id: "6872376588fe580f6a077609" as any,
  participant: [
    {
      userID: "1",
      firstName: "Aldrin",
      lastName: "Belardo",
      nickname: "1",
      mute: false,
    },
    {
      userID: "14",
      firstName: "Aldrin",
      lastName: "Belardo",
      nickname: "14",
      mute: false,
    },
  ],
  contactID: "1_14",
} as any;

// ---- Mocks ----
const mockFind = mock();
const mockFindOne = mock();

mock.module("../messages.model", () => ({
  default: {
    find: mockFind,
  },
}));

mock.module("../contact/contact.list.model", () => ({
  Contact: {
    findOne: mockFindOne,
  },
}));

mock.module("../conversation/conversation.model", () => ({
  ConversationList: {
    find: mockFind,
  },
}));

describe("Message Service", () => {
  beforeEach(() => {
    mockFind.mockReset();
    mockFindOne.mockReset();
  });

  test("initMessage should return messages for a user", async () => {
    mockFind.mockReturnValue({
      sort: () => ({ limit: () => Promise.resolve([sampleMessage]) }),
    });

    const result = await messageService.initMessage(1);
    expect(result).toEqual([sampleMessage]);
    expect(mockFind).toHaveBeenCalledWith({
      $or: [{ senderID: 1 }, { receiverID: 1 }],
    });
  });

  test("initUserContact should return user contact", async () => {
    mockFindOne.mockResolvedValueOnce(sampleContact);

    const result = await messageService.initUserContact(1);
    expect(result).toEqual(sampleContact);
    expect(mockFindOne).toHaveBeenCalledWith({ userID: 1 });
  });

  test("initUserConversation should return conversations", async () => {
    mockFind.mockResolvedValueOnce([sampleConversation]);

    const result = await messageService.initUserConversation(["1_14"]);
    expect(result).toEqual([sampleConversation]);
    expect(mockFind).toHaveBeenCalledWith({ contactID: { $in: ["1_14"] } });
  });

  test("initMessage throws on error", async () => {
    mockFind.mockImplementationOnce(() => { throw new Error("DB error"); });

    await expect(messageService.initMessage(1)).rejects.toThrow(
      "Fail to initialize the message!"
    );
  });

  test("initUserContact throws on error", async () => {
    mockFindOne.mockImplementationOnce(() => { throw new Error("DB error"); });

    await expect(messageService.initUserContact(1)).rejects.toThrow(
      "Cant get the contact"
    );
  });

  test("initUserConversation throws on error", async () => {
    mockFind.mockImplementationOnce(() => { throw new Error("DB error"); });

    await expect(messageService.initUserConversation(["1_14"])).rejects.toThrow(
      "Error fetching conversations"
    );
  });
});
