import 'dotenv/config';
import { Telegraf } from 'telegraf';
import admin from 'firebase-admin';
import cron from 'node-cron';

// --- CONFIGURATION ---
const BOT_TOKEN = '8278393908:AAGes1TOJRRdmJAPMWA07lcE3OnufwoRxN0'.trim(); 
const ADMIN_ID = '6563416734'; // Harman's Telegram ID

console.log(`🤖 Initializing Bot (Token: 8278393908...)`);
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(SERVICE_ACCOUNT_PATH)
    });
    console.log('✅ Firebase Admin Initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin. Ensure serviceAccountKey.json exists.');
    process.exit(1);
  }
}

const db = admin.firestore();
const bot = new Telegraf(BOT_TOKEN);

// --- SECURITY MIDDLEWARE ---
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id.toString();
  if (userId !== ADMIN_ID) {
    console.log(`🚫 Unauthorized access attempt from ID: ${userId}`);
    return ctx.reply('🛑 Access Denied. Only the administrator can use this bot.');
  }
  return next();
});

// Error handling to prevent crashes
bot.catch((err, ctx) => {
  console.error(`🔥 Telegraf Error for ${ctx.updateType}:`, err);
});

// --- COMMANDS ---

// 1. Add Expense: خەرجی [amount] [note]
bot.hears(/^خەرجی\s+(\d+)\s+(.+)$/u, async (ctx) => {
  const amount = parseInt(ctx.match[1]);
  const note = ctx.match[2];
  const date = new Date();

  try {
    await db.collection('expenses').add({
      amount,
      note,
      date: admin.firestore.Timestamp.fromDate(date),
      timestamp: date.getTime()
    });
    ctx.reply(`✅ خەرجی تۆمارکرا:\n💰 بڕ: ${amount.toLocaleString()} دینار\n📝 تێبینی: ${note}`);
  } catch (error) {
    ctx.reply('❌ هەڵەیەک ڕوویدا لە کاتی تۆمارکردنی خەرجی.');
  }
});

// 2. Daily Report: /today
bot.command('today', async (ctx) => {
  try {
    const todayLocal = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const salesSnapshot = await db.collection('sales')
      .where('localDate', '==', todayLocal)
      .get();

    let totalSales = 0;
    let totalProfit = 0;
    let receiptsCount = salesSnapshot.size;

    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      totalSales += Number(sale.total) || 0;
      
      if (sale.profit !== undefined) {
        totalProfit += Number(sale.profit) || 0;
      } else if (sale.items) {
        sale.items.forEach(item => {
          totalProfit += (Number(item.price || 0) - Number(item.costPrice || 0)) * (Number(item.cartQuantity || 0) || 1);
        });
      }
    });

    const report = `📅 ڕاپۆرتی ڕۆژ: ${todayLocal}\n\n` +
      `کۆی فرۆشتن: ${totalSales.toLocaleString()} دینار\n\n` +
      `قازانجی ئەمڕۆ: ${totalProfit.toLocaleString()} دینار\n\n` +
      `ژمارەی پسوولە: ${receiptsCount}`;

    ctx.reply(report);
  } catch (error) {
    console.error('Report Error:', error);
    ctx.reply('❌ هەڵەیەک ڕوویدا لە ئامادەکردنی ڕاپۆرت.');
  }
});

// 3. Monthly Report: /salary
bot.command('salary', async (ctx) => {
  try {
    const now = new Date();
    const currentMonthPrefix = now.toLocaleDateString('en-CA').substring(0, 7); // YYYY-MM

    const salesSnapshot = await db.collection('sales')
      .where('localDate', '>=', `${currentMonthPrefix}-01`)
      .where('localDate', '<=', `${currentMonthPrefix}-31`)
      .get();

    let totalSales = 0;
    let totalProfit = 0;
    let receiptsCount = salesSnapshot.size;

    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      totalSales += Number(sale.total) || 0;
      
      if (sale.profit !== undefined) {
        totalProfit += Number(sale.profit) || 0;
      } else if (sale.items) {
        sale.items.forEach(item => {
          totalProfit += (Number(item.price || 0) - Number(item.costPrice || 0)) * (Number(item.cartQuantity || 0) || 1);
        });
      }
    });

    const report = `🗓️ ڕاپۆرتی مانگی: ${currentMonthPrefix}\n\n` +
      `فرۆشتنی گشتی مانگ: ${totalSales.toLocaleString()} دینار\n\n` +
      `قازانجی گشتی مانگ: ${totalProfit.toLocaleString()} دینار\n\n` +
      `سەرجەم پسوولەکانی ئەم مانگە: ${receiptsCount}`;

    ctx.reply(report);
  } catch (error) {
    console.error('Monthly Report Error:', error);
    ctx.reply('❌ هەڵەیەک ڕوویدا لە ئامادەکردنی ڕاپۆرتی مانگانە.');
  }
});



// --- LOW STOCK CHECK (Hourly) ---
const checkLowStock = async () => {
  try {
    const snapshot = await db.collection('products').where('quantity', '<', 10).get();
    if (snapshot.empty) return;

    let alertMsg = '⚠️ <b>ئاگاداری: کاڵا کەمبووەکان!</b>\n\n';
    snapshot.forEach(doc => {
      const p = doc.data();
      alertMsg += `🔹 ${p.name}: <b>${p.quantity}</b> دانە ماوە\n`;
    });

    bot.telegram.sendMessage(ADMIN_ID, alertMsg, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Stock Check Error:', error);
  }
};

// Cron: Every hour on the minute 0
cron.schedule('0 * * * *', checkLowStock);

// Run check once on startup
checkLowStock();

// --- START BOT ---
bot.launch().then(async () => {
  try {
    const me = await bot.telegram.getMe();
    console.log(`✅ Bot successfully connected to Telegram! (@${me.username})`);
  } catch (error) {
    console.error('❌ Failed to verify connection:', error.message);
  }
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
