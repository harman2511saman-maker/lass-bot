const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const http = require('http');

// 1. Create a simple server to keep Render happy (Port Scan Timeout fix)
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running properly!\n');
}).listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// 2. Initialize Firebase
// Make sure "serviceAccountKey.json" is in the same folder
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://prsyarbka-b78f8-default-rtdb.firebaseio.com"
    });
}

const db = admin.firestore();
// Use your token from BotFather
const bot = new TelegramBot('8278393908:AAGes1TOJRRdmJAPMWA071ce30nufwoRxN0', {polling: true});

console.log("✅ Firebase & Bot are ready!");

// 3. Simple Bot Command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "بەخێرهاتی! بۆتەکە بە سەرکەوتوویی لەسەر Render کار دەکات.");
});

bot.on('message', (msg) => {
    if (msg.text !== '/start') {
        console.log("New message received:", msg.text);
    }
});
