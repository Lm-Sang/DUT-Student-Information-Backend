import { access } from "node:fs/promises";
import { join, isAbsolute } from "node:path";
import puppeteer from "puppeteer-core";
import { pdfConfig } from "../../config/pdf.js";
import { AppError } from "../../shared/errors/app-error.js";

async function findBrowser(configured) {
  const candidates = configured
    ? [configured]
    : process.platform === "win32"
      ? [
          join(
            process.env["PROGRAMFILES(X86)"] || "C:/Program Files (x86)",
            "Microsoft/Edge/Application/msedge.exe",
          ),
          join(
            process.env.PROGRAMFILES || "C:/Program Files",
            "Microsoft/Edge/Application/msedge.exe",
          ),
          join(
            process.env.PROGRAMFILES || "C:/Program Files",
            "Google/Chrome/Application/chrome.exe",
          ),
        ]
      : [
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/usr/bin/google-chrome",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ];
  for (const candidate of candidates) {
    if (!isAbsolute(candidate)) continue;
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }
  throw new AppError(
    "Chưa có trình duyệt xuất PDF. Cấu hình PDF_BROWSER_EXECUTABLE trên máy BE.",
    503,
  );
}

export function createPdfRenderer({
  executablePath = pdfConfig.executablePath,
  launch = (options) => puppeteer.launch(options),
  concurrency = 1,
  maxQueued = 8,
  waitTimeoutMs = 20000,
  idleMs = 30000,
} = {}) {
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    !Number.isInteger(maxQueued) ||
    maxQueued < 0
  )
    throw new TypeError("Invalid PDF renderer limits");
  let browserPromise,
    idleTimer,
    active = 0,
    closed = false;
  const waiting = [];
  const busy = () =>
    new AppError(
      "Máy chủ đang tạo nhiều PDF. Vui lòng mở lại đúng link đơn sau ít giây.",
      503,
      { retryAfterSeconds: 5 },
    );
  async function browser() {
    if (!browserPromise) {
      const pending = (async () => {
        const browser = await launch({
          executablePath: await findBrowser(executablePath),
          headless: true,
          pipe: true,
          timeout: 15000,
          handleSIGINT: false,
          handleSIGTERM: false,
          handleSIGHUP: false,
          args: [
            "--disable-gpu",
            "--disable-background-networking",
            "--no-first-run",
          ],
        });
        browser.once("disconnected", () => {
          if (browserPromise === pending) browserPromise = undefined;
        });
        return browser;
      })();
      browserPromise = pending;
      pending.catch(() => {
        if (browserPromise === pending) browserPromise = undefined;
      });
    }
    return browserPromise;
  }
  async function closeBrowser() {
    const pending = browserPromise;
    browserPromise = undefined;
    if (pending)
      await pending.then((instance) => instance.close()).catch(() => {});
  }
  function start(job) {
    clearTimeout(job.timer);
    clearTimeout(idleTimer);
    active++;
    Promise.resolve()
      .then(job.task)
      .then(job.resolve, job.reject)
      .finally(() => {
        active--;
        const next = waiting.shift();
        if (next) start(next);
        else if (!active && !closed) {
          idleTimer = setTimeout(closeBrowser, idleMs);
          idleTimer.unref();
        }
      });
  }
  function run(task) {
    return new Promise((resolve, reject) => {
      if (closed) return reject(busy());
      const job = { task, resolve, reject };
      if (active < concurrency) return start(job);
      if (waiting.length >= maxQueued) return reject(busy());
      job.timer = setTimeout(() => {
        const index = waiting.indexOf(job);
        if (index >= 0) {
          waiting.splice(index, 1);
          reject(busy());
        }
      }, waitTimeoutMs);
      waiting.push(job);
    });
  }
  return Object.freeze({
    render(html) {
      return run(async () => {
        let context;
        try {
          context = await (await browser()).createBrowserContext();
          const page = await context.newPage();
          await page.setJavaScriptEnabled(false);
          await page.setRequestInterception(true);
          page.on("request", (request) => request.abort().catch(() => {}));
          await page.setContent(html, { waitUntil: "load", timeout: 15000 });
          const bytes = Buffer.from(
            await page.pdf({
              format: "A4",
              preferCSSPageSize: true,
              printBackground: true,
              timeout: 15000,
              displayHeaderFooter: true,
              headerTemplate: "<span></span>",
              footerTemplate:
                '<div style="width:100%;font-size:8px;text-align:right;padding-right:17mm;color:#174b87"><span class="pageNumber"></span>/<span class="totalPages"></span></div>',
            }),
          );
          if (bytes.subarray(0, 5).toString() !== "%PDF-")
            throw new Error("Invalid PDF");
          return bytes;
        } catch (error) {
          if (error instanceof AppError) throw error;
          throw new AppError(
            "Chưa tạo được PDF. Vui lòng thử lại đúng đơn đã xác nhận.",
            503,
          );
        } finally {
          await context?.close().catch(() => {});
        }
      });
    },
    async close() {
      closed = true;
      clearTimeout(idleTimer);
      for (const job of waiting.splice(0)) {
        clearTimeout(job.timer);
        job.reject(busy());
      }
      await closeBrowser();
    },
    get stats() {
      return { active, queued: waiting.length };
    },
  });
}
export const pdfRenderer = createPdfRenderer();
