const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const http = require('http');

// 1. Create Server for Render (To avoid Port Scan Timeout)
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is Live and Running!\n');
}).listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// 2. Initialize Firebase
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://prsyarbka-b78f8-default-rtdb.firebaseio.com"
    });
}

const db = admin.firestore();
const bot = new TelegramBot('8278393908:AAGes1TOJRRdmJAPMWA071ce30nufwoRxN0', {polling: true});

console.log("✅ Firebase & Bot are ready!");

// 3. Bot Logic
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, "بەخێرهاتی! بۆتەکە بە سەرکەوتوویی کار دەکات.");
    }
});
