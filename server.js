const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Token bot
const token = '8865295022:AAFOI0vU6hMHo2QbF2LbL74uDYdi8rr01Lk';
const bot = new TelegramBot(token, { polling: true });

// Database lưu kết quả
const history = [];
const stats = { tai: 0, xiu: 0 };
const users = new Map();

// Hàm tạo hash siêu táo bạo
function generateSuperHash(data) {
    const timestamp = Date.now();
    const salt = 's2king_mup_rup_super_secret_2026';
    const combined = `${data}|${timestamp}|${salt}|${Math.random()}`;
    
    // Tạo nhiều lớp hash
    let md5 = crypto.createHash('md5').update(combined).digest('hex');
    let sha256 = crypto.createHash('sha256').update(combined).digest('hex');
    
    // Kết hợp hash tạo thành "siêu hash"
    let superHash = '';
    for (let i = 0; i < 64; i++) {
        if (i < 32) {
            superHash += md5[i];
        } else {
            superHash += sha256[i - 32];
        }
    }
    
    // XOR các bit để tăng độ phức tạp
    let finalHash = '';
    for (let i = 0; i < superHash.length; i += 2) {
        const char1 = parseInt(superHash[i] || '0', 16);
        const char2 = parseInt(superHash[i + 1] || '0', 16);
        finalHash += (char1 ^ char2).toString(16);
    }
    
    return finalHash.padEnd(32, '0');
}

// Thuật toán dự đoán "táo bạo" dựa trên hash
function predictWithHash(hash) {
    // Phân tích hash để dự đoán
    let sum = 0;
    let evenCount = 0;
    let oddCount = 0;
    let hexSum = 0;
    
    for (let i = 0; i < hash.length; i++) {
        const char = hash[i];
        const num = parseInt(char, 16);
        sum += num;
        if (num % 2 === 0) evenCount++;
        else oddCount++;
        hexSum += num;
    }
    
    // Các thuật toán dự đoán "táo bạo"
    const algorithms = [
        // Thuật toán 1: Dựa vào tổng các số hex
        () => (hexSum % 2 === 0) ? 'TÀI' : 'XỈU',
        
        // Thuật toán 2: Dựa vào số chẵn/lẻ
        () => (evenCount > oddCount) ? 'TÀI' : 'XỈU',
        
        // Thuật toán 3: Dựa vào bit cuối
        () => {
            const lastChar = parseInt(hash[hash.length - 1], 16);
            return (lastChar > 7) ? 'TÀI' : 'XỈU';
        },
        
        // Thuật toán 4: Dựa vào vị trí đặc biệt
        () => {
            const middle = Math.floor(hash.length / 2);
            const midValue = parseInt(hash[middle], 16);
            return (midValue % 3 === 0) ? 'TÀI' : 'XỈU';
        },
        
        // Thuật toán 5: Dựa vào tổng các cặp số
        () => {
            let pairSum = 0;
            for (let i = 0; i < hash.length; i += 2) {
                const pair = hash.substring(i, i + 2);
                pairSum += parseInt(pair, 16) || 0;
            }
            return (pairSum % 5 > 2) ? 'TÀI' : 'XỈU';
        },
        
        // Thuật toán 6: Dựa vào Fibonacci của hash
        () => {
            let fib = 0;
            for (let i = 0; i < Math.min(hash.length, 10); i++) {
                fib += parseInt(hash[i], 16) * (i + 1);
            }
            return (fib % 7 > 3) ? 'TÀI' : 'XỈU';
        }
    ];
    
    // Chọn thuật toán ngẫu nhiên nhưng dựa trên hash
    const algoIndex = (sum % algorithms.length);
    return algorithms[algoIndex]();
}

// Thuật toán "siêu táo bạo" - kết hợp nhiều yếu tố
function superTaoBaoPredict(input) {
    // Tạo nhiều hash khác nhau
    const hash1 = generateSuperHash(input + 'round1');
    const hash2 = generateSuperHash(input + 'round2');
    const hash3 = generateSuperHash(input + 'round3');
    
    // Dự đoán từ mỗi hash
    const pred1 = predictWithHash(hash1);
    const pred2 = predictWithHash(hash2);
    const pred3 = predictWithHash(hash3);
    
    // Thống kê kết quả
    const results = [pred1, pred2, pred3];
    const taiCount = results.filter(r => r === 'TÀI').length;
    const xiuCount = results.filter(r => r === 'XỈU').length;
    
    // Quyết định cuối cùng
    let finalPrediction;
    let confidence;
    
    if (taiCount >= 2) {
        finalPrediction = 'TÀI';
        confidence = (taiCount / 3 * 100).toFixed(1);
    } else if (xiuCount >= 2) {
        finalPrediction = 'XỈU';
        confidence = (xiuCount / 3 * 100).toFixed(1);
    } else {
        // Nếu hòa, dùng thêm thuật toán phụ
        const extraHash = generateSuperHash(input + 'extra');
        const extraPred = predictWithHash(extraHash);
        finalPrediction = extraPred;
        confidence = '66.7';
    }
    
    // Tạo giải thích chi tiết
    const explanation = `🔮 PHÂN TÍCH SIÊU HASH:\n` +
        `📊 Hash1: ${hash1.substring(0, 10)}... → ${pred1}\n` +
        `📊 Hash2: ${hash2.substring(0, 10)}... → ${pred2}\n` +
        `📊 Hash3: ${hash3.substring(0, 10)}... → ${pred3}\n` +
        `🎯 Kết luận: ${finalPrediction} (Độ tin cậy ${confidence}%)`;
    
    return {
        prediction: finalPrediction,
        confidence: confidence,
        explanation: explanation,
        hashes: { hash1, hash2, hash3 }
    };
}

// Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMsg = `🎰 *S2KING MÚP RỤP - SIÊU PREDICTOR*\n\n` +
        `🔥 *DỰ ĐOÁN TÀI/XỈU CẤP ĐỘ VŨ TRỤ*\n` +
        `⚡ *THUẬT TOÁN MD5 × SHA256 SIÊU TÁO BẠO*\n\n` +
        `📌 *Commands:*\n` +
        `🔮 /taixiu - Dự đoán Tài/Xỉu\n` +
        `📊 /stats - Thống kê kết quả\n` +
        `📈 /history - Xem lịch sử\n` +
        `🎲 /random - Dự đoán ngẫu nhiên\n` +
        `⚡ /super - Siêu dự đoán 3 lượt\n\n` +
        `💎 *POWERED BY S2KING* 🚀`;
    
    bot.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
});

bot.onText(/\/taixiu/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Tạo dữ liệu ngẫu nhiên cho lượt chơi
    const roundData = `s2king_${Date.now()}_${Math.random()}_${userId}`;
    const result = superTaoBaoPredict(roundData);
    
    // Lưu lịch sử
    history.push({
        userId: userId,
        prediction: result.prediction,
        timestamp: new Date(),
        confidence: result.confidence
    });
    
    // Cập nhật stats
    if (result.prediction === 'TÀI') {
        stats.tai++;
    } else {
        stats.xiu++;
    }
    
    // Gửi kết quả
    const response = `🎰 *KẾT QUẢ DỰ ĐOÁN*\n\n` +
        `🔥 *${result.prediction}*\n` +
        `📊 *Độ tin cậy*: ${result.confidence}%\n\n` +
        `${result.explanation}\n\n` +
        `🕐 *Thời gian*: ${new Date().toLocaleString()}\n` +
        `👤 *Người chơi*: ${msg.from.first_name}`;
    
    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

bot.onText(/\/super/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Dự đoán 3 lượt
    const predictions = [];
    for (let i = 0; i < 3; i++) {
        const roundData = `s2king_super_${Date.now()}_${i}_${Math.random()}`;
        const result = superTaoBaoPredict(roundData);
        predictions.push(result);
    }
    
    let response = `⚡ *SIÊU DỰ ĐOÁN 3 LƯỢT*\n\n`;
    predictions.forEach((pred, index) => {
        response += `🎯 *Lượt ${index + 1}*: ${pred.prediction} (${pred.confidence}%)\n`;
    });
    
    // Thống kê
    const taiCount = predictions.filter(p => p.prediction === 'TÀI').length;
    const xiuCount = predictions.filter(p => p.prediction === 'XỈU').length;
    
    response += `\n📊 *Thống kê*: TÀI ${taiCount}/3 - XỈU ${xiuCount}/3\n`;
    response += `🎯 *Xu hướng*: ${taiCount > xiuCount ? 'TÀI' : xiuCount > taiCount ? 'XỈU' : 'Cân bằng'}`;
    
    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

bot.onText(/\/random/, (msg) => {
    const chatId = msg.chat.id;
    
    // Thuật toán ngẫu nhiên nhưng dựa trên hash
    const seed = `${Date.now()}_${Math.random()}`;
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const randomValue = parseInt(hash.substring(0, 8), 16) % 100;
    
    let result;
    let emoji;
    if (randomValue > 50) {
        result = 'TÀI';
        emoji = '🔴';
    } else {
        result = 'XỈU';
        emoji = '🔵';
    }
    
    bot.sendMessage(chatId, 
        `🎲 *DỰ ĐOÁN NGẪU NHIÊN*\n\n` +
        `${emoji} *Kết quả*: ${result}\n` +
        `📊 *Giá trị*: ${randomValue}/100\n` +
        `🔢 *Hash*: \`${hash.substring(0, 16)}...\``,
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const total = stats.tai + stats.xiu;
    const taiRate = total > 0 ? (stats.tai / total * 100).toFixed(1) : 0;
    const xiuRate = total > 0 ? (stats.xiu / total * 100).toFixed(1) : 0;
    
    const response = `📊 *THỐNG KÊ TÀI/XỈU*\n\n` +
        `📈 *Tổng lượt*: ${total}\n\n` +
        `🔴 *TÀI*: ${stats.tai} (${taiRate}%)\n` +
        `🔵 *XỈU*: ${stats.xiu} (${xiuRate}%)\n\n` +
        `🎯 *Tỷ lệ*: ${taiRate > xiuRate ? 'TÀI' : 'XỈU'} đang dẫn đầu\n` +
        `📊 *Chênh lệch*: ${Math.abs(stats.tai - stats.xiu)} lượt`;
    
    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

bot.onText(/\/history/, (msg) => {
    const chatId = msg.chat.id;
    const recent = history.slice(-10);
    
    if (recent.length === 0) {
        bot.sendMessage(chatId, '📭 *Chưa có lịch sử dự đoán*', { parse_mode: 'Markdown' });
        return;
    }
    
    let response = `📜 *LỊCH SỬ 10 LƯỢT GẦN NHẤT*\n\n`;
    recent.forEach((item, index) => {
        const emoji = item.prediction === 'TÀI' ? '🔴' : '🔵';
        response += `${index + 1}. ${emoji} ${item.prediction} (${item.confidence}%) - ${new Date(item.timestamp).toLocaleTimeString()}\n`;
    });
    
    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Web server
app.get('/', (req, res) => {
    res.json({
        name: 'S2KING MÚP RỤP - SIÊU PREDICTOR',
        version: '2.0.0',
        status: '🚀 ONLINE',
        stats: stats,
        totalPredictions: history.length
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 S2KING MÚP RỤP BOT ONLINE!`);
    console.log(`📊 Port: ${PORT}`);
    console.log(`🎯 Stats: TÀI ${stats.tai} - XỈU ${stats.xiu}`);
});