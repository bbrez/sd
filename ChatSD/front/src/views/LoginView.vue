<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import router from "@/router";
import { useUserStore } from "@/stores/user";
import send from "@/lib/send";

const userStore = useUserStore();
const { getUser } = storeToRefs(userStore);
const { setUser } = userStore;

const user = ref({ name: "", password: "" });
const formState = ref("clean");
const lastCredentials = ref({ name: "", password: "" });

function reset() {
  user.value.name = "";
  user.value.password = "";
}

function login() {
  let socket = new WebSocket("ws:127.0.0.1:1234");
  socket.onmessage = (msg) => {
    let answ = JSON.parse(msg.data);
    console.log(answ);
    switch (answ.result) {
      case "success":
        reset();
        setUser(answ.data.user);
        router.push({ name: "chat" });
        break;
      default:
        formState.value = answ.result;
        break;
    }
  };

  socket.onopen = (e) => {
    formState.value = "sending";
    console.log("[socket open]");
    lastCredentials.value = {
      name: user.value.name,
      password: user.value.password,
    };

    send(socket, "login", {
      user: {
        name: user.value.name,
        password: user.value.password
      }
    });
  };
}

const formCheck = computed(() => {
  let errors = new Array<string>();
  let nameLen = user.value.name.length;
  let passLen = user.value.password.length;

  if (nameLen < 4 && nameLen > 0) errors.push("short_username");
  if (nameLen > 20) errors.push("long_username");
  if (nameLen == 0) errors.push("empty_username");
  if (passLen < 4 && passLen > 0) errors.push("short_password");
  if (passLen == 0) errors.push("empty_password");

  if (lastCredentials.value.name != user.value.name) formState.value = "clean";
  if (lastCredentials.value.password != user.value.password)
    formState.value = "clean";

  switch (formState.value) {
    case "clean":
      break;
    case "wrong_credentials":
      errors.push("wrong_credentials");
      break;
    default:
      errors.push("state_error");
      break;
  }

  return errors;
});
</script>
<template>
  <div id="page" class="section has-background-light">
    <div class="columns is-vcentered is-centered">
      <div class="column is-half">
        <form class="box">
          <h1 class="title">Login</h1>
          <div class="field">
            <label for="username" class="label">Nome de usuário</label>
            <div class="control">
              <input class="input" :class="{ 'is-danger': formCheck.includes('short_username') }" type="text"
                placeholder="Nome de usuário" v-model="user.name" />
            </div>
            <p v-if="formCheck.includes('short_username')" class="help is-danger">
              Mínimo 4 caracteres
            </p>
            <p v-if="formCheck.includes('long_username')" class="help is-danger">
              Máximo 20 caracteres
            </p>
            <p v-if="formCheck.includes('wrong_credentials')" class="help is-danger">
              Credenciais Incorretas
            </p>
          </div>
          <div class="field">
            <label for="password" class="label">Senha</label>
            <div class="control">
              <input class="input" :class="{ 'is-danger': formCheck.includes('short_password') }" type="password"
                placeholder="Senha" v-model="user.password" />
            </div>
            <p v-if="formCheck.includes('short_password')" class="help is-danger">
              Mínimo 4 caracteres
            </p>
          </div>
          <div class="field is-grouped">
            <div class="control">
              <button class="button is-info" :class="{ 'is-loading': formState == 'sending' }" type="button"
                :disabled="formCheck.length > 0" @click="login()">
                Entrar
              </button>
            </div>
            <div class="control">
              <button class="button is-warning is-light" type="reset" @click="reset()">
                Cancelar
              </button>
            </div>
            <div class="control" style="flex-grow: 1"></div>
            <div class="control">
              <button class="button is-link is-light" type="button" @click="$router.push({ name: 'register' })">
                Registrar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<style scoped>
.section,
.columns {
  height: 100%;
}
</style>
