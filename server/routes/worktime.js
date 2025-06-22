import express from "express";
// 匯入 token 相關的 controller 或 service
import {
    getWorkTimeList,
    timeReport,
    worktime,
    updateWorkTime,
    deleteList,
    getPyrdOptions,
} from "../services/worktime.js";
const router = express.Router();

// 獲取所有資料
router.get("/getWorkTimeList", getWorkTimeList);

// 後端API
router.get("/timeReport", timeReport);

// 獲取所有 pyrd 選項
router.get("/getPyrdOptions", getPyrdOptions);

// 新增專案資料
router.post("/worktime", worktime);

// 更新專案資料
router.patch("/updateWorkTime", updateWorkTime);

// 刪除資料
router.delete("/deleteList", deleteList);

export default router;
