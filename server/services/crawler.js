import puppeteer from "puppeteer";
import { getDataByIds } from "./worktime.js";
import { updateIsReportColumn } from "./worktime.js";
const handleRequest = async (req, res) => {
    const { id, userName, password } = req.body;
    try {
        const data = getDataByIds(id);
        // 檢查資料是否有效
        if (
            !userName ||
            !password ||
            !Array.isArray(data) ||
            data.length === 0 ||
            data.some(
                (item) =>
                    !item.pyrd ||
                    !item.date ||
                    !item.time ||
                    !item.detail ||
                    !item.workitem ||
                    !item.taskId ||
                    !item.role
            )
        ) {
            return res.status(400).json({
                success: false,
                error: "Invalid input data",
            });
        }
        const result = await runCrawler(data, { userName, password });
        if (result.successIds.length > 0) {
            await updateIsReportColumn(result.successIds);
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 重試機制的包裝函數
async function withRetry(fn, args = [], retryCount = 2, stepName = "") {
    let lastError;
    for (let i = 0; i <= retryCount; i++) {
        try {
            return await fn(...args);
        } catch (err) {
            lastError = err;
            console.warn(
                `【重試機制】第${i + 1}次嘗試${stepName}失敗：`,
                err.message
            );
            if (i < retryCount)
                await new Promise((res) => setTimeout(res, 1000));
        }
    }
    throw new Error(
        `【重試機制】${stepName}多次重試仍失敗：${lastError.message}`
    );
}

const runCrawler = async (data, { userName, password }) => {
    const successIds = [];
    const failIds = [];
    let browser;
    try {
        console.log("[啟動爬蟲] 開始執行...");
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [
                "--start-maximized",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-extensions",
                "--disable-background-networking",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-breakpad",
                "--disable-client-side-phishing-detection",
                "--disable-component-update",
                "--disable-default-apps",
                "--disable-features=site-per-process",
                "--disable-hang-monitor",
                "--disable-ipc-flooding-protection",
                "--disable-popup-blocking",
                "--disable-prompt-on-repost",
                "--disable-renderer-backgrounding",
                "--disable-sync",
                "--force-color-profile=srgb",
                "--metrics-recording-only",
                "--no-first-run",
                "--safebrowsing-disable-auto-update",
                "--enable-automation",
                "--password-store=basic",
                "--use-mock-keychain",
            ],
        });
        const page = await browser.newPage();
        await page.goto(
            "https://efgp.yuchens.com:8086/NaNaWeb/GP/ForwardIndex?hdnMethod=findIndexForward"
        );
        await withRetry(handleLogin, [page, { userName, password }], 2, "登入");
        for (const el of data) {
            try {
                console.log(
                    `\n[處理資料] id=${el.id}, 日期=${el.date}, 工時=${el.time}`
                );
                await withRetry(
                    goToApplicationForm,
                    [page],
                    2,
                    "進入工時申請單"
                );
                await withRetry(handleDataInjection, [page, el], 2, "資料注入");
                successIds.push(el.id);
                console.log(`[成功] id=${el.id} 資料已成功注入`);
            } catch (err) {
                console.error(
                    `[失敗] id=${el.id} 處理單筆資料時發生錯誤：`,
                    err.message
                );
                failIds.push(el.id);
            }
        }
        return {
            success: failIds.length === 0,
            successIds,
            failIds,
            message:
                failIds.length === 0
                    ? "全部資料已成功注入"
                    : `部分資料注入失敗`,
        };
    } catch (err) {
        console.error("[致命錯誤] runCrawler 發生錯誤:", err.message);
        return { success: false, error: err.message, successIds, failIds };
    } finally {
        if (browser) await browser.close();
        console.log("[結束爬蟲] 已關閉瀏覽器");
    }
};

// 處理登入
const handleLogin = async (page, { userName, password }) => {
    console.log("處理登入...");
    try {
        await page.type("#txtUserId", userName); // 輸入帳號
        await page.type("#txtUserPsd", password); // 輸入密碼
        await page.click("#loginButton button"); // 點擊按鈕
    } catch (err) {
        throw new Error("登入過程發生錯誤: " + err.message);
    }
};

// 進入工時申請單
const goToApplicationForm = async (page) => {
    await page.waitForSelector("#ifmNavigator");
    console.log("前往工時申請表單...");
    // 取得 iframe 元件對應的 frame 對象
    const elementHandle = await page.$("#ifmNavigator");
    const frame = await elementHandle.contentFrame();
    if (!frame) {
        throw new Error("Navigator iframe not found or not loaded.");
    }
    await frame.waitForSelector("#icon_menu_InvokeProcessModule", {
        visible: true,
        timeout: 5000,
    });
    await frame.evaluate(() => gotoNewURL("InvokeProcess", "發起流程"));

    await page.waitForSelector("#ifmFucntionLocation");
    const functionFrame = await page.$("#ifmFucntionLocation");
    if (!functionFrame) {
        throw new Error("Function iframe (#ifmFucntionLocation) not found.");
    }
    const functionContentFrame = await functionFrame.contentFrame();
    if (!functionContentFrame) {
        throw new Error("Function content frame is null.");
    }
    await functionContentFrame.waitForSelector(
        ".processCategory[data-process-category='9df75040e41910048cdea4cc20f29288']",
        { timeout: 5000 }
    );
    await functionContentFrame.evaluate(() =>
        toggleProcessCategoryCotainer("9df75040e41910048cdea4cc20f29288")
    );
    await functionContentFrame.waitForSelector(
        ".processPackage[data-process-name='工時申請單']",
        { timeout: 5000 }
    );
    await functionContentFrame.evaluate(() =>
        prepareProcessData("a9c1ba73f4d410048553e100bf189988", "BPMN")
    );
};

// 處理資料注入
const handleDataInjection = async (page, data) => {
    console.log("處理資料注入...");
    await new Promise((res) => setTimeout(res, 2000));

    // 抓第一層 iframe
    const targetUrl =
        "https://efgp.yuchens.com:8086/NaNaWeb/GP/WMS/PerformWorkItem/PerformRequesterActivity";
    const frames = page.frames();
    const functionContentFrame = frames.find((f) => f.url() === targetUrl);
    if (!functionContentFrame)
        throw new Error("找不到指定 url 的 functionContentFrame");

    // 抓第二層 iframe
    const innerIframe = await functionContentFrame.$("#ifmAppLocation");
    const innerFrame = await innerIframe.contentFrame();
    if (!innerFrame) throw new Error("innerFrame 為 null");

    // 點擊SR
    await innerFrame.waitForSelector("#ProjNoDiaglog_btn");
    await innerFrame.evaluate(() => ProjNoDiaglog_openDataChooser());
    await insertSr(page, data.pyrd, data.SR);
    // 點擊workitem
    await innerFrame.evaluate(() => WorkItem_openDataChooser());
    await insertWorkItem(page, data.workitem);
    // 其他值，直接給他value
    await inputOtherValues(innerFrame, data);

    // 提交表單
    await functionContentFrame.evaluate(() => invokeProcessWithoutSave());

    // 等待成功訊息出現
    let success = false;
    try {
        // 重新取得 frame，等待成功訊息
        await page.waitForFunction(
            () => {
                const frames = Array.from(window.parent.frames);
                for (const f of frames) {
                    try {
                        const header = f.document.querySelector(
                            "header.panel-heading"
                        );
                        if (
                            header &&
                            header.textContent.includes("流程已經發起成功")
                        ) {
                            return true;
                        }
                    } catch (e) {}
                }
                return false;
            },
            { timeout: 10000 }
        );
        success = true;
    } catch (e) {
        // 若沒等到訊息，仍繼續流程
        console.warn("未偵測到流程成功訊息，但流程可能已送出");
    }
};

// 插入 SR
const insertSr = async (page, pyrd, SR) => {
    // 等待新彈窗打開
    const newPagePromise = new Promise((resolve) =>
        page.browser().once("targetcreated", async (target) => {
            if (
                target.type() === "page" &&
                target.url().includes("customDataChooser")
            ) {
                const newPage = await target.page();
                await newPage.bringToFront();
                resolve(newPage);
            }
        })
    );
    const popup = await newPagePromise;
    try {
        // 等待彈窗加載完成
        const chevronSelector = ".spenTools.pull-right a.fa.fa-chevron-down";
        await popup.waitForSelector(chevronSelector, {
            visible: true,
        });
        const chevronElement = await popup.$(chevronSelector);
        if (chevronElement) {
            // 確保元素可點擊
            await popup.evaluate((el) => {
                el.scrollIntoView({
                    behavior: "auto",
                    block: "center",
                    inline: "center",
                });
            }, chevronElement);
            await chevronElement.click();
        }
        await popup.waitForSelector("#_cuzDataChooser_criteria_1");
        if (SR) {
            await popup.type("#_cuzDataChooser_criteria_1", SR); // 輸入 SR
            // 點擊搜尋
            await popup.waitForSelector("#_btnCustomDataChooser_query");
            await popup.click("#_btnCustomDataChooser_query");
            // 點擊目標
            try {
                await withRetry(
                    waitForKeywordInElements,
                    [popup, "#divBpmList_pcTable tbody tr td", SR],
                    1,
                    "選取SR"
                ).then((el) => el.click());
            } catch (error) {
                await popup.click("#_btnCustomDataChooser_query");
                await withRetry(
                    waitForKeywordInElements,
                    [popup, "#divBpmList_pcTable tbody tr td", SR],
                    1,
                    "選取SR重試"
                ).then((el) => el.click());
            }
        } else {
            await popup.type("#_cuzDataChooser_criteria_0", pyrd); // 輸入 pyrd
            // 點擊搜尋
            await popup.waitForSelector("#_btnCustomDataChooser_query");
            await popup.click("#_btnCustomDataChooser_query");
            // 點擊第一個目標
            const elements = await popup.$$("#divBpmList_pcTable tbody tr td");
            if (elements.length > 0) {
                await elements[0].click();
            } else {
                throw new Error("找不到任何可點擊的目標");
            }
        }
        console.log("[關閉彈窗] SR選擇完畢，關閉彈窗");
    } catch (err) {
        console.error("[彈窗錯誤] SR選擇彈窗處理失敗：", err.message);
        throw err;
    }
};

// 插入工作項目
const insertWorkItem = async (page, workitem = "系統開發") => {
    // 等待新彈窗打開
    const newPagePromise = new Promise((resolve) =>
        page.browser().once("targetcreated", async (target) => {
            if (
                target.type() === "page" &&
                target.url().includes("customDataChooser")
            ) {
                const newPage = await target.page();
                await newPage.bringToFront();
                resolve(newPage);
            }
        })
    );
    const popup = await newPagePromise;
    try {
        await popup.waitForSelector("#divBpmList_pcTable tbody tr td");
        await withRetry(
            waitForKeywordInElements,
            [popup, "#divBpmList_pcTable tbody tr td", workitem],
            1,
            "選取工作項目"
        ).then((el) => el.click());
        console.log("[關閉彈窗] 工作項目選擇完畢，關閉彈窗");
    } catch (err) {
        console.error("[彈窗錯誤] 工作項目選擇彈窗處理失敗：", err.message);
        throw err;
    }
};

const inputOtherValues = async (frame, data) => {
    console.log("輸入其他值...");
    // 日期
    await frame.waitForSelector("#WorkDate_txt");
    await frame.evaluate((date) => {
        const input = document.querySelector("#WorkDate_txt");
        input.value = date.replaceAll("-", "/");
    }, data.date);
    console.log("1");
    // 工時
    await frame.waitForSelector("#WorkHour");
    await frame.type("#WorkHour", `${data.time}`);
    console.log("2");
    // 描述
    const desc = `${data.taskId},${data.role}\n${data.detail}`;
    await frame.waitForSelector("#WorkDesc");
    await frame.type("#WorkDesc", `${desc}`);
    console.log("3");
};

// 等待指定關鍵字出現在元素中
const waitForKeywordInElements = async (
    frame,
    selector,
    keyword,
    timeout = 10000,
    interval = 300
) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const elements = await frame.$$(selector);
        for (const el of elements) {
            const text = await frame.evaluate((el) => el.textContent || "", el);
            if (text.includes(keyword)) {
                return el;
            }
        }
        await new Promise((res) => setTimeout(res, interval));
    }
    throw new Error(
        `Timeout: No element in "${selector}" contains keyword "${keyword}"`
    );
};

// runCrawler()
//     .then(() => console.log("done"))
//     .catch(console.error);
export { handleRequest };
