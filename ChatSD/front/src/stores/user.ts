import type User from "@/lib/model/User";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

function loadUser(): User | null {
  const storedUser = localStorage.getItem("user");
  if (storedUser != null) {
    return JSON.parse(storedUser);
  }

  return null;
}

export const useUserStore = defineStore("user", () => {
  const user = ref<User | null>(loadUser());

  const getUser = computed(() => {
    if (user.value == null) user.value = loadUser();
    return user.value;
  });

  function setUser(newUser: User | null) {
    if (newUser == null) {
      user.value = null;
      localStorage.removeItem("user");
    } else {
      user.value = newUser;
      localStorage.setItem("user", JSON.stringify(newUser));
    }
  }

  return { getUser, setUser };
});
