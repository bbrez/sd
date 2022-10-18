import type User from "./User";

export default class Message {
    sender !: User;
    content !: string;
    timestamp !: Date;

    public constructor(sender: User, content: string, timestamp: Date) {
        this.sender = sender;
        this.content = content;
        this.timestamp = timestamp;
    }
}