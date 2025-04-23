chrome.storage.local.get("workTimeList", (result) => {
  const data = result.workTimeList;

  if (!data) {
    alert("找不到 workTimeList");
    return;
  }

  try {
    const parsed = JSON.parse(data);
    
    // 先找到 iframe 元素
    const parentIframe = document.querySelector('#ifmFucntionLocation'); 
    const iframe = parentIframe.contentDocument.querySelector('#ifmAppLocation'); 
    // 確保 iframe 已加載完成
    if (!iframe || !iframe.contentDocument) {
      console.log("無法訪問 iframe 內容！");
      return;
    }
    
    // 使用 iframe 的 contentDocument 來查詢其內部元素
    const iframeDoc = iframe.contentDocument;
    
    // 日期欄位
    const dateEl = iframeDoc.querySelector("#WorkDate_txt");
    if (dateEl) dateEl.value = parsed.date.replaceAll('-',"/") || "";
    
    // WorkItem 欄位
    const workItemEl = iframeDoc.querySelector("#WorkItem_txt");
    if (workItemEl) workItemEl.value = parsed.workitem || "";

    // 工時欄位
    const timeEl = iframeDoc.querySelector("#WorkHour");
    if (timeEl) timeEl.value = parsed.time || "";
    
    // 工作細節欄位
    const detailEl = iframeDoc.querySelector("#WorkDesc");
    if (detailEl) detailEl.value = parsed.detail || "";
    
    // if (dateEl) {
    //   const event = new Event('input', { bubbles: true });
    //   dateEl.dispatchEvent(event);
    // }
    
    alert("資料已成功注入！");
  } catch (e) {
    console.log("JSON parse error:", e);
  }
});