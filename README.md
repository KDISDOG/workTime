# 版本更新

20250324
1.新增輸入時的動畫
2.新增工時複製時需要填寫的欄位 highlight
3.修正取消編輯沒有回復原本資料 BUG

# 第一步 在 cmd 進入資料夾輸入(有安裝 node.js，沒安裝自己 Google)

cd XXXXX
npm i

# 第二步 進入 server 資料夾

cd server

# 第三步 安裝 pm2

npm install -g pm2

# 第四步 架設 server

pm2 start server.js --name "my-app"

# 第五步 存檔

pm2 save

# 第六步 安裝開機自動啟動工具

npm install -g pm2-windows-startup

# 第七步 開啟工具

pm2-startup install
