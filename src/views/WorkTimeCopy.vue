<template>
    <ToolTips :showState="showState" :state="toolTipState" :content="toolTipText"></ToolTips>
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
    <div class="flex flex-col items-center justify-center gap-6 px-4 py-6">
        <h1 class=" text-2xl font-bold text-center">工時複製 (1個月內)</h1>
        <div class="overflow-y-auto h-[70vh]">
            <table class="table-auto w-[85vw]">
                <thead class="sticky top-0">
                    <tr class="w-full bg-[#030511]">
                        <th class="py-2">日期</th>
                        <th class="py-2">PYRD</th>
                        <th class="py-2">SR</th>
                        <th class="py-2">工項</th>
                        <th class="py-2">taskId</th>
                        <th class="py-2">workItem</th>
                        <th class="py-2">角色</th>
                        <th class="py-2">花費時間</th>
                        <th class="py-2">細項</th>
                        <th class="py-2"></th>
                        <th class="py-2"></th>
                        <th class="py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="w-full text-center px-2 h-12 border border-gray-600"
                        v-for="(item, index) in workTimeData" :key="item.id"
                        :class="{ 'bg-gray-900': index % 2 == 0, '!bg-[#4c5159]': selectedId === item.id }">
                        <td class="px-2">
                            <span v-if="!editItem[item.id]">{{ item.date }}</span>
                            <input class="!p-1 w-32" v-model="editItem[item.id].date" v-else type="date">
                        </td>
                        <td class="px-2" :class="{ '!bg-[#925c34]': selectedId === item.id }">
                            <span v-if="!editItem[item.id]">{{
                                item.pyrd }}</span>
                            <input class="!p-1 w-12" v-model="editItem[item.id].pyrd" v-else type="text">
                        </td>
                        <td class="px-2" :class="{ '!bg-[#925c34]': selectedId === item.id }">
                            <span v-if="!editItem[item.id]">{{
                                item.SR }}</span>
                            <input class="!p-1 w-12" v-model="editItem[item.id].SR" v-else type="text">
                        </td>
                        <td class="px-2">
                            <span v-if="!editItem[item.id]">{{ item.taskname }}</span>
                            <input class="!p-1 w-64" v-model="editItem[item.id].taskname" v-else type="text">
                        </td>
                        <td class="px-2">
                            <span v-if="!editItem[item.id]">{{ item.taskId }}</span>
                            <input class="!p-1 w-24" v-model="editItem[item.id].taskId" v-else type="text">
                        </td>
                        <td class="px-2" :class="{ '!bg-[#925c34]': selectedId === item.id }">
                            <span v-if="!editItem[item.id]">{{
                                item.workitem }}</span>
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
                        <td class="px-2">
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
                        <td class="px-2" :class="{ '!bg-[#925c34]': selectedId === item.id }">
                            <span v-if="!editItem[item.id]">{{
                                item.time }}</span>
                            <input class="!p-1 w-12" v-model="editItem[item.id].time" v-else type="number">
                        </td>
                        <td class="px-2">
                            <span v-if="!editItem[item.id]">{{ item.detail }}</span>
                            <textarea class="!p-1 w-36" v-model="editItem[item.id].detail" v-else></textarea>
                        </td>
                        <td class="px-2">
                            <PencilIcon v-if="!editItem[item.id]" class="cursor-pointer size-8"
                                @click="handleEdit(item)">
                                編輯
                            </PencilIcon>
                            <ArrowUturnLeftIcon v-else class="cursor-pointer size-8" @click="cancelEdit(item)">取消
                            </ArrowUturnLeftIcon>
                        </td>
                        <td class="px-2">
                            <TrashIcon class=" cursor-pointer size-8" @click="handleModalPop(item)">刪除</TrashIcon>
                        </td>
                        <td class="px-2">
                            <Square2StackIcon class="size-8 cursor-pointer" @click="handleCopy(item)">
                            </Square2StackIcon>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <button @click="saveEdit">儲存</button>

    </div>
</template>
<script setup>
import { TrashIcon, PencilIcon, ArrowUturnLeftIcon, Square2StackIcon } from '@heroicons/vue/24/solid'
import { ref, reactive, onMounted, computed } from 'vue';
import ToolTips from '../components/ToolTips.vue';

const toolTipState = ref(false)
const toolTipText = ref('')
const showState = ref(0);
const workTimeData = ref([]);
let originData;
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
            originData = JSON.parse(JSON.stringify(data))
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
        .then(res => {
            if (res.status == 200) {
                deleteModal.value = false;
                editItem.value[pointerItem.value.id] = null;
                toolTipState.value = true;
                showState.value++;
                toolTipText.value = '刪除成功'
                getWorkTimeList();
            } else {
                deleteModal.value = false;
                toolTipState.value = false;
                showState.value++;
                toolTipText.value = '刪除失敗'
            }
        })
}
// 防呆談窗
const handleModalPop = (item) => {
    deleteModal.value = true;
    pointerItem.value = item;
}

const handleCopy = async (item) => {

    try {
        await navigator.clipboard.writeText(`${item.taskId},${item.role}\n${item.detail}`);
        selectedId.value = item.id;
        toolTipState.value = true;
        showState.value++;
        toolTipText.value = '複製成功'
    } catch (err) {
        console.log(err);
        toolTipState.value = false;
        showState.value++;
        toolTipText.value = '複製失敗'
    }
}
const handleEdit = (item) => {
    editItem.value[item.id] = item;
}
const cancelEdit = (item) => {
    let origin = originData.find(el => el.id === item.id);
    let index = workTimeData.value.findIndex(el => el.id === item.id);

    if (origin && index !== -1) {
        workTimeData.value[index] = JSON.parse(JSON.stringify(origin)); // 使用深拷貝確保不共用引用
    }
    editItem.value[item.id] = null;


}
const saveEdit = () => {
    const cleanData = Object.values(editItem.value).filter(item => item !== undefined && item !== null);
    console.log(cleanData);
    fetch('/api/updateWorkTime', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
    })
        .then(res => {
            if (res.status == 200) {
                getWorkTimeList();
                editItem.value = [];
                toolTipState.value = true;
                showState.value++;
                toolTipText.value = '更新成功'
            } else {
                toolTipState.value = false;
                showState.value++;
                toolTipText.value = '更新失敗';
            }
        })
}
// 撈名稱
const getTaskName = async () => {
    try {
        const response = await fetch('/api/update-tasks', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const data = await response.json();
        console.log(data);
    } catch (err) {
        console.error(err);
    }
}

onMounted(() => {
    getWorkTimeList();
    getTaskName();
})


</script>