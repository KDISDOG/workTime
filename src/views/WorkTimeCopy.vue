<template>
    <Teleport to="body">
        <div v-show="deleteModal"
            class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-white rounded-2xl bg-gray-900 w-[200px] h-[150px] flex flex-col gap-6 justify-center items-center">
            <p class="text-white text-2xl">確認刪除?</p>
            <div class="flex gap-5">
                <button @click="handleDelete">確定</button>
                <button @click="deleteModal = false">取消</button>
            </div>
        </div>
    </Teleport>
    <div class="flex flex-col items-center justify-center gap-6">
        <h1 class=" text-2xl font-bold text-center">工時複製 (1個月內)</h1>
        <div class="overflow-y-auto h-[75vh]">
            <table class="table-fixed w-[80vw]">
                <thead class="sticky top-0">
                    <tr class="w-full bg-[#030511]">
                        <th>日期</th>
                        <th>SR</th>
                        <th>PYRD</th>
                        <th>taskId</th>
                        <th>workItem</th>
                        <th>角色</th>
                        <th>花費時間</th>
                        <th>細項</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="w-full text-center p-4 border border-gray-600" v-for="item in workTimeData"
                        :key="item.id" :class="{ 'bg-[#4c5159]': selectedId === item.id }">
                        <td class="px-4">
                            <span v-if="!editItem[item.id]">{{ item.date }}</span>
                            <input class="!p-1 w-32" v-model="editItem[item.id].date" v-else type="date">
                        </td>
                        <td class="px-4">
                            <span v-if="!editItem[item.id]">{{ item.SR }}</span>
                            <input class="!p-1 w-24" v-model="editItem[item.id].SR" v-else type="text">
                        </td>
                        <td class="px-4">
                            <span v-if="!editItem[item.id]">{{ item.pyrd }}</span>
                            <input class="!p-1 w-24" v-model="editItem[item.id].pyrd" v-else type="text">
                        </td>
                        <td class="px-4">
                            <span v-if="!editItem[item.id]">{{ item.taskId }}</span>
                            <input class="!p-1 w-24" v-model="editItem[item.id].taskId" v-else type="text">
                        </td>
                        <td class="px-4">
                            <span v-if="!editItem[item.id]">{{ item.workitem }}</span>
                            <select class="!p-1 w-32" v-model="editItem[item.id].workitem" v-else>
                                <option value="需求發起">需求發起</option>
                                <option value="系統架構設計">系統架構設計</option>
                                <option value="系統開發">系統開發</option>
                                <option value="系統測試驗證">系統測試驗證</option>
                                <option value="產品發佈">產品發佈</option>
                                <option value="產品行銷">產品行銷</option>
                                <option value="產品審查">產品審查</option>
                                <option value="Other">Other</option>
                                <option value="技術研究">技術研究</option>
                                <option value="教育訓練">教育訓練</option>
                                <option value="行政作業">行政作業</option>
                                <option value="部門會議">部門會議</option>
                            </select>
                        </td>
                        <td class="px-4">
                            <span v-if="!editItem[item.id]">{{ item.role }}</span>
                            <select class="!p-1 w-18" v-model="editItem[item.id].role" v-else>
                                <option value="前端">前端</option>
                                <option value="後端">後端</option>
                                <option value="測試">測試</option>
                                <option value="PM">PM</option>
                                <option value="SASD">SASD</option>
                                <option value="UIUX">UIUX</option>
                            </select>
                        </td>
                        <td class="px-4">
                            <span v-if="!editItem[item.id]">{{ item.time }}</span>
                            <input class="!p-1 w-12" v-model="editItem[item.id].time" v-else type="number">
                        </td>
                        <td class="px-4">
                            <span v-if="!editItem[item.id]">{{ item.detail }}</span>
                            <textarea class="!p-1 w-36" v-model="editItem[item.id].detail" v-else></textarea>
                        </td>
                        <td class="px-4">
                            <button v-if="!editItem[item.id]" class="!px-2 !py-1 border cursor-pointer mr-2"
                                @click="handleEdit(item)">編輯</button>
                            <button v-else class="!px-2 !py-1 border cursor-pointer mr-2"
                                @click="cancelEdit(item)">取消</button>
                            <button class="!px-2 !py-1 border cursor-pointer" @click="handleModalPop(item)">刪除</button>
                        </td>
                        <td class="px-4"><button class="px-2 py-1 border cursor-pointer"
                                @click="handleCopy(item)">複製</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <button @click="saveEdit">更新</button>

    </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
const workTimeData = ref([]);
const deleteModal = ref(false);
const pointerItem = ref(null);
const selectedId = ref(null);
const editItem = ref([]);
const getWorkTimeList = () => {
    fetch('/api/getWorkTimeList', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            workTimeData.value = data;
        })
}
const handleDelete = () => {

    fetch('/api/deleteList', {
        method: 'Delete',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: pointerItem.value.id,
        })
    })
        .then(response => response.json())
        .then(data => {
            deleteModal.value = false;
            editItem.value[pointerItem.value.id] = null;
            alert("刪除成功");
            getWorkTimeList();
        })
}
const handleModalPop = (item) => {
    deleteModal.value = true;
    pointerItem.value = item;
}

const handleCopy = async (item) => {

    try {
        await navigator.clipboard.writeText(`${item.taskId},${item.role}\n${item.detail}`);
        selectedId.value = item.id;
    } catch (err) {
        console.error('複製失敗', err);
    }
}
const handleEdit = (item) => {
    editItem.value[item.id] = item;
}
const cancelEdit = (item) => {
    editItem.value[item.id] = null;
}
const saveEdit = () => {
    const cleanData = Object.values(editItem.value).filter(item => item !== undefined);
    fetch('/api/updateWorkTime', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
    })
        .then(res => res.json())
        .then(data => {
            getWorkTimeList();
            editItem.value = [];
            alert("更新成功");
        })
        .catch(err => console.error('更新失敗:', err));
}
onMounted(() => {
    getWorkTimeList()
})


</script>