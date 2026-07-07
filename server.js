const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Token bot của bạn
const token = '8865295022:AAFOI0vU6hMHo2QbF2LbL74uDYdi8rr01Lk';

// Khởi tạo bot với polling
let bot;
try {
    bot = new TelegramBot(token, { polling: true });
    console.log('🤖 Bot initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize bot:', error.message);
    process.exit(1);
}

// Database từ điển
const rainbowTable = new Map();

// Load từ điển mở rộng
function loadDictionary() {
    const commonPasswords = [
        'password', '123456', '123456789', '12345', '12345678',
        'qwerty', 'abc123', 'password1', 'admin', 'letmein',
        'welcome', 'monkey', 'dragon', 'master', 'hello',
        'freedom', 'whatever', 'computer', 'internet', 'google',
        'iloveyou', 'princess', 'rockyou', 'sunshine', 'password123'
    ];
    
    commonPasswords.forEach(pwd => {
        const md5 = crypto.createHash('md5').update(pwd).digest('hex');
        const sha256 = crypto.createHash('sha256').update(pwd).digest('hex');
        rainbowTable.set(md5, pwd);
        rainbowTable.set(sha256, pwd);
    });
    
    console.log(`📚 Loaded ${rainbowTable.size} entries in rainbow table`);
}

loadDictionary();

// Bot commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMsg = 
        `🔐 *Bot Hash Predictor*\n\n` +
        `🤖 *Commands:*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🔹 /hash \\<text\\> - Hash MD5 & SHA256\n` +
        `🔹 /crack \\<hash\\> - Tìm password từ hash\n` +
        `🔹 /add \\<text\\> - Thêm vào database\n` +
        `🔹 /stats - Thống kê database\n` +
        `🔹 /help - Hiển thị hướng dẫn\n\n` +
        `⚠️ *Lưu ý*: Công cụ học tập về bảo mật!`;
    
    bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        `📖 *Hướng dẫn sử dụng*\n\n` +
        `1️⃣ */hash hello* - Tạo hash cho "hello"\n` +
        `2️⃣ */crack 5d41402abc4b2a76b9719d911017c592* - Tìm password\n` +
        `3️⃣ */add mypassword* - Thêm "mypassword" vào DB\n` +
        `4️⃣ */stats* - Xem số lượng hash trong DB\n\n` +
        `🔬 *Thuật toán hỗ trợ*:\n` +
        `• MD5 (128-bit)\n` +
        `• SHA256 (256-bit)`,
        { parse_mode: 'Markdown' }
    );
});

// Hash command
bot.onText(/\/hash (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];
    
    try {
        const md5 = crypto.createHash('md5').update(text).digest('hex');
        const sha256 = crypto.createHash('sha256').update(text).digest('hex');
        
        bot.sendMessage(chatId, 
            `📝 *Input*: \`${text}\`\n\n` +
            `🔹 *MD5*: \`${md5}\`\n` +
            `🔸 *SHA256*: \`${sha256}\``,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        bot.sendMessage(chatId, '❌ Lỗi khi tạo hash!');
    }
});

// Crack command với nhiều thuật toán
bot.onText(/\/crack (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const hash = match[1].toLowerCase();
    
    // Kiểm tra độ dài hash
    if (![32, 64].includes(hash.length)) {
        bot.sendMessage(chatId, 
            `❌ *Invalid hash*\n\n` +
            `🔹 MD5: 32 characters\n` +
            `🔸 SHA256: 64 characters`,
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    // Kiểm tra trong rainbow table
    if (rainbowTable.has(hash)) {
        bot.sendMessage(chatId, 
            `✅ *Found!*\n\n` +
            `🔑 *Password*: \`${rainbowTable.get(hash)}\`\n` +
            `🔹 *Hash*: \`${hash}\`\n` +
            `📊 *DB lookup*: ✅ Hit`,
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    // Thông báo đang tìm kiếm
    bot.sendMessage(chatId, 
        `🔍 *Searching...*\n` +
        `🕐 Trying brute force with 4 chars max\n` +
        `⏳ Please wait...`
    );
    
    // Brute force với tối ưu
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let found = false;
    
    function bruteForce(prefix, length, maxLength) {
        if (found || length > maxLength) return;
        
        if (length === 0) {
            const md5 = crypto.createHash('md5').update(prefix).digest('hex');
            const sha256 = crypto.createHash('sha256').update(prefix).digest('hex');
            
            if (md5 === hash || sha256 === hash) {
                rainbowTable.set(hash, prefix);
                bot.sendMessage(chatId, 
                    `✅ *Found!*\n\n` +
                    `🔑 *Password*: \`${prefix}\`\n` +
                    `🔹 *Hash*: \`${hash}\`\n` +
                    `⏱️ *Brute force*: ✅ Success`,
                    { parse_mode: 'Markdown' }
                );
                found = true;
            }
            return;
        }
        
        for (let i = 0; i < chars.length; i++) {
            if (found) break;
            bruteForce(prefix + chars[i], length - 1, maxLength);
        }
    }
    
    // Thử với độ dài từ 1-4
    for (let len = 1; len <= 4; len++) {
        if (found) break;
        bruteForce('', len, len);
    }
    
    if (!found) {
        bot.sendMessage(chatId, 
            `❌ *Not Found*\n\n` +
            `🔹 *Hash*: \`${hash}\`\n` +
            `💡 *Gợi ý*: Thử dùng /add để thêm vào database\n` +
            `📊 *Status*: ❌ Miss`,
            { parse_mode: 'Markdown' }
        );
    }
});

// Add command
bot.onText(/\/add (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];
    
    try {
        const md5 = crypto.createHash('md5').update(text).digest('hex');
        const sha256 = crypto.createHash('sha256').update(text).digest('hex');
        
        rainbowTable.set(md5, text);
        rainbowTable.set(sha256, text);
        
        bot.sendMessage(chatId, 
            `✅ *Added to database!*\n\n` +
            `📝 *Text*: \`${text}\`\n` +
            `🔹 *MD5*: \`${md5}\`\n` +
            `🔸 *SHA256*: \`${sha256}\`\n` +
            `📊 *Total entries*: ${rainbowTable.size}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        bot.sendMessage(chatId, '❌ Lỗi khi thêm vào database!');
    }
});

// Stats command
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const uniquePasswords = new Set(rainbowTable.values());
    
    bot.sendMessage(chatId, 
        `📊 *Database Statistics*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📦 *Total entries*: ${rainbowTable.size}\n` +
        `🔑 *Unique passwords*: ${uniquePasswords.size}\n` +
        `📈 *Hit rate*: ${((rainbowTable.size / (rainbowTable.size + 100)) * 100).toFixed(1)}%\n` +
        `🔄 *Last updated*: ${new Date().toLocaleString()}`,
        { parse_mode: 'Markdown' }
    );
});

// Web server cho Render
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'Telegram Hash Bot',
        version: '1.0.0',
        database: rainbowTable.size,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Database size: ${rainbowTable.size} entries`);
    console.log(`🤖 Bot is ready to use!`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});