const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { error } = require("console");

// กำหนดที่อยู่ของไฟล์ log
const logDirPath = path.join(__dirname, "../logs");
const logFilePath = path.join(logDirPath, "bot.log");

// ฟังก์ชันตรวจสอบและสร้างโฟลเดอร์และไฟล์ log ถ้าไม่พบ
function ensureLogFileExists() {
  if (!fs.existsSync(logDirPath)) {
    fs.mkdirSync(logDirPath);
    console.info("🆕 สร้างโฟลเดอร์ logs ใหม่สำเร็จ!");
  }
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, "");
    console.info("🆕 สร้างไฟล์ log ใหม่สำเร็จ!");
  }
}

// ฟังก์ชันจัดการขนาดของไฟล์ log
function manageLogFileSize() {
  ensureLogFileExists(); // ตรวจสอบและสร้างไฟล์ log ก่อน
  const maxFileSize = 1 * 1024 * 1024; // 1MB
  fs.stat(logFilePath, (err, stats) => {
    if (err) {
      console.error("ไม่สามารถตรวจสอบขนาดไฟล์ log ได้:", err);
      return;
    }

    if (stats.size > maxFileSize) {
      // หากขนาดไฟล์ log เกินขีดจำกัดที่กำหนด, ลบ log ที่เก่าสุด
      fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error("ไม่สามารถอ่านไฟล์ log:", err);
          return;
        }

        const logEntries = data.split('\n').filter(entry => entry.trim() !== '');
        logEntries.shift(); // ลบ log ที่เก่าสุด

        fs.writeFile(logFilePath, logEntries.join('\n') + '\n', (err) => {
          if (err) {
            console.error("ไม่สามารถเขียนไฟล์ log:", err);
          } else {
            console.warn("ไฟล์ log เกินขนาดและถูกลบ log ที่เก่าสุดแล้ว");
          }
        });
      });
    }
  });
}

// ฟังก์ชันเพื่อแสดง timestamp
function getFormattedTimestamp() {
  const now = new Date();
  return `[${now.toISOString().replace('T', ', ').replace(/\..+/, '')}]`; // ปรับรูปแบบ timestamp
}

// ฟังก์ชัน logMessage ที่จะบันทึก log
function logMessage(level, message, showInConsole = true) {
  manageLogFileSize();
  const timestamp = getFormattedTimestamp();
  const logEntry = `${timestamp} ${level}  ${message}`;

  // ✅ บันทึกลงไฟล์ log เสมอ
  fs.appendFileSync(logFilePath, logEntry + "\n");

  // ✅ แสดงผลใน Console เฉพาะ log ที่กำหนดให้แสดง
  if (showInConsole) {
    let color;
    switch (level) {
      case "[INFO] :":
        color = chalk.green;
        break;
      case "[WARN] :":
        color = chalk.yellow;
        break;
      case "[ERROR]:":
        color = chalk.red;
        break;
      default:
        color = chalk.white;
    }
    console.log(color(logEntry.trim()));
  }
}

// ฟังก์ชันสำหรับใช้ในไฟล์อื่น
module.exports = {
  info: (msg, showInConsole = true) => logMessage("[INFO] :", msg, showInConsole),
  warn: (msg, showInConsole = true) => logMessage("[WARN] :", msg, showInConsole),
  error: (msg, showInConsole = true) => logMessage("[ERROR]:", msg, showInConsole),
};
