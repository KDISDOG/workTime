<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="flex items-center justify-between p-4 bg-gray-800 gap-6 text-white">
    <h1 class="text-3xl p-1">工時管理系統</h1>
    <nav class="flex gap-3">
      <RouterLink to="/">工時輸入</RouterLink>
      <RouterLink to="/copy">工時複製</RouterLink>
      <RouterLink to="/analyze">工時分析</RouterLink>
    </nav>
  </header>
  <RouterView />


</template>
