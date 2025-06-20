import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// 取得 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 連接 SQLite 資料庫（如果沒有會自動建立）
const dbPath = path.join(__dirname, "database.sqlite");
const db = new Database(dbPath, { verbose: console.log });

// 建立 users 表格（如果不存在）
db.exec(`
  CREATE TABLE IF NOT EXISTS WorkTime (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      date TEXT NOT NULL, 
      SR TEXT,
      taskId TEXT,
      role TEXT, 
      pyrd TEXT, 
      workitem TEXT, 
      time REAL,
      detail TEXT,
      taskname TEXT,
      limitTime REAL
  );
`);
// 新增 Tokens 資料表
db.exec(`
  CREATE TABLE IF NOT EXISTS Tokens (
      id INTEGER PRIMARY KEY, 
      token TEXT NOT NULL
  );
`);
export default db;