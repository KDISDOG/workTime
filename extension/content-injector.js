chrome.storage.local.get("workTimeList", (result) => {
    const data = result.workTimeList;
  
    if (!data) {
      alert("找不到 workTimeList");
      return;
    }
  
    try {
      const parsed = JSON.parse(data);
  
      // 🟡 TODO: 在這裡指定你的 DOM selector，把資料插入對應的欄位
      // 你明天進公司後只要填好這幾個 selector 就可以囉！
  
      // ⬇️ 日期欄位（例如 input[name="date"] 或 span#dateBox）
      const dateEl = document.querySelector("<!-- 在這裡填入日期 DOM -->");
      if (dateEl) dateEl.value = parsed.date || parsed.date;
  
      // ⬇️ 工時欄位（例如 input[name="time"]）
      const timeEl = document.querySelector("<!-- 在這裡填入工時 DOM -->");
      if (timeEl) timeEl.value = parsed.time;
  
      // ⬇️ 工作項目欄位（例如 textarea#workitem）
      const workitemEl = document.querySelector("<!-- 在這裡填入工作項目 DOM -->");
      if (workitemEl) workitemEl.value = parsed.workitem;
  
      // ⬇️ 工作細節欄位（例如 textarea#detail）
      const detailEl = document.querySelector("<!-- 在這裡填入細節 DOM -->");
      if (detailEl) detailEl.value = parsed.detail;
  
      alert("✅ 資料已成功注入！");
    } catch (e) {
      alert("❌ 資料格式錯誤：" + e.message);
      console.error("JSON parse error:", e);
    }
  });
  