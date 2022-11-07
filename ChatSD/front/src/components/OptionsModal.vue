<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import router from "@/router";
import { useUserStore } from "@/stores/user";
import User from "@/lib/model/User";
import SimpleModal from "./SimpleModal.vue";

defineEmits(["close"]);
const props = defineProps({
    show: Boolean,
    currentChat: {
        type: Number,
        required: true,
    },

    socket: {
        type: WebSocket,
        required: true,
    },
});

const userStore = useUserStore();
const { getUser } = storeToRefs(userStore);
const { setUser } = userStore;

const new_nick = ref("");
if (getUser.value == null) getUser.value = new User();
new_nick.value = getUser.value.chats[props.currentChat].nickname;

const new_color = ref("");
new_color.value = getUser.value.chats[props.currentChat].color;

const new_chat_name = ref("");
new_chat_name.value = getUser.value.chats[props.currentChat].chat.name;

const new_chat_icon = ref("");
new_chat_icon.value = getUser.value.chats[props.currentChat].chat.icon;

function update_chat() {
    if (getUser.value == null) return;

    props.socket.send(
        JSON.stringify({
            type: "chat_update",
            chat: {
                id: getUser.value.chats[props.currentChat].chatId,
                admin: getUser.value.chats[props.currentChat].id,
                name: new_chat_name.value,
                icon: new_chat_icon.value,
            },
        })
    );
}

function update_user() {
    if (getUser.value == null) return;
    props.socket.send(
        JSON.stringify({
            type: "user_update",
            user: {
                id: getUser.value.chats[props.currentChat].id,
                nickname: new_nick.value,
                color: new_color.value,
            },
        })
    );
}

function update() {
    if (getUser.value == null) return;
    if (
        new_nick.value != getUser.value.chats[props.currentChat].nickname ||
        new_color.value != getUser.value.chats[props.currentChat].color
    ) {
        update_user();
    }

    if (
        new_chat_name.value != getUser.value.chats[props.currentChat].chat.name ||
        new_chat_name.value != getUser.value.chats[props.currentChat].chat.icon
    ) {
        update_chat();
    }
}
</script>
<template>
    <SimpleModal v-if="getUser != null" :show="show" @close="$emit('close')">
        <div class="card">
            <div class="card-header">
                <h1 class="card-header-title">Opções</h1>
            </div>
            <div class="card-content">
                <div class="field">
                    <label class="label">Apelido:</label>
                    <div class="control">
                        <input class="input" v-model="new_nick" />
                    </div>
                </div>
                <div class="field">
                    <label class="label">Cor:</label>
                    <div class="control">
                        <input class="input" type="color" v-model="new_color" />
                    </div>
                </div>
                <div class="field" v-if="
                    getUser.chats[currentChat] != null &&
                    getUser.chats[currentChat].isAdmin
                ">
                    <div class="field">
                        <label class="label">Nome do Chat:</label>
                        <div class="control">
                            <input class="input" v-model="new_chat_name" />
                        </div>
                    </div>
                    <div class="field">
                        <label class="label">Icone do chat:</label>
                        <div class="control has-icons-left">
                            <input class="input" v-model="new_chat_icon" />
                            <span class="icon is-small is-left">
                                <i :class="['fa-solid', new_chat_icon]"></i>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="field is-grouped">
                    <div class="control">
                        <button class="button is-primary" @click="update()">Salvar</button>
                    </div>
                    <div class="control" style="flex-grow: 1"></div>
                    <div class="control">
                        <button class="button is-light is-warning" @click="$emit('close')">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </SimpleModal>
</template>
