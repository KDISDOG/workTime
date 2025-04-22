document.addEventListener("DOMContentLoaded", () => {
    const injectBtn = document.getElementById("injectBtn");
  
    injectBtn.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
      // 確保只有點擊按鈕時才執行 content-injector
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content-injector.js"]
      });
    });
  
    // 其他初始化顯示用的 storage 資料（例如顯示 KEY:VALUE）
    chrome.storage.local.get("workTimeList", (result) => {
      const dataView = document.getElementById("dataView");
      if (!result.workTimeList) {
        dataView.innerText = "尚無儲存資料";
        return;
      }
  
      try {
        const parsed = JSON.parse(result.workTimeList);
        let output = "";
        for (const key in parsed) {
          output += `${key} : ${parsed[key]}\n`;
        }
        dataView.innerText = output;
      } catch (e) {
        dataView.innerText = result.workTimeList;
      }
    });
  });
  