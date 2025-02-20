<template>
  <div class="flex flex-col items-center justify-center gap-6">
    <h1 class=" text-2xl font-bold">工時輸入</h1>
    <form class="flex flex-col items-center justify-center gap-2">
      <label for="date">日期:</label>
      <input type="date" name="date" v-model="formData.date" placeholder="時間">
      <label for="SR">SR:</label>
      <input type="text" name="SR" v-model="formData.SR" placeholder="3碼">
      <label for="PYRD">PYRD:</label>
      <input type="text" name="PYRD" v-model="formData.pyrd" placeholder="4碼">
      <label for="taskId">taskId:</label>
      <input type="text" name="taskId" v-model="formData.taskId" placeholder="taskId">
      <label for="workItem">workItem:</label>
      <select name="workItem" v-model="formData.workitem">
        <option value="需求發起">a.需求發起</option>
        <option value="系統架構設計">b.系統架構設計</option>
        <option value="系統開發">c.系統開發</option>
        <option value="系統測試驗證">d.系統測試驗證</option>
        <option value="產品發佈">e.產品發佈</option>
        <option value="產品行銷">f.產品行銷</option>
        <option value="產品審查">g.產品審查</option>
        <option value="Other">h.Other</option>
        <option value="技術研究">技術研究</option>
        <option value="教育訓練">教育訓練</option>
        <option value="行政作業">行政作業</option>
        <option value="部門會議">部門會議</option>
      </select>
      <label for="role">角色:</label>
      <select name="role" v-model="formData.role">
        <option value="前端">前端</option>
        <option value="後端">後端</option>
        <option value="測試">測試</option>
        <option value="PM">PM</option>
        <option value="SASD">SASD</option>
        <option value="UIUX">UIUX</option>
      </select>
      <label for="time">工時:</label>
      <input type="number" name="time" v-model="formData.time" placeholder="工時">
      <label for="time">細項:</label>
      <textarea type="text" name="time" v-model="formData.detail" placeholder="1.XXXX"></textarea>
    </form>
    <div class="flex gap-6">
      <button @click="handleRecord" type="submit">紀錄</button>
      <button @click="handleClear">清除</button>
    </div>


  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0'); // 月份從 0 開始，所以要 +1
const dd = String(today.getDate()).padStart(2, '0');

const formattedDate = `${yyyy}-${mm}-${dd}`;
const defaultData = {
  date: formattedDate,
  SR: '',
  pyrd: '',
  taskId: '',
  workitem: '系統開發',
  role: '前端',
  time: '',
  detail: '1.'
}

const formData = reactive({
  ...defaultData
})

const handleRecord = () => {
  console.log('record')
  fetch('../api/workTime', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
    .then(res => res.json())
    .then(data => {
      alert("紀錄成功")
      formData.PYRD = '';
      formData.SR = '';
      formData.time = '';
      formData.taskId = '';
      formData.detail = '1.';
    })
    .catch(err => {
      alert(`記錄失敗，${err}`)
    })
}

const handleClear = () => {
  Object.assign(formData, defaultData)
}
</script>