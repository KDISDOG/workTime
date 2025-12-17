import db from "../db.js";

// 依據資料庫所有唯一 taskId 撈取 limitTime，回傳 { taskId: limitTime }
export const fetchAllUniqueTaskLimitTimes = async () => {
    // 從資料庫撈所有唯一 taskId
    const token = callClickupToken();
    const rows = db.prepare("SELECT DISTINCT taskId FROM WorkTime").all();
    const uniqueTaskIds = rows.map((row) => row.taskId);
    const headers = { Authorization: token };
    const result = {};
    for (const taskId of uniqueTaskIds) {
        try {
            const taskRes = await fetch(
                `https://api.clickup.com/api/v2/task/${taskId}`,
                { headers }
            );
            if (!taskRes.ok) {
                result[taskId] = null;
                continue;
            }
            const taskData = await taskRes.json();
            result[taskId] = taskData.time_estimate
                ? taskData.time_estimate / 3600000
                : null;
        } catch (err) {
            result[taskId] = null;
        }
    }
    // 將撈到的 limitTime 更新回資料庫
    const updateStmt = db.prepare(
        "UPDATE WorkTime SET limitTime = ? WHERE taskId = ?"
    );
    for (const [taskId, limitTime] of Object.entries(result)) {
        updateStmt.run(limitTime, taskId);
    }
};

export const callClickupToken = () => {
    const stmt = db.prepare("SELECT token FROM Tokens WHERE id = 1");
    return stmt.get()?.token || "";
};
