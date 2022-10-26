import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/chat",
      name: "chat",
      component: () => import("../views/ChatView.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
    },
  ],
});

router.beforeEach(async (to, from) => {
  const store = useUserStore();
  const { getUser } = storeToRefs(store);
  if (getUser.value != null && to.name != "chat") return { name: "chat" };
  if (getUser.value == null && to.name == "chat") return { name: "login" };
  else return true;
});

export default router;
