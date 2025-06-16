# 版本更新

## 20250616

1. 新增 clickup 可花費時間
2. 修正其他 PM 抓不到 SR ˋˊ

## 20250424

1. 紀錄畫面版面修正
2. 複製畫面版面修正
3. 修正其他 PM 抓不到 SR ˋˊ

## 20250423

1. 新增工時輸入 KeepAlive
2. 設置 chrome 小工具的 DOM
3. 移除 工時複製時需要填寫的欄位 highlight
4. workItem 改跟 BPM 一樣
5. 儲存資料移除空白
6. 修改工時分析顏色
7. 修改新報工時排序

## 20250422

1. 新增 chrome 自動填入小工具(未設置 DOM)
2. 新增輸入 taskId 刪除#

## 20250331

1. 點擊複製欄位 highlight 新增日期

## 20250324

1. 新增輸入時的動畫
2. 新增工時複製時需要填寫的欄位 highlight
3. 修正取消編輯沒有回復原本資料 BUG

# 安裝步驟

## 第一步 在 cmd 或終端機 進入資料夾輸入(有安裝 node.js，沒安裝自己 Google)

### node.js 下載 v18.20.8 https://nodejs.org/zh-tw/download

`cd 資料夾`<br>
`npm i`<br>
`npm run build`<br>

## 第二步 進入 server 資料夾

`cd server`

## 第三步 安裝 pm2

`npm install -g pm2`

## 第四步 架設 server

`pm2 start server.js --name "my-app"`

## 第五步 存檔

`pm2 save`

## 第六步 安裝開機自動啟動工具

`npm install -g pm2-windows-startup`

## 第七步 開啟工具

`pm2-startup install`

## 第八步 新增 chrome 小工具

### 打開 chrome 擴充功能 > 管理擴充功能

### 點擊載入未封裝項目

### 選擇 extension 資料夾
