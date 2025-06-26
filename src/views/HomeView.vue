<template>
	<ToolTips :showState="showState" :state="toolTipState" :content="toolTipText"></ToolTips>
	<!-- 載入指示器 -->
	<div v-show="isLoading" class="mask fixed top-0 left-0 w-full h-full bg-gray-900 opacity-50"></div>
	<div v-show="isLoading"
		class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center h-40">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
		<span class="ml-3 text-white">紀錄中，請稍候...</span>
	</div>
	<div class="flex flex-col items-center justify-center gap-2 2xl:gap-6 px-4 py-2 2xl:py-6">
		<h1 class="text-2xl font-bold">工時輸入</h1>
		<form
			class="flex flex-col items-center 2xl:justify-center content-center flex-wrap 2xl:flex-nowrap gap-2 mt-8 2xl:h-auto h-[47vh]">
			<div class="flex flex-col gap-2 w-1/2 2xl:w-full">
				<label class="text-center" for="date">日期:</label>
				<input type="date" name="date" v-model="formData.date" placeholder="時間" />
			</div>
			<div class="flex flex-col gap-2 w-1/2 2xl:w-full">
				<label class="text-center" for="PYRD">PYRD:</label>
				<input type="text" name="PYRD" v-model.trim="formData.pyrd" placeholder="請填寫完整PYRD" list="pyrd-list" />
				<datalist id="pyrd-list">
					<option v-for="option in pyrdOptions" :key="option.key" :value="option.value" />
				</datalist>
			</div>
			<div class="flex flex-col gap-2 w-1/2 2xl:w-full">
				<label class="text-center" for="taskId">taskId:</label>
				<input type="text" name="taskId" v-model.trim="formData.taskId" placeholder="taskId" />
			</div>
			<div class="flex flex-col gap-2 w-1/2 2xl:w-full">
				<label class="text-center" for="workItem">workItem:</label>
				<select name="workItem" v-model="formData.workitem">
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
					<option value="業務推廣">業務推廣</option>
					<option value="官方網站">官方網站</option>
					<option value="通用元件">通用元件</option>
				</select>
			</div>
			<div class="flex flex-col gap-2 w-1/2 2xl:w-full">
				<label class="text-center" for="time">工時:</label>
				<input type="number" name="time" v-model.number="formData.time" placeholder="工時" />
			</div>
			<div class="flex flex-col gap-2 w-1/2 2xl:w-full">
				<label class="text-center" for="time">細項:</label>
				<textarea type="text" name="time" @keydown="getNewLine" v-model="formData.detail"
					placeholder="1.XXXX"></textarea>
			</div>
		</form>
		<div class="flex gap-6">
			<button class="button1" @click="handleRecord" type="submit">紀錄</button>
			<button class="buttonCancel" @click="handleClear">清除</button>
		</div>
		<div class="p-6 bg-gray-200">
			<span class="text-center text-xl text-black">{{ hoilday }}</span>
		</div>
	</div>
</template>
<script setup>
import { ref, reactive, onMounted } from "vue";
import ToolTips from "../components/ToolTips.vue";
import axios from "axios";
defineOptions({ name: "home" });
const toolTipState = ref(false);
const toolTipText = ref("");
const showState = ref(0);
const listNums = ref(1);
const hoilday = ref("");
const isLoading = ref(false);
const pyrdOptions = ref([]);
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0"); // 月份從 0 開始，所以要 +1
const dd = String(today.getDate()).padStart(2, "0");

const formattedDate = `${yyyy}-${mm}-${dd}`;
const defaultData = {
	date: formattedDate,
	pyrd: "",
	taskId: "",
	workitem: "系統開發",
	time: "",
	detail: `1.`,
};

const formData = reactive({
	...defaultData,
});
const getNewLine = (e) => {
	if (e.key === "Enter") {
		e.preventDefault();
		formData.detail += `\n${++listNums.value}.`;
	}
};

const getPyrdOptions = async () => {
	try {
		const res = await axios.get("../api/worktime/getPyrdOptions");
		if (res.status === 200) {
			pyrdOptions.value = res.data;
		} else {
			console.error("無法獲取PYRD選項");
		}
	} catch (error) {
		console.error("獲取PYRD選項時發生錯誤:", error);
	}
};

const handleRecord = async () => {
	if (!formData.taskId || !formData.taskId || !formData.pyrd || !formData.time) {
		toolTipState.value = false;
		showState.value++;
		toolTipText.value = "請填寫所有欄位";
		return;
	}

	//刪除taskId的#號
	if (formData.taskId.includes("#")) {
		formData.taskId = formData.taskId.split("#")[1];
	}
	try {
		isLoading.value = true;
		const res = await axios.post("../api/worktime/worktime", formData, {
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (res.status == 200) {
			isLoading.value = false;
			toolTipState.value = true;
			showState.value++;
			toolTipText.value = "紀錄成功";
			listNums.value = 1;
			formData.pyrd = "";
			formData.time = "";
			formData.taskId = "";
			formData.detail = "1.";
		}
	} catch (err) {
		isLoading.value = false;
		toolTipState.value = false;
		showState.value++;
		toolTipText.value = err.response.data.message;
	}
};

const handleClear = () => {
	listNums.value = 1;
	Object.assign(formData, defaultData);
};

//老師寫的
const getNextHolidaty = async () => {
	const today = new Date();
	today.setHours(0, 0, 0, 0); // 將時間設為 00:00:00，避免時間影響計算

	// API 端點，請替換為你的 API 地址
	const apiUrl =
		"https://raw.githubusercontent.com/880831ian/taiwan-calendar/master/data/2025.json"; // 替換為你的 API 端點

	try {
		// 使用 fetch 獲取行事曆資料
		const response = await axios(apiUrl);
		const calendarData = response.data;

		// 找到下一個放假日
		let nextHoliday = null;
		for (const day of calendarData) {
			// 將日期從 YYYYMMDD 轉為 YYYY-MM-DD 格式
			const dateStr = day["西元日期"].toString(); // 確保是字串
			const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(
				4,
				6
			)}-${dateStr.substring(6, 8)}`;
			const date = new Date(formattedDate);
			// 檢查是否為放假日（國定假日或週末）
			const isWeekend = day["星期"] === "六" || day["星期"] === "日";
			const isHoliday = day["是否放假"] === "2" || isWeekend;
			// 如果日期在今天之後且是放假日，記錄並跳出
			if (date > today && isHoliday) {
				console.log(day["備註"]);
				nextHoliday = {
					date: formattedDate,
					reason: day["備註"] || (isWeekend ? "週末" : "工作日"),
				};
				break;
			}
		}

		// 計算天數差異並顯示結果
		if (nextHoliday) {
			const nextHolidayDate = new Date(nextHoliday.date);
			const timeDiff = nextHolidayDate - today; // 毫秒差
			const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // 轉換為天數

			hoilday.value = `
            距離放假還有: ${dayDiff - 1} 天 原因: ${nextHoliday.reason}
          `;
		} else {
			hoilday.value = "找不到下一個放假日";
		}
	} catch (error) {
		console.error("錯誤:", error);
		hoilday.value = "無法獲取資料，請稍後再試";
	}
};

onMounted(() => {
	getPyrdOptions();
	getNextHolidaty();
	document.querySelectorAll("input[type='date']").forEach((input) => {
		input.addEventListener("click", (e) => {
			e.target.showPicker();
		});
	});
});
</script>
