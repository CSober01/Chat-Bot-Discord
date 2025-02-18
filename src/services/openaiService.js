const { CohereClient } = require("cohere-ai");
const dotenv = require("dotenv");
dotenv.config();
const { COHERE_API_KEY, AI_SETTINGS, RESPONSE_SETTINGS, BOT_INFO } = require("../config/settings");
const { max_tokens, temperature } = AI_SETTINGS;
const { BOT_NAME, ENDING_PHRASE } = RESPONSE_SETTINGS;
const { NAME } = BOT_INFO;
const cohere = new CohereClient({
  token: COHERE_API_KEY,
});
const logger = require("../utils/logger");

// ✅ กำหนด system prompt ให้ AI เข้าใจบริบท
const systemPrompt = `
คุณเป็นแชทบอทที่ช่วยตอบคำถามของผู้ใช้
- ตอบให้กระชับและตรงประเด็น
- ถ้าคำถามคลุมเครือ ให้ขอรายละเอียดเพิ่มเติม
- ถ้าคำถามไม่เกี่ยวข้อง ให้ปฏิเสธอย่างสุภาพ
- เรียกแทนตัวเองว่า "${BOT_NAME}"
- ลงท้ายคำตอบด้วย "${ENDING_PHRASE}"
- ชื่อของคุณคือ "${NAME}"
- วันเวลาปัจจุบันคือ ${new Date().toLocaleString()}
`.trim();

/**
 * ✅ ฟังก์ชันส่งข้อความไปยัง AI Cohere
 * @param {string} context - บริบทของการสนทนา (ข้อความก่อนหน้า)
 * @param {string} prompt - ข้อความที่ผู้ใช้พิมพ์
 * @param {string} language - ภาษาของผู้ใช้
 * @returns {Promise<string>} - คำตอบจาก AI
 */
async function askCohere(context, prompt, language) {
  try {
    logger.info(`📨 ส่งข้อความไปยัง AI: "${prompt}"`); // 🔹 Log ข้อความที่ส่งให้ AI

    // ตรวจสอบว่ามี channel ใน context หรือไม่
    if (context.channel && typeof context.channel.sendTyping === "function") {
      // แสดงสถานะ "กำลังพิมพ์"
      await context.channel.sendTyping();
    }

    const response = await cohere.chat({
      model: "command-xlarge-nightly",
      message: `${systemPrompt}\n\nบริบท:\n${context}\n\nคำถามของผู้ใช้ (${language}):\n${prompt}`, // ใช้ systemPrompt
      maxTokens: max_tokens,
      temperature: temperature,
    });

    if (!response || !response.text) {
      throw new Error("ไม่มีการตอบกลับจาก AI");
    }

    const reply = response.text.trim() || (language === "th" ? `ขอโทษ${ENDING_PHRASE} 🥲 ระบบ AI มีปัญหา ❗` : "Sorry, the AI system is having issues ❗");
    logger.info(`📩 ตอบกลับผู้ใช้: "${reply}"`); // 🔹 Log ข้อความที่ AI ตอบกลับ

    return reply;
  } catch (error) {
    logger.error("❌ Error with Cohere:", error);
    return language === "th" ? `เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI ${ENDING_PHRASE} 😓` : "There was an error connecting to the AI 😓";
  }
}

function detectLanguage(text) {
  // ฟังก์ชันตรวจสอบภาษา (สามารถใช้ library เช่น franc หรือ langdetect)
  // ตัวอย่างนี้จะใช้การตรวจสอบง่ายๆ
  const thaiPattern = /[\u0E00-\u0E7F]/;
  return thaiPattern.test(text) ? "th" : "en";
}

module.exports = { askCohere, detectLanguage };
