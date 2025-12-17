<template>
    <ToolTips :showState="showState" :state="toolTipState" :content="toolTipText"></ToolTips>
    <div class="flex flex-col items-center justify-center gap-6 px-4 py-6">
        <h1 class="text-2xl font-bold">Clickup Token 輸入</h1>
        <input class="w-1/4" type="text" name="token" v-model="token" placeholder="輸入Clickup Token" />
        <button class="button1" @click="handleRecord" type="submit">紀錄</button>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import ToolTips from "../components/ToolTips.vue";
import axios from "axios";
const toolTipState = ref(false);
const toolTipText = ref("");
const showState = ref(0);
const token = ref("");
const handleRecord = async () => {
    try {
        const res = await axios.post("/api/token/saveToken", {
            token: token.value,
        });
        if (res.status === 200) {
            toolTipText.value = "Token已紀錄";
            toolTipState.value = true;
            showState.value++;
        } else {
            toolTipText.value = "Token紀錄失敗";
            toolTipState.value = false;
            showState.value++;
        }
    } catch (error) {
        toolTipText.value = "Token紀錄失敗";
        toolTipState.value = false;
        showState.value++;
    }
};

const getToken = async () => {
    try {
        const res = await axios.get("/api/token/getToken");
        if (res.data && res.data.token) {
            token.value = res.data.token;
        }
    } catch (error) {
        // handle error if needed
    }
};

onMounted(() => {
    getToken();
});
</script>

<style lang="scss" scoped></style>
