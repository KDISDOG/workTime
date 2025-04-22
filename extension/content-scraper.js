let lastValue = localStorage.getItem("workTimeList");

setInterval(() => {
  const currentValue = localStorage.getItem("workTimeList");
  if (currentValue !== lastValue) {
    lastValue = currentValue;
    console.log("偵測到 localStorage 資料變動，已同步！");
    chrome.storage.local.set({ workTimeList: currentValue });
  }
}, 1000); // 每秒檢查一次