import { ref } from "vue";
import { defineStore } from "pinia";
import type Chat from "@/lib/Chat";

export const useChatsStore = defineStore("chats", () => {
    const chats = ref(new Array<Chat>());

    function addChat(chat: Chat) {
        chats.value.concat(chat);
    }

    function get(name: string): Chat | undefined {
        return chats.value.find((c) => c.name == name);
    }

    return { chats, addChat, get };
})