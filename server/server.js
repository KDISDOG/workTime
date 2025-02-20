import express from "express";
import path from "path";
import db from './db.js';
import { fileURLToPath } from "url";
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

// 刪除資料
app.delete("/api/deleteList", (req, res) => {
  try {
    const { id } = req.body;
    const stmt = db.prepare('DELETE FROM WorkTime WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes > 0) {
        res.json({ success: true, message: '刪除成功' });
    } else {
        res.status(404).json({ success: false, message: '未找到對應的資料' });
    }
  } catch (error) {
    console.error("發生錯誤:", error);
    res.status(500).json({ message: error.message || "更新資料時發生錯誤" });
  }

});

// 獲取所有資料
app.get("/api/getWorkTimeList", (req, res) => {
    console.log("收到 getProjectList 請求");
    
    const data = db.prepare("SELECT * FROM WorkTime Where date >= date('now', '-1 month') ORDER BY date DESC").all();
    console.log("getWorkTimeList",data);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Expires', '-1');
    res.json(data);
});

app.patch("/api/updateWorkTime", (req, res) => {
  const dataArray = Array.isArray(req.body) ? req.body : [req.body];
  
  if (dataArray.length === 0) {
    return res.status(400).json({ error: '沒有提供更新資料' });
  }
  
  try {
    // 開始交易以確保批量更新的一致性
    db.transaction(() => {
      const updateStmt = db.prepare(`
        UPDATE WorkTime 
        SET date = @date, SR = @SR, taskId = @taskId, role = @role,
            pyrd = @pyrd, workitem = @workitem, time = @time, detail = @detail
        WHERE id = @id
      `);
      
      // 執行每筆更新
      const results = dataArray.map(item => {
        if (!item.id) {
          throw new Error('缺少ID：' + JSON.stringify(item));
        }
        return updateStmt.run(item);
      });
      
      return { updatedCount: results.length };
    })();
    
    res.json({ 
      success: true, 
      message: `成功更新 ${dataArray.length} 筆資料`
    });
    
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: '更新失敗', details: err.message });
  }
});

// 新增專案資料
app.post("/api/worktime", (req, res) => {
  console.log("收到 worktime 請求", req.body);

  try {
    const data = req.body;
    const projects = Array.isArray(data) ? data : [data]; // 確保是陣列

    // 準備 SQL 語句
    const insertStmt = db.prepare(
      "INSERT INTO WorkTime (date, SR, role, taskId, pyrd, workitem, time ,detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    // 創建交易函數
    const replaceAll = db.transaction((projects) => {
      for (const project of projects) {
        const { date, SR, role, taskId, pyrd, workitem, time, detail } = project;
        insertStmt.run(date, SR, role, taskId, pyrd, workitem, time, detail);
      }
    });

    // 執行交易
    replaceAll(projects);

    res.status(200).json({ message: "更新成功" });

  } catch (error) {

  }
});
// 後端API
app.get("/api/timeReport", (req, res) => {
  try {
    // 從資料庫獲取工時資料
    const rows = db.prepare(`
      SELECT id, date, SR, pyrd, taskId, role, workitem, time 
      FROM WorkTime
      ORDER BY pyrd, SR, taskId
    `).all();
    
    // 建立彙總數據結構
    const hierarchyData = {};
    
    // 處理每一筆記錄，按pyrd > SR > taskId層次組織
    rows.forEach(row => {
      // 初始化pyrd層
      if (!hierarchyData[row.pyrd]) {
        hierarchyData[row.pyrd] = {
          pyrd: row.pyrd,
          totalTime: 0,
          srGroups: {}
        };
      }
      
      // 累加pyrd總時間
      hierarchyData[row.pyrd].totalTime += row.time;
      
      // 初始化SR層
      if (!hierarchyData[row.pyrd].srGroups[row.SR]) {
        hierarchyData[row.pyrd].srGroups[row.SR] = {
          SR: row.SR,
          totalTime: 0,
          taskGroups: {}
        };
      }
      
      // 累加SR總時間
      hierarchyData[row.pyrd].srGroups[row.SR].totalTime += row.time;
      
      // 初始化taskId層
      if (!hierarchyData[row.pyrd].srGroups[row.SR].taskGroups[row.taskId]) {
        hierarchyData[row.pyrd].srGroups[row.SR].taskGroups[row.taskId] = {
          taskId: row.taskId,
          totalTime: 0,
          records: []
        };
      }
      
      // 累加taskId總時間
      hierarchyData[row.pyrd].srGroups[row.SR].taskGroups[row.taskId].totalTime += row.time;
      
      // 添加詳細記錄
      hierarchyData[row.pyrd].srGroups[row.SR].taskGroups[row.taskId].records.push({
        id: row.id,
        date: row.date,
        role: row.role,
        workitem: row.workitem,
        time: row.time
      });
    });
    
    res.json({
      hierarchyData: hierarchyData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '獲取資料失敗', details: err.message });
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
