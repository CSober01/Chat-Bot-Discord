const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const botConfigPath = path.join(__dirname, "../config/botConfig.json");
const { hasExceededTimeout } = require("../utils/timeUtils");
const { BOT_SETTINGS } = require("../config/settings");

// โหลดค่า activeUsers จากไฟล์
let activeUsers = {};

// ตรวจสอบและสร้างไฟล์ botConfig.json ถ้าไม่พบ
function ensureBotConfigExists() {
  if (!fs.existsSync(botConfigPath)) {
    const defaultConfig = { activeUsers: {} };
    fs.writeFileSync(botConfigPath, JSON.stringify(defaultConfig, null, 2));
    logger.info("🆕 สร้างไฟล์ botConfig.json ใหม่สำเร็จ!");
  }
}

// โหลด activeUsers จากไฟล์
function loadActiveUsers() {
  ensureBotConfigExists();
  try {
    const data = fs.readFileSync(botConfigPath, "utf8");
    activeUsers = JSON.parse(data).activeUsers || {};
    logger.info("🔄 โหลด activeUsers สำเร็จ!");
  } catch (error) {
    logger.error("⚠️ โหลด activeUsers ไม่สำเร็จ:", error);
  }
}

// บันทึก activeUsers ลงไฟล์
function saveActiveUsers() {
  fs.writeFileSync(botConfigPath, JSON.stringify({ activeUsers }, null, 2));
}

// อัปเดตเวลาการใช้งานของผู้ใช้
function updateUserActivity(userId, hasInteracted = false) {
  if (!activeUsers[userId]) {
    activeUsers[userId] = { lastActive: Date.now(), hasInteracted };
  } else {
    activeUsers[userId].lastActive = Date.now();
    if (hasInteracted) activeUsers[userId].hasInteracted = true;
  }
  saveActiveUsers();
}

// ✅ ตรวจสอบและลบผู้ใช้ที่เงียบเกินเวลา
function checkInactiveUsers(client) {
  setInterval(async () => {
    for (const userId in activeUsers) {
      const { lastActive, hasInteracted } = activeUsers[userId];

      if (hasExceededTimeout(lastActive, BOT_SETTINGS.ACTIVE_TIMEOUT)) {  
        if (hasInteracted) {
          try {
            const user = await client.users.fetch(userId);
            await user.send("⏳ คุณไม่ได้ตอบกลับมานานเกินไปแล้ว! หากต้องการคุยใหม่ กรุณา mention (@) บอทอีกครั้ง 😊");
          } catch (error) {
            logger.error(`❌ ไม่สามารถส่งข้อความหา ${userId}: ${error.message}`);
          }
        }
        delete activeUsers[userId];
        saveActiveUsers();
        logger.info(`🔄 ผู้ใช้ ${userId} ถูกลบออกจาก activeUsers เนื่องจากไม่ active`);
      }
    }
  }, BOT_SETTINGS.INTERVAL_CHECK); // ✅ ใช้ค่า INTERVAL_CHECK จาก settings.js
}

/** 
 * ✅ ฟังก์ชันลบข้อความใน Discord (รวมถึง DM ที่บอทส่ง)
 */
async function handleDelete(interaction) {
  try {
    await interaction.deferReply({ flags: 64 });

    const amount = interaction.options.getInteger("amount");

    if (!amount || amount <= 0 || amount > 100) {
      return await interaction.editReply("⚠️ โปรดระบุค่าระหว่าง 1 ถึง 100");
    }

    const channel = interaction.channel;

    if (!channel) {
      return await interaction.editReply("❌ ไม่สามารถลบข้อความได้ (ไม่พบช่องทางสนทนา)");
    }

    // 🔹 ลบข้อความใน DM (เฉพาะข้อความที่บอทส่ง)
    if (channel.isDMBased()) {
      const messages = await channel.messages.fetch({ limit: amount });

      // กรองเฉพาะข้อความที่บอทเป็นคนส่ง
      const botMessages = messages.filter(msg => msg.author.id === interaction.client.user.id);

      if (botMessages.size === 0) {
        return await interaction.editReply("📭 ไม่มีข้อความของบอทให้ลบใน DM");
      }

      for (const msg of botMessages.values()) {
        await msg.delete();
      }

      return await interaction.editReply(`📭 ลบ ${botMessages.size} ข้อความของบอทใน DM เรียบร้อยครับ ✨`);
    }

    // 🔹 ลบข้อความในเซิร์ฟเวอร์ (สามารถลบข้อความทุกประเภท)
    const fetchedMessages = await channel.messages.fetch({ limit: amount });
    await channel.bulkDelete(fetchedMessages, true);

    await interaction.editReply(`🧹 ลบ ${fetchedMessages.size} ข้อความเรียบร้อยครับ ✨`);
  } catch (error) {
    logger.error("❌ ลบข้อความล้มเหลว:", error);
    await interaction.editReply("❌ ไม่สามารถลบข้อความได้");
  }
}

// เรียก loadActiveUsers ทันทีเมื่อไฟล์ถูกโหลด
loadActiveUsers();

module.exports = { activeUsers, updateUserActivity, checkInactiveUsers, handleDelete, loadActiveUsers };
