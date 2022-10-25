<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    props: {
        show: Boolean,
    },

    emits: ["close"],
});
</script>

<template>
    <div v-if="show" class="modal" :class="show ? 'is-active' : ''">
        <div class="modal-background" @click="$emit('close')"></div>
        <div class="modal-content">
            <slot />
        </div>
        <button class="modal-close is-large" @click="$emit('close')"></button>
    </div>
</template>
