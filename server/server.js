import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import tokenRoutes from "./routes/token.js";
import worktimeRoutes from "./routes/worktime.js";
const app = express();
const port = 51121;
// 取得 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 解析 JSON 格式的請求
app.use(express.json());
app.set('trust proxy', true);
// 添加 CORS 配置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 設定靜態檔案目錄（提供 Vue 構建後的前端）
app.use(express.static(path.join(__dirname, "../dist")));

// 掛載 API 路由
app.use("/api/token", tokenRoutes);
app.use("/api/worktime", worktimeRoutes);

// 讓 Vue 處理所有前端路由
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// 啟動 Express 伺服器
app.listen(port, 0.0,0.0, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


