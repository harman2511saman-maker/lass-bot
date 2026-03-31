const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const express = require('express'); // بەکارهێنانی express بۆ Render

const app = express();
app.use(express.json());

const token = '8278393908:AAGes1TOJRRdmJAPMWA071ce30nufwoRxN0'; // تۆکنە نوێیەکە
const bot = new TelegramBot(token, { polling: true });

// Firebase Initialization
const serviceAccount = require("./serviceAccountKey.json");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://prsyarbka-b78f8-default-rtdb.firebaseio.com"
    });
}

// ڕێگریکردن لە وەستانی سێرڤەرەکە لە Render
app.get('/', (req, res) => res.send('Bot is Live!'));
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

console.log("✅ Bot is monitoring messages...");

// وەڵامدانەوەی نامەکان
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "سڵاو! نامەکەت گەیشت: " + msg.text);
});
