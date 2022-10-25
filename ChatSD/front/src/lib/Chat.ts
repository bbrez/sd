import type Message from "./Message";
import type User from "./User";
import type userChat from "./userChat";

export default class Chat {
    id!: number;
    name!: string;
    icon!: string;
    users!: Array<userChat>;
    messages!: Array<Message>;

    public constructor(name: string, icon: string) {
        this.name = name;
        this.icon = icon;
        this.users = new Array<userChat>();
        this.messages = new Array<Message>();
    }
}