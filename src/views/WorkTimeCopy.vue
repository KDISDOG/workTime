<template>
    <ToolTips :showState="showState" :state="toolTipState" :content="toolTipText"></ToolTips>
    <ConfirmModal :showState="confirmModalState"
        :width="modalConfirmType === 'report' ? '1200px' : modalConfirmType === 'reportResult' ? '600px' : '400px'"
        @close="confirmModalState = false" @confirm="handleConfirm">
        <template #header>
            <h2 class="text-lg font-bold">
                {{ modalConfirmType === "report" ? "資料確認" : "確認" }}
            </h2>
        </template>
        <template #body>
            <div v-if="modalConfirmType === 'report'">
                <div class="flex flex-col items-center justify-center gap-4">
                    <h2 class="text-lg font-bold mb-4">BPM 帳密</h2>
                    <div class="flex gap-4 justify-center items-center w-64 mb-2">
                        <label for="userName">帳號</label>
                        <input type="text" name="userName" v-model="userName" placeholder="帳號" class="flex-1"
                            @keydown.enter="handleConfirm" />
                    </div>
                    <div class="flex gap-4 justify-center items-center w-64 mb-2">
                        <label for="password">密碼</label>
                        <input type="password" name="password" v-model="password" placeholder="密碼" class="flex-1"
                            @keydown.enter="handleConfirm" />
                    </div>
                    <p class="text-sm text-gray-500">
                        請確認帳號密碼正確，否則可能會導致報工時失敗。
                    </p>
                </div>
                <div class="flex flex-col items-center justify-center gap-4 mt-6">
                    <h2 class="text-center text-lg font-bold">資料</h2>
                    <table class="table-auto w-full border-spacing-1.5 border-separate">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>PYRD</th>
                                <th>SR</th>
                                <th>工項</th>
                                <th>workItem</th>
                                <th>taskId</th>
                                <th>角色</th>
                                <th>時間</th>
                                <th>細項</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in checkedItems" class="text-center" :key="item.id">
                                <td :class="{ 'bg-zinc-400': !item.date }">{{ item.date }}</td>
                                <td :class="{ 'bg-zinc-400': !item.pyrd }">{{ item.pyrd }}</td>
                                <td :class="{ 'bg-zinc-400': !item.SR }">{{ item.SR }}</td>
                                <td :class="{ 'bg-zinc-400': !item.taskname }">{{ item.taskname }}</td>
                                <td :class="{ 'bg-zinc-400': !item.workitem }">{{ item.workitem }}</td>
                                <td :class="{ 'bg-zinc-400': !item.taskId }">{{ item.taskId }}</td>
                                <td :class="{ 'bg-zinc-400': !item.role }">{{ item.role }}</td>
                                <td :class="{ 'bg-zinc-400': !item.time }">{{ item.time }}</td>
                                <td :class="{ 'bg-zinc-400': !item.detail }">{{ item.detail }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <p v-else-if="modalConfirmType === 'delete'" class="text-center">
                是否確認刪除這筆資料？
            </p>
            <div v-if="modalConfirmType === 'reportResult'">
                <div v-if="Object.keys(reportResult).length === 0"
                    class="flex flex-col gap-5 justify-center items-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span class="ml-3 text-black">紀錄中，請稍候...</span>
                </div>
                <div v-else class="flex flex-col items-center justify-center">
                    <h2 class="text-lg font-bold mb-4 text-center">報工時結果</h2>
                    <table class="table-auto w-full border-spacing-1.5 border-separate">
                        <tbody>
                            <tr v-for="(item, index) in checkedItems" class="text-center" :key="item.id">
                                <td>
                                    <span
                                        v-if="reportResult?.success?.length > 0 && reportResult.success.includes(item.id)">
                                        <CheckCircleIcon class="text-green-500 size-6" />
                                    </span>
                                    <span v-else>
                                        <XCircleIcon class="text-red-500 size-6" />
                                    </span>
                                </td>
                                <td>{{ item.date }}</td>
                                <td>{{ item.taskname }}</td>
                                <td>{{ item.role }}</td>
                                <td>{{ item.time }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
        <template #footer>
            <button v-if="modalConfirmType === 'reportResult'" class="buttonCancel" :disabled="reportResultState"
                @click="closeReportResult">關閉</button>
        </template>
    </ConfirmModal>
    <div class="flex flex-col items-center justify-center gap-6 px-4 py-6">
        <h1 class="text-2xl font-bold text-center">工時複製 (2個月內)</h1>
        <div class="overflow-y-auto h-[70vh]">
            <table class="table-auto w-[85vw]">
                <thead class="sticky top-0">
                    <tr class="w-full bg-[#030511]">
                        <th></th>
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
                        v-for="(item, index) in workTimeData" :key="item.id" :class="{
                            'bg-gray-900': index % 2 == 0,
                            '!bg-[#4c5159]': selectedId === item.id,
                        }">
                        <td class="px-2">
                            <input @change="handleCheckboxChange($event, item.id)" :checked="item.isReport == 1"
                                :disabled="item.isReport == 1" class="size-5" type="checkbox" />
                        </td>
                        <td class="px-2 whitespace-nowrap">
                            <span v-if="!editItem[item.id]">{{ item.date }}</span>
                            <input class="!p-1 w-32" v-model="editItem[item.id].date" v-else type="date" />
                        </td>
                        <td class="px-2">
                            <span v-if="!editItem[item.id]">{{ item.pyrd }}</span>
                            <input class="!p-1 w-12" v-model="editItem[item.id].pyrd" v-else type="text" />
                        </td>
                        <td class="px-2">
                            <span v-if="!editItem[item.id]">{{
                                item.SR ? item.SR.slice(-3) : ""
                            }}</span>
                            <input class="!p-1 w-32" v-model="editItem[item.id].SR" v-else type="text" />
                        </td>
                        <td class="px-2">
                            <span v-if="!editItem[item.id]">{{ item.taskname }}</span>
                            <input class="!p-1 w-64" v-model="editItem[item.id].taskname" v-else type="text" />
                        </td>
                        <td class="px-2">
                            <span v-if="!editItem[item.id]">{{ item.taskId }}</span>
                            <input class="!p-1 w-24" v-model="editItem[item.id].taskId" v-else type="text" />
                        </td>
                        <td class="px-2 max-w-40 truncate">
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
                        <td class="px-2">
                            <span v-if="!editItem[item.id]">{{ item.time }}</span>
                            <input class="!p-1 w-12" v-model="editItem[item.id].time" v-else type="number" />
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
                            <TrashIcon class="cursor-pointer size-8" @click="handleModalPop(item)">刪除</TrashIcon>
                        </td>
                        <td class="px-2">
                            <Square2StackIcon class="size-8 cursor-pointer" @click="handleCopy(item)">
                            </Square2StackIcon>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="flex gap-12">
            <button class="button2" @click="clickReportBtn">報工時</button>
            <button class="button1" @click="saveEdit">全部儲存</button>
        </div>
    </div>
</template>
<script setup>
import {
    TrashIcon,
    PencilIcon,
    ArrowUturnLeftIcon,
    Square2StackIcon,
    XCircleIcon, CheckCircleIcon
} from "@heroicons/vue/24/solid";
import { ref, reactive, onMounted, computed } from "vue";
import axios from "axios";
import ToolTips from "../components/ToolTips.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
const toolTipState = ref(false);
const toolTipText = ref("");
const showState = ref(0);
const workTimeData = ref([]);
let originData;
const pointerItem = ref(null);
const selectedId = ref(null);
const editItem = ref([]);
const checkboxState = ref([]);
const modalConfirmType = ref("delete"); // 用於確認對話框的類型
const confirmModalState = ref(false);
const userName = ref("");
const password = ref("");
const reportResultState = ref(true); // 用於報工時結果的狀態
const reportResult = ref({}); // 用於存儲報工時結果
const checkedItems = computed(() =>
    checkboxState.value
        .map((id) => workTimeData.value.find((item) => item.id === id))
        .filter(Boolean)
);

const getWorkTimeList = async () => {
    try {
        const res = await axios.get("/api/worktime/getWorkTimeList", {
            headers: {
                "Content-Type": "application/json",
            },
        });
        workTimeData.value = res.data;
        originData = JSON.parse(JSON.stringify(res.data));
    } catch (error) {
        toolTipState.value = false;
        showState.value++;
        toolTipText.value = "取得工時資料失敗";
    }
};
const handleConfirm = () => {
    switch (modalConfirmType.value) {
        case "delete":
            handleDelete();
            break;
        case "report":
            handleReport();
            break;
        case "reportResult":
            openReportResult();
            break;
        default:
            break;
    }
};

const handleReport = async () => {
    confirmModalState.value = false;
    reportWorkTime();
    openReportResult();
};

const openReportResult = () => {
    confirmModalState.value = true;
    modalConfirmType.value = "reportResult";
};

const handleDelete = async () => {
    try {
        const res = await axios.delete("/api/worktime/deleteList", {
            data: {
                id: pointerItem.value.id,
            },
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (res.status === 200) {
            toolTipState.value = true;
            editItem.value[pointerItem.value.id] = null;
            confirmModalState.value = false;
            showState.value++;
            toolTipText.value = "刪除成功";
            getWorkTimeList();
        } else {
            toolTipState.value = false;
            showState.value++;
            toolTipText.value = "刪除失敗";
        }
    } catch (error) {
        toolTipState.value = false;
        showState.value++;
        toolTipText.value = "刪除失敗";
    }
};
// 防呆談窗
const handleModalPop = (item) => {
    confirmModalState.value = true;
    modalConfirmType.value = "delete";
    pointerItem.value = item;
};

const handleCopy = async (item) => {
    try {
        await navigator.clipboard.writeText(`${item.taskId},${item.role}\n${item.detail}`);
        localStorage.setItem(
            "workTimeList",
            JSON.stringify({
                date: item.date,
                time: item.time,
                pyrd: item.pyrd,
                SR: item.SR,
                workitem: item.workitem,
                detail: `${item.taskId},${item.role}\n${item.detail}`,
            })
        );
        selectedId.value = item.id;
        toolTipState.value = true;
        showState.value++;
        toolTipText.value = "複製成功";
    } catch (err) {
        console.log(err);
        toolTipState.value = false;
        showState.value++;
        toolTipText.value = "複製失敗";
    }
};
const handleEdit = (item) => {
    editItem.value[item.id] = item;
};
const cancelEdit = (item) => {
    let origin = originData.find((el) => el.id === item.id);
    let index = workTimeData.value.findIndex((el) => el.id === item.id);

    if (origin && index !== -1) {
        workTimeData.value[index] = JSON.parse(JSON.stringify(origin)); // 使用深拷貝確保不共用引用
    }
    editItem.value[item.id] = null;
};
const saveEdit = async () => {
    const cleanData = Object.values(editItem.value).filter(
        (item) => item !== undefined && item !== null
    );
    try {
        const res = await axios.patch("/api/worktime/updateWorkTime", cleanData);
        if (res.status === 200) {
            getWorkTimeList();
            editItem.value = [];
            toolTipState.value = true;
            showState.value++;
            toolTipText.value = "更新成功";
        } else {
            toolTipState.value = false;
            showState.value++;
            toolTipText.value = "更新失敗";
        }
    } catch (error) {
        toolTipState.value = false;
        showState.value++;
        toolTipText.value = "更新失敗";
    }
};

const handleCheckboxChange = (event, id) => {
    if (event.target.checked) {
        checkboxState.value.push(id);
    } else {
        checkboxState.value = checkboxState.value.filter((item) => item !== id);
    }
};

const clickReportBtn = () => {
    if (checkboxState.value.length === 0) {
        toolTipState.value = false;
        showState.value++;
        toolTipText.value = "請至少選擇一項";
        return;
    }
    modalConfirmType.value = "report";
    confirmModalState.value = true;
};
const debounce = (func, delay) => {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};
const reportWorkTime = debounce(async () => {
    try {
        const res = await axios.post("/api/crawler", {
            id: checkboxState.value,
            userName: userName.value,
            password: password.value,
        });
        const data = res.data;
        if (data?.success === false) {
            toolTipState.value = false;
        } else {
            toolTipState.value = true;
        }
        reportResult.value = {
            success: data.successIds || [],
            fail: data.failIds || [],
        };
        showState.value++;
        reportResultState.value = false;
        toolTipText.value = data.message || "報工時成功";
        getWorkTimeList();
    } catch (error) {
        reportResultState.value = false;
        reportResult.value = {
            success: [],
            fail: checkboxState.value,
        };
        if (error.response && error.response.status === 400) {
            toolTipState.value = false;
            showState.value++;
            toolTipText.value = "有資料欄位不完整，請檢查後再報";
        } else {
            toolTipState.value = false;
            showState.value++;
            toolTipText.value = "報工時失敗";
        }
    }
}, 500);
const closeReportResult = () => {
    confirmModalState.value = false;
    reportResult.value = {};
    reportResultState.value = true;
};
onMounted(() => {
    getWorkTimeList();
});
</script>
