const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  // 🔑 API Keys
  COHERE_API_KEY: process.env.COHERE_API_KEY,

  // ⚙️ ตั้งค่าเปิด-ปิดฟีเจอร์
  FEATURE_SETTINGS: {
    ENABLE_CHATBOT: true,         // เปิด-ปิด Chat Bot
    ENABLE_HANDLE_DELETE: true,   // เปิด-ปิดคำสั่ง /delete
  },

  // 🤖 ตั้งค่า AI
  AI_SETTINGS: {
    max_tokens: 200,              // จำกัดจำนวนคำตอบให้สั้นลง (ไม่เกิน 64000)
    temperature: 0.3,             // ลดความ random ให้ตอบตรงประเด็น (ไม่เกิน 1)
    k: 0,                         // จำนวนตัวเลือกที่ต้องการให้ AI พิจารณา (0 หมายถึงไม่จำกัด ไม่เกิน 500)
    stopSequences: [],            // ลำดับของข้อความที่ใช้หยุดการสร้างข้อความ
    returnLikelihoods: "NONE"     // ไม่ต้องการให้ AI คืนค่าความน่าจะเป็นของแต่ละคำ (แนะนำให้ปิด)
  },
  
  // ⚙️ ตั้งค่า Bot
  BOT_SETTINGS: {
    MESSAGE_HISTORY_LIMIT: 5,     // จำนวนข้อความก่อนหน้าที่ใช้เป็น context (ต้องไม่เกิน 100)
    ACTIVE_TIMEOUT: 3,            // ระยะเวลาที่ผู้ใช้จะยัง active ได้หลัง mention บอท (นาที)
    INTERVAL_CHECK: 15_000,       // เวลาในการเช็ก inactive users (วินาที)
  },

  // 🗣️ การตั้งค่าการตอบกลับ
  RESPONSE_SETTINGS: {
    BOT_NAME: "ผม",               // ชื่อที่บอทใช้เรียกแทนตัวเอง
    ENDING_PHRASE: "ครับ",        // คำลงท้ายที่บอทใช้ในการตอบกลับ
  },

  // 📛 ชื่อของบอท
  BOT_INFO: {
    NAME: "SeaBot",               // ชื่อของบอท
  },
};
