<script setup lang="ts">
import { computed, ref } from 'vue';
import router from '@/router';


const user = ref({ name: "", password: "" });
const formState = ref("clean");

function reset() {
  user.value.name = "";
  user.value.password = "";
  formState.value = "clean";
}

function register() {
  if (user.value.name.length < 4) return;
  if (user.value.password.length < 4) return;

  let socket = new WebSocket("ws:127.0.0.1:1234");
  socket.onmessage = (msg) => {
    let answ = JSON.parse(msg.data);
    switch (answ.result) {
      case 'success':
        reset();
        router.push({ name: 'login' });
        break;
      case 'error':
        formState.value = 'error';
        break;
      default:
        console.log('wtf?');
    }
  };

  socket.onopen = (e) => {
    formState.value = "sending";
    console.log("[socket open]");
    socket.send(JSON.stringify({
      type: "register",
      user: { name: user.value.name, password: user.value.password }
    }))
  };
}

const formCheck = computed(() => {
  let errors = new Array<string>;
  let nameLen = user.value.name.length;
  let passLen = user.value.password.length;

  if (nameLen < 4 && nameLen > 0) errors.push("short_username");
  if (nameLen > 20) errors.push("long_username");
  if (nameLen == 0) errors.push("empty_username");
  if (passLen < 4 && passLen > 0) errors.push("short_password");
  if (passLen == 0) errors.push("empty_password");

  switch (formState.value) {
    case 'clean': break;
    case 'error': errors.push('taken_username'); break;
    default: errors.push('state_error'); break;
  }

  return errors;
});
</script>
<template>
  <div id="page" class="section has-background-light">
    <div class="columns is-vcentered is-centered">
      <div class="column is-half">
        <form class="box">
          <h1 class="title">Registro</h1>
          <div class="field">
            <label for="username" class="label">Nome de usuário</label>
            <div class="control">
              <input class="input"
                :class="{ 'is-danger': ['taken_username', 'short_username'].every((error) => formCheck.includes(error)) }"
                type="text" placeholder="Nome de usuário" v-model="user.name" />
            </div>
            <p v-if="formCheck.includes('taken_username')" class="help is-danger">Usuário já existente</p>
            <p v-if="formCheck.includes('short_username')" class="help is-danger">Mínimo 4 caracteres</p>
            <p v-if="formCheck.includes('long_username')" class="help is-danger">Máximo 20 caracteres</p>
          </div>
          <div class="field">
            <label for="password" class="label">Senha</label>
            <div class="control">
              <input class="input" :class="{ 'is-danger': formCheck.includes('short_password') }" type="password"
                placeholder="Senha" v-model="user.password">
            </div>
            <p v-if="formCheck.includes('short_password')" class="help is-danger">Mínimo 4 caracteres</p>
          </div>
          <div class="field is-grouped">
            <div class="control">
              <button class="button is-info" :class="{ 'is-loading': formState == 'sending' }" type="button"
                :disabled="formCheck.length > 0" @click="register()">Registrar</button>
            </div>
            <div class="control">
              <button class="button is-warning is-light" type="reset" @click="reset()">Cancelar</button>
            </div>
            <div class="control" style="flex-grow: 1"></div>
            <div class="control">
              <button class="button is-link is-light" type="button"
                @click="$router.push({ name: 'login' })">Login</button>
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