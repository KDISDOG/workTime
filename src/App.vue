<script setup>
import { RouterLink, RouterView, useRoute } from "vue-router";
const router = useRoute();
</script>

<template>
    <header class="flex items-center justify-between p-4 bg-gray-800 gap-6 text-white">
        <div class="flex items-center gap-3">
            <img class="w-20" src="/51121.gif" alt="" />
            <h1 class="text-3xl p-1">工時管理系統</h1>
        </div>
        <nav class="flex gap-6">
            <RouterLink to="/">
                <span :class="{ 'border-b-2 border-white': router.path == '/' }">工時輸入</span>
            </RouterLink>
            <RouterLink to="/Copy">
                <span :class="{ 'border-b-2 border-white': router.path == '/Copy' }">工時複製</span>
            </RouterLink>
            <RouterLink to="/Analyze">
                <span :class="{ 'border-b-2 border-white': router.path == '/Analyze' }">工時報表</span>
            </RouterLink>
            <RouterLink to="/Token">
                <span :class="{ 'border-b-2 border-white': router.path == '/Token' }">token 輸入</span>
            </RouterLink>
        </nav>
    </header>
    <router-view v-slot="{ Component }">
        <KeepAlive include="home">
            <component :is="Component" />
        </KeepAlive>
    </router-view>
</template>
