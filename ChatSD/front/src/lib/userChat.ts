import type Chat from "./Chat";
import type Message from "./Message";
import type User from "./User";

export default class userChat {
    user !: User;
    chat !: Chat;
    messages !: Array<Message>;

    nickname !: string;
    color !: string;
    isAdmin !: boolean;

    id !: number;
    userId !: number;
    chatId !: number;
}