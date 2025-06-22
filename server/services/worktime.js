import db from "../db.js";
import { callClickupToken } from "./clickup.js";
export const getWorkTimeList = (req, res) => {
    console.log("收到 getWorkTimeList 請求");
    const data = db
        .prepare(
            "SELECT * FROM WorkTime WHERE date >= date('now', '-2 month') ORDER BY date DESC, id DESC"
        )
        .all();
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Expires", "-1");
    res.json(data);
};

export const getDataByIds = (ids) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error("Invalid input data");
    }
    const placeholders = ids.map(() => "?").join(",");
    const query = `SELECT * FROM WorkTime WHERE id IN (${placeholders})`;
    return db.prepare(query).all(ids);
};

export const getPyrdOptions = (req, res) => {
    const rows = db
        .prepare(
            "SELECT DISTINCT pyrd FROM WorkTime WHERE pyrd IS NOT NULL AND pyrd != '' ORDER BY pyrd DESC"
        )
        .all();
    res.json(
        rows.map((row) => ({
            key: row.pyrd,
            value: row.pyrd,
        }))
    );
};

export const timeReport = (req, res) => {
    try {
        // 從資料庫獲取工時資料
        const rows = db
            .prepare(
                `
      SELECT id, date, SR, pyrd, taskId, role, workitem, time ,taskname, limitTime
      FROM WorkTime
      ORDER BY pyrd, SR, taskId
    `
            )
            .all();

        // 建立彙總數據結構
        const hierarchyData = {};

        // 處理每一筆記錄，按pyrd > SR > taskId層次組織
        rows.forEach((row) => {
            // 初始化pyrd層
            if (!hierarchyData[row.pyrd]) {
                hierarchyData[row.pyrd] = {
                    pyrd: row.pyrd,
                    totalTime: 0,
                    srGroups: {},
                };
            }

            // 累加pyrd總時間
            hierarchyData[row.pyrd].totalTime += row.time;

            // 初始化SR層
            if (!hierarchyData[row.pyrd].srGroups[row.SR]) {
                hierarchyData[row.pyrd].srGroups[row.SR] = {
                    SR: row.SR,
                    totalTime: 0,
                    taskGroups: {},
                };
            }

            // 累加SR總時間
            hierarchyData[row.pyrd].srGroups[row.SR].totalTime += row.time;

            // 初始化taskId層
            if (
                !hierarchyData[row.pyrd].srGroups[row.SR].taskGroups[row.taskId]
            ) {
                hierarchyData[row.pyrd].srGroups[row.SR].taskGroups[
                    row.taskId
                ] = {
                    taskId: row.taskId,
                    taskname: row.taskname,
                    totalTime: 0,
                    limitTime: row.limitTime,
                    records: [],
                };
            }

            // 累加taskId總時間
            hierarchyData[row.pyrd].srGroups[row.SR].taskGroups[
                row.taskId
            ].totalTime += row.time;

            // 添加詳細記錄
            hierarchyData[row.pyrd].srGroups[row.SR].taskGroups[
                row.taskId
            ].records.push({
                id: row.id,
                date: row.date,
                role: row.role,
                workitem: row.workitem,
                time: row.time,
            });
        });

        res.json({
            hierarchyData: hierarchyData,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "獲取資料失敗", details: err.message });
    }
};

export const updateIsReportColumn = async (ids) => {
    try {
        // 檢查 isReport 欄位是否存在，若不存在則新增
        const pragma = db.prepare("PRAGMA table_info(WorkTime)").all();
        const hasIsReport = pragma.some((col) => col.name === "isReport");
        if (!hasIsReport) {
            db.prepare(
                "ALTER TABLE WorkTime ADD COLUMN isReport INTEGER DEFAULT 0"
            ).run();
        }
        if (Array.isArray(ids)) {
            const stmt = db.prepare(
                "UPDATE WorkTime SET isReport = 1 WHERE id = ?"
            );
            ids.forEach((singleId) => {
                stmt.run(singleId);
            });
        } else {
            const stmt = db.prepare(
                "UPDATE WorkTime SET isReport = 1 WHERE id = ?"
            );
            stmt.run(ids);
        }
    } catch (err) {
        console.error("更新 isReport 欄位時發生錯誤:", err);
    }
};

export const worktime = async (req, res) => {
    console.log("收到 worktime 請求");

    const token = callClickupToken();
    if (!token) {
        res.status(401).json({ message: "請先設定 Clickup Token" });
        return;
    }
    const headers = { Authorization: token };
    try {
        const data = req.body;
        const projects = Array.isArray(data) ? data : [data]; // 確保是陣列
        // 準備 SQL 語句
        const insertStmt = db.prepare(
            "INSERT INTO WorkTime (date, SR, role, taskId, pyrd, workitem, time ,detail, taskname, limitTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        // 取得 Task 詳細資訊
        const taskRes = await fetch(
            `https://api.clickup.com/api/v2/task/${projects[0].taskId}`,
            { headers }
        );
        console.log("taskId", projects[0].taskId);
        const taskData = await taskRes.json();
        if (taskRes.status == 401) {
            res.status(401).json({
                message: "找查不到對應 taskId or 設定錯誤 token",
            });
            return;
        }
        let role, taskname, SR, limitTime;
        limitTime = taskData.time_estimate / 3600000; // 轉換為小時
        console.log("limitTime", limitTime);
        role = taskData.name;
        console.log("role", role);
        if (taskData.parent) {
            const listId = taskData.parent;
            // 取得 List 的上層資訊
            const listRes = await fetch(
                `https://api.clickup.com/api/v2/task/${listId}`,
                { headers }
            );
            const listData = await listRes.json();
            taskname = listData.name;

            const foundField = listData.custom_fields.filter(
                (field) => field.name === "SR"
            );
            for (const field of foundField) {
                if (!field.value) {
                    SR = "";
                    continue;
                }
                const fieldData = field.type_config?.options?.find(
                    (option) => option.id === field.value[0]
                );
                if (fieldData && field.type_config?.options?.length > 0) {
                    // 如果是 object 就是要找 label
                    console.log("1");
                    SR = fieldData.label;
                    if (SR) break; // 找到後就跳出迴圈
                }
                if (Array.isArray(field?.value) && field.value[0]) {
                    console.log("2");
                    SR = field.value[0];
                    if (SR) break; // 找到後就跳出迴圈
                }
                if (typeof field?.value === "string") {
                    console.log("3");
                    SR = field.value;
                    if (SR) break; // 找到後就跳出迴圈
                }
            }
        }
        const { date, taskId, pyrd, workitem, time, detail } = projects[0];
        insertStmt.run(
            date,
            SR,
            role,
            taskId,
            pyrd,
            workitem,
            time,
            detail,
            taskname,
            limitTime
        );

        res.status(200).json({ message: "更新成功" });
    } catch (error) {
        console.error("發生錯誤:", error);
        res.status(500).json({ message: "更新資料時發生錯誤" });
    }
};

export const updateWorkTime = (req, res) => {
    const dataArray = Array.isArray(req.body) ? req.body : [req.body];

    if (dataArray.length === 0) {
        return res.status(400).json({ error: "沒有提供更新資料" });
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
            const results = dataArray.map((item) => {
                if (!item.id) {
                    throw new Error("缺少ID：" + JSON.stringify(item));
                }
                return updateStmt.run(item);
            });

            return { updatedCount: results.length };
        })();

        res.json({
            success: true,
            message: `成功更新 ${dataArray.length} 筆資料`,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "更新失敗", details: err.message });
    }
};

export const deleteList = (req, res) => {
    try {
        const { id } = req.body;
        const stmt = db.prepare("DELETE FROM WorkTime WHERE id = ?");
        const result = stmt.run(id);

        if (result.changes > 0) {
            res.json({ success: true, message: "刪除成功" });
        } else {
            res.status(404).json({
                success: false,
                message: "未找到對應的資料",
            });
        }
    } catch (error) {
        console.error("發生錯誤:", error);
        res.status(500).json({
            message: error.message || "更新資料時發生錯誤",
        });
    }
};
