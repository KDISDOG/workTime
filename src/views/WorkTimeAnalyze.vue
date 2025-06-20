<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <h2 class="text-2xl font-bold text-white mb-6 text-center">工時報表</h2>

    <!-- 載入指示器 -->
    <div v-if="isLoading" class="flex justify-center items-center h-40">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <span class="ml-3 text-white">載入中，請稍候...</span>
    </div>

    <!-- 錯誤提示 -->
    <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
      <p>{{ error }}</p>
    </div>

    <!-- PYRD層級 -->
    <div v-else class="space-y-10">
      <div v-for="pyrdItem in pyrdList" :key="pyrdItem.pyrd"
        class="space-y-6 bg-[#8fa7cc] shadow-lg rounded-lg overflow-hidden">
        <div class="bg-gray-900 text-white px-6 py-4">
          <h3 class="text-xl font-bold flex justify-between items-center">
            <span>PYRD: {{ pyrdItem.pyrd || '無' }}</span>
            <ChevronDownIcon class="size-6" v-if="!showStatus[pyrdItem.pyrd]" @click="showSR(pyrdItem.pyrd)">
            </ChevronDownIcon>
            <ChevronUpIcon class="size-6" v-else @click="showSR(pyrdItem.pyrd)"></ChevronUpIcon>
          </h3>
        </div>

        <!-- SR層級 -->
        <div v-show="showStatus[pyrdItem.pyrd]" v-for="srItem in objectToArray(pyrdItem.srGroups)" :key="srItem.SR"
          class="mx-4 mb-6 bg-gray-50 rounded-md overflow-hidden shadow">
          <div class="bg-[#303b58] text-white px-5 py-5 flex justify-between items-center">
            <h4 class="font-semibold">SR: {{ srItem.SR }}</h4>
            <div class="flex items-center gap-3">
              <span class="bg-blue-500 px-2 py-0.5 rounded text-sm">總時間: {{ srItem.totalTime }} h</span>
              <ChevronDownIcon class="size-6" v-if="!showStatus[srItem.SR]" @click="showSR(srItem.SR)">
              </ChevronDownIcon>
              <ChevronUpIcon class="size-6" v-else @click="showSR(srItem.SR)"></ChevronUpIcon>
            </div>
          </div>

          <!-- TaskId層級 -->
          <div v-show="showStatus[srItem.SR]" v-for="taskItem in objectToArray(srItem.taskGroups)"
            :key="taskItem.taskId" class="mt-3 mb-5 mx-3">
            <div
              class="bg-[#afc4dc] px-4 py-2 rounded-t-md border-l-4 border-[#8ba1cb] flex justify-between items-center">
              <h5 class="font-bold text-[#505887]">任務ID: {{ taskItem.taskId + taskItem.taskname }}</h5>
              <div class="flex items-center gap-3 min-w-[400px]">
                <span class="flex-1 text-nowrap text-sm font-bold text-[#68748d]">最低工時: {{ isOverdue(taskItem.limitTime)
                  || '沒資料'
                }}</span>
                <span class="flex-1 text-nowrap text-sm font-extrabold text-[#505887]">目前工時: {{ taskItem.totalTime ||
                  '沒資料'
                }}</span>
                <span class="flex-1 text-nowrap text-sm font-bold text-[#ad6666]">限制工時: {{ taskItem.limitTime || '沒資料'
                }}</span>
                <ChevronDownIcon class="size-6 text-black" v-if="!showStatus[taskItem.taskId]"
                  @click="showSR(taskItem.taskId)">
                </ChevronDownIcon>
                <ChevronUpIcon class="size-6 text-black" v-else @click="showSR(taskItem.taskId)"></ChevronUpIcon>
              </div>
            </div>

            <!-- 詳細記錄表 -->
            <div v-show="showStatus[taskItem.taskId]" class="overflow-x-auto rounded-b-md border border-gray-200">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工作項目</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="record in taskItem.records" :key="record.id" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ record.date }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ record.role }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ record.workitem || '無' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ record.time }} h</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/solid';
// 數據狀態
const timeData = ref(null);
const isLoading = ref(true);
const error = ref(null);
const showStatus = ref([]);
// 計算屬性 - 轉換為數組以便使用v-for
const pyrdList = computed(() => {
  if (!timeData.value || !timeData.value.hierarchyData) return [];
  return Object.values(timeData.value.hierarchyData);
});

// 計算差幾小就紅標
const isOverdue = (limitTime) => {
  const rate = limitTimeRule(limitTime);
  return (limitTime / rate).toFixed(1);
};

// 倍率規則
const limitTimeRule = (time) => {
  if (time <= 8) {
    return 4;
  }
  if (time > 8 && time <= 24) {
    return 3.5;
  }
  if (time > 24 && time <= 40) {
    return 3;
  }
  if (time > 40 && time <= 120) {
    return 2;
  }
  if (time > 120 && time <= 240) {
    return 1.75;
  }
  if (time > 240) {
    return 1.5;
  }
}

const showSR = (key) => {
  showStatus.value[key] = !showStatus.value[key];
};
// 獲取數據
const fetchTimeReport = async () => {
  try {
    isLoading.value = true;
    const response = await fetch('/api/worktime/timeReport');
    if (!response.ok) {
      throw new Error('伺服器回應錯誤: ' + response.status);
    }
    timeData.value = await response.json();
  } catch (err) {
    error.value = '獲取資料失敗: ' + err.message;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};




// 生命週期鉤子
onMounted(() => {
  fetchTimeReport();
});

// 從對象轉為數組的輔助函數
const objectToArray = (obj) => Object.values(obj || {});
</script>