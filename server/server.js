import express from "express";
import path from "path";
import db from './db.js';
import { fileURLToPath } from "url";
const app = express();
const port = 3000;
// 取得 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 解析 JSON 格式的請求
app.use(express.json());
app.set('trust proxy', true);
// 添加 CORS 配置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 設定靜態檔案目錄（提供 Vue 構建後的前端）
app.use(express.static(path.join(__dirname, "../dist")));
const users = [{ password: 'YUChens123' }];

// 登入
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const user = users.find(u => u.password === password);
    
    if (user) {
        return res.status(200).json('登入成功');
    }
    
    return res.status(401).json('登入失敗');
});

// 獲取所有專案名稱
app.get("/api/getProjectName", (req, res) => {
    const user = db.prepare("SELECT Name FROM Project").all();
    res.json(user);
});

// 獲取所有專案資料
app.get("/api/getProjectList", (req, res) => {
    console.log("收到getProjectList請求");
    
    const data = db.prepare("SELECT * FROM Project").all();
    console.log("getProjectList回傳",data);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Expires', '-1');
    res.json(data);
});
// 更新專案資料（清空舊資料並插入新資料）
app.post("/api/worktime", (req, res) => {
  console.log("收到 addProject 請求", req.body);

  try {
    const data = req.body;
    const projects = Array.isArray(data) ? data : [data]; // 確保是陣列

    // 準備 SQL 語句
    const insertStmt = db.prepare(
      "INSERT INTO Project (date, SR, role, pyrd, workitem, time) VALUES (?, ?, ?, ?, ?, ?)"
    );

    // 創建交易函數
    const replaceAll = db.transaction((projects) => {
      for (const project of projects) {
        const { date, SR, role, pyrd, workitem, time } = project;
        insertStmt.run(date, SR, role, pyrd, workitem, time);
      }
    });

    // 執行交易
    replaceAll(projects);

    res.status(200).json({ message: "更新成功" });

  } catch (error) {
    console.error("發生錯誤:", error);
    res.status(500).json({ message: error.message || "更新資料時發生錯誤" });
  }
});

// 讓 Vue 處理所有前端路由
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// 啟動 Express 伺服器
app.listen(port, 0.0,0.0, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
