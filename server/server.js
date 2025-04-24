import express from "express";
import path from "path";
import db from './db.js';
import { fileURLToPath } from "url";
const app = express();
const port = 51121;

console.log(db);
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

// 儲存token
app.post("/api/saveToken", (req, res) => {
  try {
    const { token } = req.body;

    // 檢查是否提供 token
    if (!token) {
      return res.status(400).json({ success: false, message: '未提供 token' });
    }

    // 修正 SQL 語句，移除不必要的 FROM
    const stmt = db.prepare('UPDATE Tokens SET token = ? WHERE id = 1');
    const result = stmt.run(token);

    console.log("token:", token);
    console.log("changes:", result.changes);

    if (result.changes > 0) {
      res.json({ success: true, message: '更新成功' });
      return;
    } else {
      // 如果沒更新任何資料，可能是 id = 1 的記錄不存在
      const stmt2 = db.prepare('INSERT INTO Tokens (token) VALUES (?)');
      const result2 = stmt2.run(token);
      if (result2.changes > 0) {
        res.json({ success: true, message: '更新成功' });
        return;
      }
      
      res.status(404).json({ success: false, message: '更新失敗' });
    }
  } catch (error) {
    console.error("發生錯誤:", error);
    res.status(500).json({ success: false, message: error.message || "更新資料時發生錯誤" });
  }
});

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

// 新增專案資料
// app.post("/api/worktime", (req, res) => {
//   console.log("收到 worktime 請求", req.body);

//   try {
//     const data = req.body;
//     const projects = Array.isArray(data) ? data : [data]; // 確保是陣列

//     // 準備 SQL 語句
//     const insertStmt = db.prepare(
//       "INSERT INTO WorkTime (date, SR, role, taskId, pyrd, workitem, time ,detail, taskname) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)"
//     );

//     // 創建交易函數
//     const replaceAll = db.transaction((projects) => {
//       for (const project of projects) {
//         const { date, SR, role, taskId, pyrd, workitem, time, detail,taskname } = project;
//         insertStmt.run(date, SR, role, taskId, pyrd, workitem, time, detail,taskname);
//       }
//     });

//     // 執行交易
//     replaceAll(projects);

//     res.status(200).json({ message: "更新成功" });

//   } catch (error) {

//   }
// });
// 取得沒有 task_name 的資料

const callClickupToken = () => {
  const stmt  = db.prepare('SELECT token FROM Tokens WHERE id = 1');
  return stmt.get()?.token ||"";
}
app.get("/api/update-tasks", async (req, res) => {
  const token = callClickupToken();
  if( !token ) { 
    res.status(401).json({ message: "請先設定 Clickup Token" });
    return;
  }
  const headers = { Authorization: token };
  // 找出 task_name 為 NULL 的 Task
  const tasks = db.prepare("SELECT taskId FROM WorkTime WHERE taskname IS NULL").all();
  if (tasks.length === 0) {
      return res.json({ message: "所有 Task 都已更新，無需操作。" });
  }

  for (const task of tasks) {
      try {
          const taskId = task.taskId;

          // 取得 Task 詳細資訊
          const taskRes = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, { headers });
          const taskData = await taskRes.json();
          let listName;
          listName = taskData.name;
          console.log("taskData",listData.name);
          if(taskData.parent){
            const listId = taskData.parent;
            // 取得 List 的上層資訊
            const listRes = await fetch(`https://api.clickup.com/api/v2/task/${listId}`, { headers });
            const listData = await listRes.json();
            listName = listData.name;
            console.log("parent",listData.name);
          }
          

          // 更新 SQLite
          db.prepare(
            "UPDATE WorkTime SET taskname = ? WHERE taskId = ?"
        ).run(listName, taskId);

          console.log(`Task ${taskId} 更新完成：${listName}`);
      } catch (err) {
          console.error(`無法獲取 Task ${task.task_id} 的資料`, err.message);
      }
  }

  res.json({ message: "所有未命名的 Task 已更新！" });

});

app.get('/api/getToken', (req, res) => {
  const token = callClickupToken()
  res.json({ "token":token });
})

// 新增專案資料
app.post("/api/worktime", async(req, res) => {
  console.log("收到 worktime 請求");

  const token = callClickupToken();
  if( !token ) { 
    res.status(401).json({ message: "請先設定 Clickup Token" });
    return;
  }
  const headers = { Authorization: token };
  try {
    const data = req.body;
    const projects = Array.isArray(data) ? data : [data]; // 確保是陣列
    // 準備 SQL 語句
    const insertStmt = db.prepare(
      "INSERT INTO WorkTime (date, SR, role, taskId, pyrd, workitem, time ,detail, taskname) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)"
    );
    // 取得 Task 詳細資訊
    const taskRes = await fetch(`https://api.clickup.com/api/v2/task/${projects[0].taskId}`, { headers });
    console.log("taskId",projects[0].taskId);
    const taskData = await taskRes.json();
    console.log(taskData);
    if(taskRes.status == 401){
      res.status(401).json({ message: "找查不到對應 taskId or 設定錯誤 token" });
      return;
    }
    let role ,taskname,SR;
    role = taskData.name;
    console.log("role",role);
    if(taskData.parent){
      const listId = taskData.parent;
      // 取得 List 的上層資訊
      const listRes = await fetch(`https://api.clickup.com/api/v2/task/${listId}`, { headers });
      const listData = await listRes.json();
      taskname = listData.name;
      console.log("taskname",taskname);
      const foundField = listData.custom_fields.find(field => field.name === 'SR');
      console.log(foundField);
      // 是 array 就是要找ID 
      if (Array.isArray(foundField?.value)) {
        
        const currSRId =  foundField.value[0] 
        console.log("currSRId",currSRId);
        // 抓末三碼
        SR = foundField.type_config.options.find(option => option.id === currSRId).label.slice(-3);
      //不是的話直接value 就是SR
      } else if(foundField?.value){
        SR = foundField.value.slice(-3);
      }
    }
    console.log("SR",SR);
    const { date, taskId, pyrd, workitem, time, detail } = projects[0];
    console.log(projects[0]);
    insertStmt.run(date , SR, role, taskId, pyrd, workitem, time, detail, taskname);
    


    res.status(200).json({ message: "更新成功" });

  } catch (error) {
    console.error("發生錯誤:", error);
    res.status(500).json({ message: "更新資料時發生錯誤" });
  }
});
// 獲取所有資料
app.get("/api/getWorkTimeList", (req, res) => {
    console.log("收到 getWorkTimeList 請求");
    
    const data = db.prepare("SELECT * FROM WorkTime WHERE date >= date('now', '-2 month') ORDER BY date DESC, id DESC").all();
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
            pyrd = @pyrd, workitem = @workitem, time = @time, detail = @detail, taskname = @taskname
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


// 後端API
app.get("/api/timeReport", (req, res) => {
  try {
    // 從資料庫獲取工時資料
    const rows = db.prepare(`
      SELECT id, date, SR, pyrd, taskId, role, workitem, time ,taskname
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
          taskname: row.taskname,
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
