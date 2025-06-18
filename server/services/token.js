import db from '../db.js';

export const saveToken = (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: '未提供 token' });
    }
    const stmt = db.prepare('UPDATE Tokens SET token = ? WHERE id = 1');
    const result = stmt.run(token);
    if (result.changes > 0) {
      res.json({ success: true, message: '更新成功' });
      return;
    } else {
      const stmt2 = db.prepare('INSERT INTO Tokens (token) VALUES (?)');
      const result2 = stmt2.run(token);
      if (result2.changes > 0) {
        res.json({ success: true, message: '更新成功' });
        return;
      }
      res.status(404).json({ success: false, message: '更新失敗' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "更新資料時發生錯誤" });
  }
}

export const getToken = (req, res) => {
  const stmt = db.prepare('SELECT token FROM Tokens WHERE id = 1');
  const token = stmt.get()?.token || "";
  res.json({ token });
}