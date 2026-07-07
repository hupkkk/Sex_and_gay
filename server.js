// server.js
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Token bot của bạn
const token = '8865295022:AAFOI0vU6hMHo2QbF2LbL74uDYdi8rr01Lk';
const bot = new TelegramBot(token, { polling: true });

// Database từ điển đơn giản (chỉ demo)
const rainbowTable = new Map();

// Load từ điển phổ biến
function loadDictionary() {
    const commonPasswords = [
        'password', '123456', '123456789', '12345', '12345678',
        'qwerty', 'abc123', 'password1', 'admin', 'letmein',
        'welcome', 'monkey', 'dragon', 'master', 'hello',
        'freedom', 'whatever', 'computer', 'internet', 'google'
    ];
    
    commonPasswords.forEach(pwd => {
        const md5 = crypto.createHash('md5').update(pwd).digest('hex');
        const sha256 = crypto.createHash('sha256').update(pwd).digest('hex');
        rainbowTable.set(md5, pwd);
        rainbowTable.set(sha256, pwd);
    });
}

loadDictionary();

// Bot commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        `🔐 *Bot Hash Predictor*\n\n` +
        `Commands:\n` +
        `/hash <text> - Hash text với MD5 & SHA256\n` +
        `/crack <hash> - Thử tìm hash (MD5/SHA256)\n` +
        `/add <text> - Thêm vào database\n` +
        `/stats - Thống kê database\n\n` +
        `⚠️ *Lưu ý*: Đây chỉ là công cụ học tập!`, 
        { parse_mode: 'Markdown' }
    );
});

// Hash command
bot.onText(/\/hash (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];
    
    const md5 = crypto.createHash('md5').update(text).digest('hex');
    const sha256 = crypto.createHash('sha256').update(text).digest('hex');
    
    bot.sendMessage(chatId, 
        `📝 *Input*: \`${text}\`\n\n` +
        `🔹 *MD5*: \`${md5}\`\n` +
        `🔸 *SHA256*: \`${sha256}\``,
        { parse_mode: 'Markdown' }
    );
});

// Crack command với nhiều thuật toán
bot.onText(/\/crack (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const hash = match[1].toLowerCase();
    
    // Kiểm tra trong rainbow table
    if (rainbowTable.has(hash)) {
        bot.sendMessage(chatId, 
            `✅ *Found!*\n\n` +
            `🔑 *Password*: \`${rainbowTable.get(hash)}\`\n` +
            `🔹 *Hash*: \`${hash}\``,
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    // Brute-force với charset giới hạn (chỉ demo)
    bot.sendMessage(chatId, 
        `🔍 *Đang tìm kiếm...*\n` +
        `🕐 Vui lòng đợi (giới hạn 4 ký tự)`
    );
    
    // Brute force 4 ký tự (demo)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let found = false;
    
    function bruteForce(prefix, length) {
        if (found || length > 4) return;
        
        if (length === 0) {
            const md5 = crypto.createHash('md5').update(prefix).digest('hex');
            const sha256 = crypto.createHash('sha256').update(prefix).digest('hex');
            
            if (md5 === hash || sha256 === hash) {
                rainbowTable.set(hash, prefix);
                bot.sendMessage(chatId, 
                    `✅ *Found!*\n\n` +
                    `🔑 *Password*: \`${prefix}\`\n` +
                    `🔹 *Hash*: \`${hash}\``,
                    { parse_mode: 'Markdown' }
                );
                found = true;
            }
            return;
        }
        
        for (let i = 0; i < chars.length; i++) {
            bruteForce(prefix + chars[i], length - 1);
        }
    }
    
    bruteForce('', 4);
    
    if (!found) {
        bot.sendMessage(chatId, 
            `❌ *Not Found*\n\n` +
            `🔹 *Hash*: \`${hash}\`\n` +
            `💡 *Gợi ý*: Thử dùng /add để thêm vào database`,
            { parse_mode: 'Markdown' }
        );
    }
});

// Add command
bot.onText(/\/add (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];
    
    const md5 = crypto.createHash('md5').update(text).digest('hex');
    const sha256 = crypto.createHash('sha256').update(text).digest('hex');
    
    rainbowTable.set(md5, text);
    rainbowTable.set(sha256, text);
    
    bot.sendMessage(chatId, 
        `✅ *Added to database!*\n\n` +
        `📝 *Text*: \`${text}\`\n` +
        `🔹 *MD5*: \`${md5}\`\n` +
        `🔸 *SHA256*: \`${sha256}\``,
        { parse_mode: 'Markdown' }
    );
});

// Stats command
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        `📊 *Database Stats*\n\n` +
        `📦 Total entries: ${rainbowTable.size}\n` +
        `🔹 Unique hashes: ${new Set(rainbowTable.keys()).size}\n` +
        `🔑 Unique passwords: ${new Set(rainbowTable.values()).size}`,
        { parse_mode: 'Markdown' }
    );
});

// Web server cho Render
app.get('/', (req, res) => {
    res.send('🤖 Bot is running!');
});

app.listen(PORT, () => {
    console.log(`🚀 Bot running on port ${PORT}`);
    console.log(`📊 Database size: ${rainbowTable.size}`);
});