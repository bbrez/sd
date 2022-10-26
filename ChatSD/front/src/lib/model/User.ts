import type userChat from "./userChat";

export default class User {
  id!: number;
  name!: string;
  password!: string;
  chats!: Array<userChat>;
}
