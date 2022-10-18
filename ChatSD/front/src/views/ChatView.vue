<script lang="ts">
import Chat from '@/lib/Chat';
import Message from '@/lib/Message';
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            message: "",

            me: { id: 1, name: "Bruno", color: "#0000ff" },

            chats: new Array<Chat>(...[new Chat("SD", "fa-network-wired"),
            new Chat("Leo", "fa-gamepad"),
            new Chat("Alunos", "fa-book")]),

            current_chat: 0,

            socket: new WebSocket("ws:127.0.0.1:1234"),
            timeOptions: { hour12: false },
        }
    },

    methods: {
        sendMessage() {
            if (this.message.length > 0) {
                this.socket.send(JSON.stringify({
                    from: this.me,
                    to: this.chats[this.current_chat],
                    content: this.message,
                    type: "message"
                }));
                this.message = "";
            }
        },

        openOpts() {

        },
    },

    mounted() {
        this.socket.onopen = (e) => {
            console.log("[socket open]");
            this.socket.send(JSON.stringify({ "from": this.me, "type": "connect" }));
        };

        this.socket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            console.log(data);
            if (data.type == "message") {
                this.chats[this.current_chat].addMessage(new Message(data.from, data.content, new Date()));
            }
        }
    },
})
</script>
<template>
    <div class="section">
        <div class="columns">
            <div class="column is-2">
                <div class="field">
                    <a class="button is-info is-fullwidth" @click="openOpts">Opções</a>
                </div>
                <div class="panel is-info">
                    <div class="panel-heading">Chats</div>
                    <a v-for="chat in chats" class="panel-block" type="button">
                        <span class="panel-icon">
                            <i :class="['fa-solid',chat.getIcon()]" aria-hidden="true"></i>
                        </span>
                        {{chat.getName()}}
                    </a>
                </div>
            </div>

            <div class="column">
                <div id="msg-pane" class="box">
                    <div class="block" v-for="mesg of chats[0].getMessages()">
                        [{{mesg.timestamp.toLocaleTimeString([], timeOptions)}}]
                        <b :style="{color: mesg.sender.color}">{{mesg.sender.name}}:</b>
                        {{mesg.content}}
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
    </div>
</template>
<style>
#body {
    height: 100%;
}

#msg-pane {
    height: 100%;
}
</style>