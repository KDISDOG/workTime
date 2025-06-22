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

const runCrawler = async (data, { userName, password }) => {
    const successIds = [];
    const failIds = [];
    let browser;
    try {
        console.log("啟動爬蟲...");
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"],
        });
        const page = await browser.newPage();
        await page.goto(
            "https://efgp.yuchens.com:8086/NaNaWeb/GP/ForwardIndex?hdnMethod=findIndexForward"
        );
        await handleLogin(page, { userName, password });
        for (const el of data) {
            try {
                await goToApplicationForm(page);
                await handleDataInjection(page, el);
                successIds.push(el.id);
            } catch (err) {
                console.error("處理單筆資料時發生錯誤，或重新再試", err);
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
                    : "部分資料注入失敗",
        };
    } catch (err) {
        console.error("runCrawler 發生錯誤:", err);
        return { success: false, error: err.message, successIds, failIds };
    } finally {
        if (browser) await browser.close();
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
    const functionContentFrame = await functionFrame.contentFrame();
    await functionContentFrame.waitForSelector(
        ".processCategory[data-process-category='9df75040e41910048cdea4cc20f29288']"
    );
    await functionContentFrame.evaluate(() =>
        toggleProcessCategoryCotainer("9df75040e41910048cdea4cc20f29288")
    );
    await functionContentFrame.waitForSelector(
        ".processPackage[data-process-name='工時申請單']"
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
    await waitForKeywordInElements(
        functionContentFrame,
        "header.panel-heading",
        "流程已經發起成功"
    );
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
            await waitForKeywordInElements(
                popup,
                "#divBpmList_pcTable tbody tr td",
                SR
            ).then((el) => el.click());
        } catch (error) {
            await popup.click("#_btnCustomDataChooser_query");
            await waitForKeywordInElements(
                popup,
                "#divBpmList_pcTable tbody tr td",
                SR
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

    // 等待彈窗加載完成
    await popup.waitForSelector("#divBpmList_pcTable tbody tr td");
    // 找到內容為 workitem 的 td 並點擊其所在的 tr
    await waitForKeywordInElements(
        popup,
        "#divBpmList_pcTable tbody tr td",
        workitem
    ).then((el) => el.click());
};

const inputOtherValues = async (frame, data) => {
    console.log("輸入其他值...");
    // 日期
    await frame.waitForSelector("#WorkDate_txt");
    await frame.evaluate((date) => {
        const input = document.querySelector("#WorkDate_txt");
        input.value = date;
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
