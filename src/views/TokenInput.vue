<template>
    <ToolTips :showState="showState" :state="toolTipState" :content="toolTipText"></ToolTips>
    <div class="flex flex-col items-center justify-center gap-6 px-4 py-6">
        <h1 class=" text-2xl font-bold">Clickup Token 輸入</h1>
        <input class="w-1/4" type="text" name="token" v-model="token" placeholder="輸入Clickup Token">
        <button @click="handleRecord" type="submit">紀錄</button>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ToolTips from '../components/ToolTips.vue';
const toolTipState = ref(false);
const toolTipText = ref('');
const showState = ref(0);
const token = ref('');
const handleRecord = async () => {
    await fetch('/api/saveToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: token.value
        })
    })
        .then(res => {
            if (res.status == 200) {
                toolTipText.value = 'Token已紀錄';
                toolTipState.value = true;
                showState.value++;
            } else {
                toolTipText.value = 'Token紀錄失敗';
                toolTipState.value = false;
                showState.value++;
            }
        })

}

const getToken = async () => {
    await fetch('/api/getToken', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.token) token.value = data.token;
        })
}

onMounted(() => {
    getToken();
})
</script>

<style lang="scss" scoped></style>