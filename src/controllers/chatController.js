const { fetchMessageHistory } = require("../services/messageService");
const { askCohere } = require("../services/openaiService");
const logger = require("../utils/logger");

async function handleChat(message, prompt) {
  try {
    if (!message || !message.channel) {
      console.error("❌ Error: message หรือ channel เป็น undefined");
      return;
    }

    await message.channel.sendTyping();

    const context = await fetchMessageHistory(message.channel, message.author.id, 5);
    const reply = await askCohere(context, `โปรดสรุปให้สั้นและเข้าใจง่าย: ${prompt}`);
    logger.info(`📨 ส่งข้อความไปยัง AI: "${prompt}"`, false);

    if (!reply || reply.trim() === "") {
      logger.warn("⚠️ AI ไม่สามารถสร้างคำตอบได้");

      const response = "ผมไม่สามารถตอบคำถามนี้ได้ในขณะนี้ครับ 😓";
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
  }สมใ
}

module.exports = { handleChat };
