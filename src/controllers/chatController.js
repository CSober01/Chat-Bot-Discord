const { fetchMessageHistory } = require("../services/messageService");
const { askCohere } = require("../services/openaiService");
const logger = require("../utils/logger");

async function handleChat(message, prompt, context = "") {
  try {
    if (!message || !message.channel) {
      console.error("❌ Error: message หรือ channel เป็น undefined");
      return;
    }

    // แสดงสถานะ "กำลังพิมพ์" หรือ "กำลังคิด"
    await message.channel.sendTyping();

    const language = detectLanguage(prompt); // ตรวจสอบภาษาของผู้ใช้
    const reply = await askCohere(context, prompt, language); // ส่ง context เป็นข้อความรวม
    logger.info(`📨 ส่งข้อความไปยัง AI: "${prompt}"`, false);

    if (!reply || reply.trim() === "") {
      logger.warn("⚠️ AI ไม่สามารถสร้างคำตอบได้");

      const response = language === "th" ? "ผมไม่สามารถตอบคำถามนี้ได้ในขณะนี้ครับ 😓" : "I cannot answer this question at the moment 😓";
      if (typeof message.reply === "function") {
        return message.reply(response);
      } else {
        return message.channel.send(response);
      }
    }

    if (typeof message.reply === "function") {
      message.reply(reply);
    } else {
      message.channel.send(reply);
    }

    logger.info(`📩 ตอบกลับผู้ใช้: "${reply}"`, false);
  } catch (error) {
    console.error("❌ Error while handling chat:", error);
    logger.error(`❌ เกิดข้อผิดพลาดขณะตอบกลับ: ${error.message}`);
  }
}

function detectLanguage(text) {
  // ฟังก์ชันตรวจสอบภาษา (สามารถใช้ library เช่น franc หรือ langdetect)
  // ตัวอย่างนี้จะใช้การตรวจสอบง่ายๆ
  const thaiPattern = /[\u0E00-\u0E7F]/;
  return thaiPattern.test(text) ? "th" : "en";
}

module.exports = { handleChat };
