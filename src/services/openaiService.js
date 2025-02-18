const { CohereClient } = require("cohere-ai");
const dotenv = require("dotenv");
dotenv.config();
const { COHERE_API_KEY, AI_SETTINGS, RESPONSE_SETTINGS, BOT_INFO } = require("../config/settings");
const { max_tokens, temperature, k, stopSequences, returnLikelihoods } = AI_SETTINGS;
const { BOT_NAME, ENDING_PHRASE } = RESPONSE_SETTINGS;
const { NAME } = BOT_INFO;
const cohere = new CohereClient({
  token: COHERE_API_KEY,
});
const logger = require("../utils/logger");

// ✅ กำหนด system prompt ให้ AI เข้าใจบริบท
const systemPrompt = `
คุณเป็นแชทบอทที่ช่วยตอบคำถามของผู้ใช้
- ตอบให้กระชับและตรงประเด็น (หากคำตอบยาวเกินไป ให้แยกเป็นส่วนๆหรือสรุป)
- ถ้าคำถามคลุมเครือ ให้ขอรายละเอียดเพิ่มเติม
- ถ้าผู้ใช้ไม่ได้ทักทายไม่ต้องแนะนำตัว
- ถ้าคำถามไม่เกี่ยวข้อง ให้ปฏิเสธอย่างสุภาพ
- เรียกแทนตัวเองว่า "${BOT_NAME}" (ใช้เพื่อแนะนำตัวหรือเมื่อผู้ใช้ถาม)
- ลงท้ายคำตอบด้วย "${ENDING_PHRASE}"
- ชื่อของคุณคือ "${NAME}"
- วันเวลาปัจจุบันคือ ${new Date().toLocaleString()} (ไม่ต้องใช้ในการแนะนำตัว)
`.trim();

/**
 * ✅ ฟังก์ชันส่งข้อความไปยัง AI Cohere
 * @param {string} context - บริบทของการสนทนา (ข้อความก่อนหน้า)
 * @param {string} prompt - ข้อความที่ผู้ใช้พิมพ์
 * @returns {Promise<string>} - คำตอบจาก AI
 */
async function askCohere(context, prompt) {
  try {
    logger.info(`📨 ส่งข้อความไปยัง AI: "${prompt}"`); // 🔹 Log ข้อความที่ส่งให้ AI

    // ตรวจสอบว่ามี channel ใน context หรือไม่
    if (context.channel && typeof context.channel.sendTyping === "function") {
      // แสดงสถานะ "กำลังพิมพ์"
      await context.channel.sendTyping();
    }

    const response = await cohere.generate({
      model: "command-xlarge-nightly",
      prompt: `${systemPrompt}\n\nบริบท:\n${context}\n\nคำถามของผู้ใช้:\n${prompt}`, // ใช้ systemPrompt
      max_tokens: max_tokens,
      temperature: temperature,
      k: k,
      stopSequences: stopSequences,
      returnLikelihoods: returnLikelihoods
    });

    if (!response || !response.generations || response.generations.length === 0) {
      throw new Error("ไม่มีการตอบกลับจาก AI");
    }

    const reply = response.generations[0].text.trim() || `ขอโทษ${ENDING_PHRASE} 🥲 ระบบ AI มีปัญหา ❗`;
    logger.info(`📩 ตอบกลับผู้ใช้: "${reply}"`); // 🔹 Log ข้อความที่ AI ตอบกลับ

    return reply;
  } catch (error) {
    logger.error("❌ Error with Cohere:", error);
    return `เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI ${ENDING_PHRASE} 😓`;
  }
}

module.exports = { askCohere };
