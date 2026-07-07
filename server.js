const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const token = '8865295022:AAFOI0vU6hMHo2QbF2LbL74uDYdi8rr01Lk';
const bot = new TelegramBot(token, { polling: true });

// Hàm phân tích hash siêu táo bạo
function analyzeHash(hash) {
    // Kiểm tra loại hash
    const hashType = hash.length === 32 ? 'MD5' : hash.length === 64 ? 'SHA256' : 'UNKNOWN';
    
    if (hashType === 'UNKNOWN') {
        return {
            error: '❌ Hash không hợp lệ! Chỉ hỗ trợ MD5 (32 ký tự) và SHA256 (64 ký tự)'
        };
    }
    
    // Phân tích chi tiết hash
    let totalSum = 0;
    let evenCount = 0;
    let oddCount = 0;
    let primeCount = 0;
    let hexValues = [];
    let pairSums = [];
    let triplePatterns = [];
    
    // Thu thập dữ liệu từ hash
    for (let i = 0; i < hash.length; i++) {
        const char = hash[i];
        const num = parseInt(char, 16);
        totalSum += num;
        hexValues.push(num);
        
        if (num % 2 === 0) evenCount++;
        else oddCount++;
        
        // Kiểm tra số nguyên tố
        if ([2, 3, 5, 7, 11, 13].includes(num)) primeCount++;
    }
    
    // Phân tích cặp số
    for (let i = 0; i < hash.length - 1; i += 2) {
        const pair = hash.substring(i, i + 2);
        const pairNum = parseInt(pair, 16);
        pairSums.push(pairNum);
    }
    
    // Phân tích mẫu 3 ký tự
    for (let i = 0; i < hash.length - 2; i += 3) {
        const triple = hash.substring(i, i + 3);
        const tripleNum = parseInt(triple, 16);
        triplePatterns.push(tripleNum);
    }
    
    // THUẬT TOÁN DỰ ĐOÁN SIÊU TÁO BẠO
    
    // 1. Thuật toán dựa trên tổng các chữ số
    const sumAlgorithm = (totalSum % 2 === 0) ? 'TÀI' : 'XỈU';
    const sumWeight = 85 + (totalSum % 15); // Độ tin cậy từ 85-100%
    
    // 2. Thuật toán dựa trên số chẵn/lẻ
    const evenOddAlgorithm = (evenCount > oddCount) ? 'TÀI' : 'XỈU';
    const evenOddWeight = 75 + (Math.abs(evenCount - oddCount) * 2);
    
    // 3. Thuật toán dựa trên số nguyên tố
    const primeAlgorithm = (primeCount > (hash.length / 4)) ? 'TÀI' : 'XỈU';
    const primeWeight = 70 + (primeCount * 3);
    
    // 4. Thuật toán dựa trên giá trị trung bình
    const avgValue = totalSum / hash.length;
    const avgAlgorithm = (avgValue > 7.5) ? 'TÀI' : 'XỈU';
    const avgWeight = 80 + Math.abs(avgValue - 7.5) * 2;
    
    // 5. Thuật toán dựa trên cặp số
    const avgPairSum = pairSums.reduce((a, b) => a + b, 0) / pairSums.length;
    const pairAlgorithm = (avgPairSum > 127) ? 'TÀI' : 'XỈU';
    const pairWeight = 75 + (avgPairSum / 10);
    
    // 6. Thuật toán dựa trên mẫu 3 ký tự
    const avgTriple = triplePatterns.reduce((a, b) => a + b, 0) / triplePatterns.length;
    const tripleAlgorithm = (avgTriple > 2047) ? 'TÀI' : 'XỈU';
    const tripleWeight = 70 + (avgTriple / 100);
    
    // 7. Thuật toán dựa trên bit cuối
    const lastChar = parseInt(hash[hash.length - 1], 16);
    const lastAlgorithm = (lastChar > 7) ? 'TÀI' : 'XỈU';
    const lastWeight = 65 + (lastChar * 2);
    
    // 8. Thuật toán dựa trên sự phân bố
    let distributionScore = 0;
    for (let i = 0; i < hexValues.length - 1; i++) {
        const diff = Math.abs(hexValues[i] - hexValues[i + 1]);
        distributionScore += diff;
    }
    const distAlgorithm = (distributionScore / hexValues.length > 4) ? 'TÀI' : 'XỈU';
    const distWeight = 70 + (distributionScore / hexValues.length);
    
    // Tổng hợp tất cả thuật toán
    const algorithms = [
        { name: 'Tổng giá trị', result: sumAlgorithm, weight: Math.min(sumWeight, 100) },
        { name: 'Chẵn/Lẻ', result: evenOddAlgorithm, weight: Math.min(evenOddWeight, 100) },
        { name: 'Số nguyên tố', result: primeAlgorithm, weight: Math.min(primeWeight, 100) },
        { name: 'Giá trị trung bình', result: avgAlgorithm, weight: Math.min(avgWeight, 100) },
        { name: 'Cặp số', result: pairAlgorithm, weight: Math.min(pairWeight, 100) },
        { name: 'Mẫu 3 ký tự', result: tripleAlgorithm, weight: Math.min(tripleWeight, 100) },
        { name: 'Bit cuối', result: lastAlgorithm, weight: Math.min(lastWeight, 100) },
        { name: 'Phân bố', result: distAlgorithm, weight: Math.min(distWeight, 100) }
    ];
    
    // Tính điểm cho TÀI và XỈU
    let taiScore = 0;
    let xiuScore = 0;
    let taiWeight = 0;
    let xiuWeight = 0;
    
    algorithms.forEach(algo => {
        if (algo.result === 'TÀI') {
            taiScore += algo.weight;
            taiWeight++;
        } else {
            xiuScore += algo.weight;
            xiuWeight++;
        }
    });
    
    // Tính phần trăm
    const totalAlgorithms = algorithms.length;
    const taiPercent = (taiScore / (taiScore + xiuScore)) * 100;
    const xiuPercent = (xiuScore / (taiScore + xiuScore)) * 100;
    
    // Quyết định cuối cùng với độ tin cậy siêu cao
    let finalResult;
    let confidence;
    let dominance;
    
    if (taiPercent > xiuPercent) {
        finalResult = 'TÀI';
        confidence = taiPercent.toFixed(2);
        dominance = taiWeight / totalAlgorithms * 100;
    } else if (xiuPercent > taiPercent) {
        finalResult = 'XỈU';
        confidence = xiuPercent.toFixed(2);
        dominance = xiuWeight / totalAlgorithms * 100;
    } else {
        // Trường hợp hòa, dùng thuật toán đặc biệt
        const specialHash = crypto.createHash('sha256').update(hash + 's2king_premium').digest('hex');
        const specialChar = parseInt(specialHash[0], 16);
        finalResult = specialChar > 7 ? 'TÀI' : 'XỈU';
        confidence = '52.00';
        dominance = '50.00';
    }
    
    // Tạo báo cáo phân tích chi tiết
    let analysisReport = `🔬 *PHÂN TÍCH HASH SIÊU TÁO BẠO*\n\n`;
    analysisReport += `📌 *Hash Type*: ${hashType}\n`;
    analysisReport += `🔢 *Hash Length*: ${hash.length} characters\n\n`;
    
    analysisReport += `📊 *THUẬT TOÁN PHÂN TÍCH:*\n`;
    algorithms.forEach((algo, index) => {
        const emoji = algo.result === 'TÀI' ? '🔴' : '🔵';
        analysisReport += `${index + 1}. ${algo.name}: ${emoji} ${algo.result} (${algo.weight.toFixed(1)}%)\n`;
    });
    
    analysisReport += `\n🎯 *KẾT QUẢ DỰ ĐOÁN:*\n`;
    analysisReport += `🔴 *TÀI*: ${taiPercent.toFixed(1)}% (${taiWeight}/${totalAlgorithms} thuật toán)\n`;
    analysisReport += `🔵 *XỈU*: ${xiuPercent.toFixed(1)}% (${xiuWeight}/${totalAlgorithms} thuật toán)\n`;
    analysisReport += `\n🔥 *FINAL: ${finalResult}* 🏆\n`;
    analysisReport += `📊 *Độ tin cậy*: ${confidence}%\n`;
    analysisReport += `💪 *Sức mạnh thuật toán*: ${dominance.toFixed(1)}% thống trị`;
    
    return {
        result: finalResult,
        confidence: confidence,
        analysis: analysisReport,
        hashType: hashType,
        stats: {
            taiPercent: taiPercent,
            xiuPercent: xiuPercent,
            taiAlgorithms: taiWeight,
            xiuAlgorithms: xiuWeight,
            totalAlgorithms: totalAlgorithms
        }
    };
}

// Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        `👑 *S2KING-PREMIUM - SIÊU PREDICTOR*\n\n` +
        `🔥 *Phân tích MD5/SHA256 siêu táo bạo*\n` +
        `🎯 *Dự đoán Tài/Xỉu với độ chính xác tối đa*\n\n` +
        `📌 *Cách sử dụng:*\n` +
        `🔹 /predict <MD5_hash> - Phân tích hash MD5\n` +
        `🔹 /predict <SHA256_hash> - Phân tích hash SHA256\n` +
        `🔹 /taixiu <hash> - Dự đoán Tài/Xỉu từ hash\n\n` +
        `💎 *S2KING-PREMIUM v3.0*`,
        { parse_mode: 'Markdown' }
    );
});

// Lệnh dự đoán từ hash
bot.onText(/\/predict (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const hash = match[1].trim().toLowerCase();
    
    // Kiểm tra hash hợp lệ
    if (!/^[a-f0-9]+$/.test(hash)) {
        bot.sendMessage(chatId, 
            '❌ *Hash không hợp lệ!*\nChỉ chấp nhận ký tự hex (0-9, a-f)',
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    const result = analyzeHash(hash);
    
    if (result.error) {
        bot.sendMessage(chatId, result.error, { parse_mode: 'Markdown' });
        return;
    }
    
    bot.sendMessage(chatId, result.analysis, { parse_mode: 'Markdown' });
});

// Lệnh tài xỉu
bot.onText(/\/taixiu (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const hash = match[1].trim().toLowerCase();
    
    if (!/^[a-f0-9]+$/.test(hash)) {
        bot.sendMessage(chatId, 
            '❌ *Hash không hợp lệ!*\nChỉ chấp nhận ký tự hex (0-9, a-f)',
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    const result = analyzeHash(hash);
    
    if (result.error) {
        bot.sendMessage(chatId, result.error, { parse_mode: 'Markdown' });
        return;
    }
    
    const response = `🎰 *DỰ ĐOÁN TÀI/XỈU*\n\n` +
        `${result.result === 'TÀI' ? '🔴' : '🔵'} *Kết quả*: ${result.result}\n` +
        `📊 *Độ tin cậy*: ${result.confidence}%\n` +
        `🔢 *Loại hash*: ${result.hashType}\n` +
        `📈 *Tỷ lệ*: TÀI ${result.stats.taiPercent.toFixed(1)}% - XỈU ${result.stats.xiuPercent.toFixed(1)}%\n` +
        `⚡ *Sức mạnh*: ${result.stats.taiAlgorithms}/${result.stats.totalAlgorithms} thuật toán ủng hộ`;
    
    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// Web server
app.get('/', (req, res) => {
    res.json({
        name: 'S2KING-PREMIUM',
        version: '3.0.0',
        status: '🚀 ACTIVE',
        features: ['MD5 Analysis', 'SHA256 Analysis', 'Tài/Xỉu Predictor']
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('👑 S2KING-PREMIUM ONLINE!');
    console.log(`🚀 Port: ${PORT}`);
    console.log('🔥 Siêu Predictor đã sẵn sàng!');
});