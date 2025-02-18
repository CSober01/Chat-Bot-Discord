const { BOT_SETTINGS } = require("../config/settings"); // ดึงค่า ACTIVE_TIMEOUT

/**
 * ✅ ฟังก์ชันจัดรูปแบบวันเวลาเป็น [YYYY-MM-DD, HH:mm:ss]
 */
function getFormattedTimestamp() {
  const now = new Date();
  return `[${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
    .getDate()
    .toString()
    .padStart(2, "0")}, ${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}]`;
}

// แปลงเวลาจาก milliseconds เป็นข้อความที่อ่านง่าย
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));

  if (hours > 0) return `${hours} ชั่วโมง ${minutes} นาที`;
  if (minutes > 0) return `${minutes} นาที ${seconds} วินาที`;
  return `${seconds} วินาที`;
}

/**
 * ✅ คำนวณเวลาที่เหลือก่อนหมด active
 * @param {number} lastActive - เวลาที่ผู้ใช้ active ล่าสุด (timestamp)
 * @returns {string} - เวลาที่เหลือในรูปแบบข้อความ หรือ "หมดเวลาแล้ว"
 */
function getTimeRemaining(lastActive) {
  const now = Date.now();
  const timeoutMs = BOT_SETTINGS.ACTIVE_TIMEOUT * 60 * 1000;
  const elapsed = now - lastActive;
  const remaining = timeoutMs - elapsed;
  return remaining > 0 ? formatTime(remaining) : "หมดเวลาแล้ว";
}

/**
 * ✅ ตรวจสอบว่าเกินเวลาที่กำหนดหรือไม่
 * @param {number} lastActive - เวลาที่ผู้ใช้ active ล่าสุด (timestamp)
 * @returns {boolean} - true ถ้าเกินเวลา, false ถ้ายังไม่เกิน
 */
function hasExceededTimeout(lastActive) {
  const now = Date.now();
  const timeoutMs = BOT_SETTINGS.ACTIVE_TIMEOUT * 60 * 1000;
  return now - lastActive > timeoutMs;
}

// ฟังก์ชันสำหรับใช้ในไฟล์อื่น
module.exports = { formatTime, getTimeRemaining, getFormattedTimestamp, hasExceededTimeout };
