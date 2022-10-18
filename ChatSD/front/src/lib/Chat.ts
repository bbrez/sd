import type Message from "./Message";
import type User from "./User";

export default class Chat {
    private name!: string;
    private icon!: string;
    private users!: Array<User>;
    private messages!: Array<Message>;

    public constructor(name: string, icon: string) {
        this.name = name;
        this.icon = icon;
        this.users = new Array<User>();
        this.messages = new Array<Message>();
    }

    public getName() {
        return this.name;
    }

    public getIcon() {
        return this.icon;
    }

    public getUsers() {
        return this.users;
    }

    public addUser(user: User) {
        this.users.push(user);
    }

    public getMessages() {
        return this.messages;
    }

    public addMessage(message: Message) {
        this.messages.push(message);
    }
}