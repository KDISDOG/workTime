import express from "express";
// 匯入 token 相關的 controller 或 service
import { saveToken, getToken } from "../services/token.js";

const router = express.Router();

// 註冊 API 路由
router.post("/saveToken", saveToken);
router.get("/getToken", getToken);

export default router;