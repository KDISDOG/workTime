<template>
    <Transition name="fade" appear>
        <div v-if="show" class="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-100">
            <div :class="props.state ? 'bg-green-500' : 'bg-red-500'"
                class="flex gap-2 text-white px-6 py-2 rounded-md">
                <component :is="props.state ? CheckCircleIcon : XCircleIcon" class="size-6"></component>
                <p>{{ props.content }}</p>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { XCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid';

const props = defineProps({
    state: {
        type: Boolean,
        required: true
    },
    showState: {
        type: Number,
        required: true
    },
    content: String
});

const show = ref(false);
let lastAnim;
watch(() => props.showState, (newVal) => {
    if (lastAnim) {
        clearTimeout(lastAnim);
    }
    show.value = true;
    //確保計時器內部運行時 props.showState 會回歸 false
    lastAnim = setTimeout(() => {
        show.value = false;
    }, 1500);
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
