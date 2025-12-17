<template>
    <div v-if="showState" class="fixed inset-0 bg-black/30 flex items-center justify-center z-20">
        <div class="rounded-lg shadow-lg min-w-[300px] animate-fadeIn" :style="{ width }">
            <header class="flex rounded-t-lg justify-center items-center px-4 py-3 border-b bg-slate-900">
                <slot name="header">
                    <h3 class="text-lg font-semibold">{{ title }}</h3>
                </slot>
            </header>
            <section class="px-6 bg-white text-gray-900 py-6">
                <slot name="body">
                    {{ message }}
                </slot>
            </section>
            <footer class="flex rounded-b-lg justify-center gap-8 px-4 py-3 border-t bg-gray-50">
                <slot name="footer">
                    <button class="button1" @click="confirm">確定</button>
                    <button class="buttonCancel" @click="close">取消</button>
                </slot>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
    showState: { type: Boolean, default: false },
    title: { type: String, default: "確認" },
    message: { type: String, default: "" },
    width: { type: String, default: "300px" },
});

const emit = defineEmits(["close", "confirm"]);

function close() {
    emit("close", false);
}
function confirm() {
    emit("confirm");
}
</script>

<style scoped>
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.2s;
}
</style>
