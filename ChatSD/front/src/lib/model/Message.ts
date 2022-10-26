import type Chat from "./Chat";
import type userChat from "./userChat";

export default class Message {
  id!: number;
  from!: userChat;
  to!: Chat;

  content!: string;
  timestamp!: Date;

  userChatId!: number;
  chatId!: number;

  public constructor(from: userChat, content: string, timestamp: Date) {
    this.from = from;
    this.content = content;
    this.timestamp = timestamp;
  }
}
