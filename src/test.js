const { CohereClient } = require("cohere-ai");
const dotenv = require("dotenv");
const { Client, GatewayIntentBits } = require("discord.js");
dotenv.config();

const { COHERE_API_KEY, AI_SETTINGS } = require("./config/settings");
const { max_tokens, temperature } = AI_SETTINGS;
const cohere = new CohereClient({
  token: COHERE_API_KEY,
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content) return;

  try {
    const userMessage = message.content;
    const language = detectLanguage(userMessage); // ตรวจสอบภาษาของผู้ใช้

    // แสดงสถานะ "กำลังพิมพ์" หรือ "กำลังคิด"
    await message.channel.sendTyping();

    const stream = await cohere.chatStream({
      model: "command-xlarge-nightly",
      message: userMessage, // รับข้อความจากผู้ใช้ใน Discord
      max_tokens,
      temperature,
      promptTruncation: "AUTO"
    });

    let reply = "";
    for await (const chat of stream) {
      if (chat.eventType === "text-generation") {
        reply += chat.text;
      }
    }

    message.reply(reply.trim() || "ขอโทษครับ 🥲 ระบบ AI มีปัญหา ❗");
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    message.reply("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI ครับ 😓");
  }
});

function detectLanguage(text) {
  // ฟังก์ชันตรวจสอบภาษา (สามารถใช้ library เช่น franc หรือ langdetect)
  // ตัวอย่างนี้จะใช้การตรวจสอบง่ายๆ
  const thaiPattern = /[\u0E00-\u0E7F]/;
  return thaiPattern.test(text) ? "th" : "en";
}

client.login(DISCORD_TOKEN);
