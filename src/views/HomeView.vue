<template>
  <div class="flex flex-col items-center justify-center gap-6">
    <h1 class=" text-2xl">工時輸入</h1>
    <form class="flex flex-col items-center justify-center gap-2">
      <label for="date">日期:</label>
      <input type="date" name="date" v-model="formData.date" placeholder="時間">
      <label for="SR">SR:</label>
      <input type="text" name="SR" v-model="formData.SR" placeholder="SR">
      <label for="PYRD">PYRD:</label>
      <input type="text" name="PYRD" v-model="formData.PYRD" placeholder="PYRD">
      <label for="workItem">workItem:</label>
      <select name="workItem" v-model="formData.workItem">
        <option value="需求發起">需求發起</option>
        <option value="系統架構設計">系統架構設計</option>
        <option value="系統開發">系統開發</option>
        <option value="系統測試驗證">系統測試驗證</option>
        <option value="系統測試驗證">project4</option>
      </select>
      <label for="role">角色:</label>
      <select name="role" v-model="formData.role">
        <option value="前端">前端</option>
        <option value="後端">後端</option>
        <option value="PM">PM</option>
        <option value="SASD">SASD</option>
        <option value="UIUX">UIUX</option>
      </select>
      <label for="time">工時:</label>
      <input type="number" name="time" v-model="formData.time" placeholder="工時">
    </form>
    <div class="flex gap-6">
      <button @click="handleRecord" type="submit"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">紀錄</button>
      <button class="border-amber-50 border hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        @click="handleClear">清除</button>
    </div>


  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'

const defaultData = {
  date: new Date().toISOString().substr(0, 10),
  SR: '',
  PYRD: '',
  workItem: '系統開發',
  role: '前端',
  time: ''
}

const formData = reactive({
  ...defaultData
})

const handleRecord = () => {
  console.log('record')
  fetch('http://localhost:3000/api/workTime', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
    .then(res => res.json())
    .then(data => {
      alert("紀錄成功")
    })
    .catch(err => {
      console.error(err)
    })
}

const handleClear = () => {
  console.log('clear')
  Object.assign(formData, defaultData)
}
</script>