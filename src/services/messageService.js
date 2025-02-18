const logger = require("../utils/logger");

async function fetchMessageHistory(channel, userId, limit = 5, mentionOnly = false) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 }); // ดึงสูงสุด 100 ข้อความ
    let userMessages = [];
    let botMentioned = false;

    for (const msg of messages.values()) {
      if (msg.author.id === userId) {
        userMessages.push(`${msg.author.username}: ${msg.content}`); // ✅ ใส่ชื่อ User
      }

      if (mentionOnly && msg.mentions.has(channel.client.user)) {
        botMentioned = true;
        break; // ✅ หยุดที่ mention ล่าสุด
      }
    }

    // ถ้า mentionOnly = true แต่ไม่พบ mention บอท ให้ใช้ข้อความทั้งหมดของ userId แทน
    if (mentionOnly && !botMentioned) {
      logger.warn("⚠️ ไม่พบข้อความ mention บอทล่าสุด ใช้ข้อความของ user ทั้งหมดแทน");
    }

    return userMessages.slice(0, limit).reverse(); // ✅ จำกัดจำนวน และเรียงใหม่
  } catch (error) {
    logger.error("❌ Error fetching message history:", error);
    return [];
  }
}

module.exports = { fetchMessageHistory };
