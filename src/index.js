const dotenv = require("dotenv");
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { handleDelete } = require("./controllers/userController");
const { handleChat } = require("./controllers/chatController");
const { fetchMessageHistory } = require("./services/messageService");
const { updateUserActivity, checkInactiveUsers, activeUsers } = require("./controllers/userController");
const logger = require("./utils/logger");
const { BOT_SETTINGS, FEATURE_SETTINGS } = require("./config/settings");

// โหลด ENV
dotenv.config();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// ตั้งค่าการเปิด-ปิดฟีเจอร์
const { ENABLE_CHATBOT, ENABLE_HANDLE_DELETE } = FEATURE_SETTINGS;

// จำนวนข้อความก่อนหน้าที่ใช้เป็น context
const MESSAGE_HISTORY_LIMIT = BOT_SETTINGS.MESSAGE_HISTORY_LIMIT;

// สร้าง Client ของ Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Event เมื่อบอทพร้อมทำงาน
client.once("ready", () => {
  logger.info(`✅ Logged in as ${client.user.tag}!`);
});

// Handle Delete Command
if (ENABLE_HANDLE_DELETE) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "delete") {
      await handleDelete(interaction);
    }
  });
}

// Handle Chat Bot Mentions
if (ENABLE_CHATBOT) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content) return;
    const userId = message.author.id;

    // เช็กว่าผู้ใช้ mention บอท หรือเป็นผู้ที่ active อยู่แล้ว
    const isMentioned = message.mentions.has(client.user);
    const isActive = activeUsers[userId] !== undefined;
    const channelName = message.channel.type === 1 ? "DM" : message.channel.name;

    if (isMentioned && !isActive) {
      // ✅ 1. mention ครั้งแรก แต่ไม่มีข้อความ → ทักทาย
      const prompt = message.content.replace(`<@${client.user.id}>`, "").trim();
      logger.info(`📢 @mention จาก ${message.author.tag} ในช่อง ${channelName}`);

      if (!prompt) {
        updateUserActivity(userId, false);
        return message.reply("สวัสดีครับ 😊 มีอะไรให้ช่วยเหรอครับ?");
      }

      // ✅ 2. mention ครั้งแรก มีข้อความ → บอทเรียก AI ตอบ **(ไม่ต้องอ่านประวัติ)**
      updateUserActivity(userId, true);
      return await handleChat(message, prompt);
    }

    if (isMentioned && isActive) {
      // ✅ 3. mention โดย activeUser
      logger.info(`📢 @mention ซ้ำจาก ${message.author.tag} ในช่อง ${channelName}`);
      updateUserActivity(userId, true);

      const prompt = message.content.replace(`<@${client.user.id}>`, "").trim();
      if (!prompt) {
        return message.reply("ครับ 😊 ให้ช่วยอะไรครับ?");
      }

      // 📌 อ่านเฉพาะประวัติของ user นั้น **ถึงข้อความ mention ล่าสุด**
      const context = await fetchMessageHistory(message.channel, userId, MESSAGE_HISTORY_LIMIT, true);
      return await handleChat(message, prompt, context);
    }

    if (isActive && !isMentioned) {
      // ✅ 5. activeUser และพิมพ์ข้อความ → บอทเรียก AI ตอบ **(อ่านเฉพาะประวัติ user นั้น ถึงข้อความ mention ล่าสุด)**
      updateUserActivity(userId, true);

      if (!message.content.trim()) return;

      logger.info(`💬 activeUser ${message.author.tag} ส่งข้อความ`, false);
      const context = await fetchMessageHistory(message.channel, userId, MESSAGE_HISTORY_LIMIT, true);
      return await handleChat(message, message.content.trim(), context);
    }
  });

  checkInactiveUsers(client);
}

// เข้าสู่ระบบ Discord
client.login(DISCORD_TOKEN);
