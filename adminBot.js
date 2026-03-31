const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const http = require('http');

// بۆ ئەوەی Render سێرڤەرەکە ڕانەگرێت
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is Live and Running!');
}).listen(process.env.PORT || 3000);

const http = require('http');
const port = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running properly!\n');
}).listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
// دەستپێکردنی فایەربەیس بە فایلە نوێیەکە
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://prsyarbka-b78f8-default-rtdb.firebaseio.com"
    });
}

const db = admin.firestore();
const bot = new TelegramBot('8278393908:AA...تۆکنی_بۆتەکەت...', {polling: true});

console.log("✅ Firebase & Bot are ready!");

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === '/start') {
        bot.sendMessage(chatId, "بەخێربێیت! بۆتەکە بە سەرکەوتوویی بەستراوەتەوە بە داتابەیس.");
    }
});
