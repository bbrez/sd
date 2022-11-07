<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user";
import Chat from "@/lib/model/Chat";
import Message from "@/lib/model/Message";
import type userChat from "@/lib/model/userChat";
import UserModal from "../components/OptionsModal.vue";
import send from "@/lib/send";
import router from "@/router";

const userStore = useUserStore();
const { getUser } = storeToRefs(userStore);
const { setUser } = userStore;

const addMode = ref(false);
const removeMode = ref(false);
const newUserName = ref("");
const status = ref("clean");

const message = ref("");
const current_chat = ref(0);

const socket = new WebSocket("ws:127.0.0.1:1234");

const timeOptions = { hour12: false, timeStyle: "short" };
const showModal = ref(false);

function sair() {
  localStorage.removeItem("user");
  setUser(null);
  router.push({ name: "login" });
}

function change_chat(uc: userChat) {
  if (getUser.value == null) return;
  current_chat.value = getUser.value.chats.findIndex(
    (c) => c.chat.name == uc.chat.name
  );

  send(socket, "connected_users", {
    chat: getUser.value.chats[current_chat.value].chatId
  });
}

function sendMessage() {
  if (getUser.value == null) return;
  let chat = getUser.value.chats[current_chat.value];

  if (message.value.length > 0) {
    send(socket, "message", {
      user: chat.id,
      chat: chat.chatId,
      content: message.value,
    });
    message.value = "";
  }
}

function newChat() {
  if (getUser.value == null) return;

  let userchat = {
    user: getUser.value,
    chat: new Chat("Novo chat", "fa-circle"),
    messages: new Array<Message>(),
    nickname: getUser.value.name,
    color: "#000000",
    isOnline: false,
    isAdmin: true,
    id: 0,
    userId: 0,
    chatId: 0,
  };

  userchat.chat.users.push(userchat);

  send(socket, "new_chat", {
    chat: {
      ...getUser.value.chats[current_chat.value].chat,
      messages: undefined,
      users: [
        {
          ...getUser.value,
          chats: undefined,
        },
      ],
    },
  });
}

function addUser() {
  if (getUser.value == null) return;
  if (newUserName.value.length < 4) return;

  send(socket, "add_user", {
    userName: newUserName.value,
    chat: getUser.value.chats[current_chat.value].chatId,
  });
}

function removeUser(uc: userChat) {
  if (getUser.value == null) return;
  if (!removeMode.value) return;

  send(socket, "remove_user", {
    admin: getUser.value.chats[current_chat.value].id,
    remove: uc.id,
  });
}

onMounted(() => {
  if (getUser.value == null) return;
  if (getUser.value.chats == null) getUser.value.chats = [];

  if (localStorage.getItem("user") == null)
    localStorage.setItem("user", JSON.stringify(getUser));
  userStore.$subscribe((mutation, state) => {
    localStorage.setItem("user", JSON.stringify(state));
  });

  socket.onopen = (e) => {
    console.log("[socket open]");
    send(socket, "connect", {
      user: {
        ...getUser.value,
        chats: undefined,
        password: undefined,
      },
    },
    );
  };

  socket.onclose = (e) => {
    console.log("[socket closed]");
  };

  //Socket messages
  socket.onmessage = (e) => {
    if (getUser.value == null) return;

    let answer = JSON.parse(e.data);
    let data = answer.data;
    console.log(answer);

    if (answer.result == "error") {
      console.error("Server error ocurred");
      status.value = data.error;
      return;
    }

    switch (answer.type) {
      case "connect": {
        getUser.value.chats = data.chats;
        send(socket, "connected_users", {
          chat: getUser.value.chats[current_chat.value].chatId,
        })
        break;
      }

      case "connected_users": {
        for (let u of getUser.value.chats[current_chat.value].chat.users) {
          u.isOnline = Array.from(data.online).findIndex((uid) => u.userId == uid) != -1;
        }

        break;
      }

      case "new_chat": {

        getUser.value.chats.unshift(data.chat);
        current_chat.value += 1;

        break;
      }

      case "message": {
        let uc = getUser.value.chats.findIndex((c) => c.chatId == data.to);
        if (uc == -1) return;
        let sender = getUser.value.chats[uc].chat.users.findIndex(
          (user) => user.id == data.from
        );
        if (sender == -1) return;
        console.log(getUser.value.chats[uc].chat.messages);
        getUser.value.chats[uc].chat.messages.push(
          new Message(
            getUser.value.chats[uc].chat.users[sender],
            data.content,
            data.when
          )
        );
        break;
      }

      case "add_user": {
        let chat = getUser.value.chats.find(
          (c) => c.chat.id == data.user.chatId
        );
        chat?.chat.users.push(data.user);
        break;
      }

      case "remove_user": {
        if (data.user.userId == getUser.value.id) {
          getUser.value.chats = getUser.value.chats.filter((uc) => {
            uc.id != data.removed.chatId;
          });
        } else {
          for (let uc of getUser.value.chats) {
            if (uc.chatId == data.removed.chatId) {
              uc.chat.users = uc.chat.users.filter((cuc) => {
                cuc.id != data.removed.id;
              });
            }
          }
        }

        break;
      }

      case "user_update": {
        if (data.user.userId == getUser.value.id) {
          for (let uc of getUser.value.chats) {
            if (uc.chatId == data.user.chatId) {
              uc.nickname = data.user.nickname;
              uc.color = data.user.color;
            }
          }
        } else {
          for (let uc of getUser.value.chats) {
            if (uc.chatId == data.user.chatId) {
              for (let user of uc.chat.users) {
                if (user.id == data.user.id) {
                  user.nickname = data.user.nickname;
                  user.color = data.user.color;
                }
              }
            }
          }
        }

        break;
      }

      case "chat_update": {
        for (let uc of getUser.value.chats) {
          if (uc.chatId == data.chat.id) {
            uc.chat.name = data.chat.name;
            uc.chat.icon = data.chat.icon;
          }
        }

        break;
      }
    }
  };
});

onUnmounted(() => {
  socket.close();
});
</script>
<template>
  <div class="section">
    <div class="columns">
      <div class="column is-2">
        <div v-if="getUser != null && getUser.chats != null && getUser.chats.length > 0" class="field">
          <a class="button is-info is-fullwidth" @click="showModal = true">
            <span class="icon"><i class="fa-solid fa-gears"></i></span>
            <span>Opções</span>
          </a>
        </div>
        <div class="panel is-info">
          <div class="panel-heading">
            <span class="icon"><i class="fa-solid fa-message"></i></span>
            <span> Chats</span>
          </div>
          <a class="panel-block">
            <button class="button is-info is-outlined is-fullwidth" @click="newChat()">
              <span class="icon"><i class="fa-solid fa-plus"></i></span>
              <span>Novo Chat</span>
            </button>
          </a>
          <a v-if="getUser != null" v-for="uc in getUser.chats" class="panel-block" @click="change_chat(uc)">
            <span class="panel-icon">
              <i :class="['fa-solid', uc.chat.icon]" aria-hidden="true"></i>
            </span>
            {{ uc.chat.name }}
          </a>
        </div>
        <div class="control">
          <button class="button is-danger is-fullwidth" @click="sair()">Sair</button>
        </div>
      </div>

      <div v-if="getUser != null && getUser.chats != null && getUser.chats.length > 0" class="column">
        <div class="message is-info">
          <div class="message-header">
            <p>
              <span class="icon"><i :class="['fa-solid', getUser.chats[current_chat].chat.icon]"></i></span>
              {{ getUser.chats[current_chat].chat.name }}
            </p>
          </div>
          <div id="msg-pane" class="message-body">
            <div class="block" v-for="mesg of getUser.chats[current_chat].chat.messages">
              [{{ new Date(mesg.timestamp).toLocaleString([], timeOptions) }}]
              <b :style="{ color: mesg.from.color }">{{ mesg.from.nickname }}:</b>
              <span class="ml-1" :style="{ color: mesg.from.color }">
                {{ mesg.content }}
              </span>
            </div>
          </div>
          <div class="field has-addons">
            <p class="control is-expanded">
              <input class="input is-info" type="text" v-model="message" placeholder="Type Here..."
                @keydown.enter="sendMessage" />
            </p>
            <p class="control">
              <a class="button is-info" @click="sendMessage">Send</a>
            </p>
          </div>
        </div>
      </div>

      <div v-if="getUser != null && getUser.chats != null && getUser.chats.length > 0" class="column is-2">
        <div v-if="getUser.chats[current_chat].isAdmin" class="field">
          <div v-if="!addMode">
            <a class="button is-info is-fullwidth" @click="addMode = true">
              <span class="icon"><i class="fa-solid fa-user-plus"></i></span>
              <span>Adicionar Usuário</span>
            </a>
          </div>
          <div v-else class="box">
            <div class="field">
              <label class="label">Nome do Usuário:</label>
              <div class="control">
                <input class="input" v-model="newUserName" />
                <p v-if="status == 'user_not_found'" class="help is-danger">
                  Usuário não encontrado
                </p>
              </div>
            </div>
            <div class="field is-grouped">
              <div class="control">
                <button class="button is-primary" @click="addUser()" :disabled="newUserName.length < 4">
                  Adicionar
                </button>
              </div>
              <div class="control" style="flex-grow: 1"></div>
              <div class="control">
                <button class="button is-danger" @click="addMode = false; newUserName = ''">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="getUser.chats[current_chat].chat.users.length > 0" class="panel"
          :class="removeMode ? 'is-danger' : 'is-info'">
          <div class="panel-heading">
            <span class="icon"><i class="fa-solid" :class="removeMode ? 'fa-user-minus' : 'fa-users'"></i></span>
            <span> Usuários</span>
          </div>
          <a v-for="c_user in getUser.chats[current_chat].chat.users" class="panel-block" @click="removeUser(c_user)">
            <span class="panel-icon" :style="{ color: c_user.isOnline ? '#00cc00' : '#cc0000' }"><i class="fa-solid"
                :class="c_user.isAdmin ? 'fa-star' : 'fa-user'"></i></span>
            <span>{{ c_user.nickname }}</span>
          </a>
        </div>
        <div v-if="getUser.chats[current_chat].isAdmin" class="field">
          <button class="button is-danger is-fullwidth" @click="removeMode = !removeMode">
            <span class="icon"><i class="fa-solid" :class="removeMode ? 'fa-arrow-left' : 'fa-user-minus'"></i></span>
            <p>{{ removeMode ? "Voltar" : "Remover Usuários" }}</p>
          </button>
        </div>
      </div>
    </div>
  </div>
  <UserModal v-if="getUser != null && getUser.chats != null && getUser.chats.length" :show="showModal"
    @close="showModal = false" :current-chat="current_chat" :socket="socket"></UserModal>
</template>
<style>
.section {
  max-height: 100%;
}

#msg-pane {
  height: 80vh;
  overflow-y: auto;
}
</style>
