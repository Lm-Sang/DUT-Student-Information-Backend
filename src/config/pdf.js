import "./env.js";

export const pdfConfig = Object.freeze({
  executablePath: process.env.PDF_BROWSER_EXECUTABLE || "",
  printCookieSecret: process.env.LEAVE_PRINT_COOKIE_SECRET || "",
  secureCookies: process.env.NODE_ENV === "production",
});
