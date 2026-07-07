const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const token = '8865295022:AAFOI0vU6hMHo2QbF2LbL74uDYdi8rr01Lk';
const bot = new TelegramBot(token, { polling: true });

// ======================== THUẬT TOÁN DỰ ĐOÁN MỚI (SIÊU TÁO BẠO V2) ========================
function analyzeHash(hash) {
    // Chuẩn hóa
    hash = hash.toLowerCase().trim();
    const len = hash.length;
    
    // Kiểm tra loại hash
    let hashType = 'UNKNOWN';
    if (len === 32) hashType = 'MD5';
    else if (len === 64) hashType = 'SHA256';
    else {
        return {
            error: '❌ Hash không hợp lệ! Chỉ hỗ trợ MD5 (32 ký tự) hoặc SHA256 (64 ký tự)'
        };
    }

    // Chuyển chuỗi hex sang mảng số (0-15)
    const hexArr = hash.split('').map(c => parseInt(c, 16));
    const totalSum = hexArr.reduce((a, b) => a + b, 0);
    const avg = totalSum / len;

    // Các chỉ số thống kê cơ bản
    let evenCount = 0, oddCount = 0, primeCount = 0;
    let freq = Array(16).fill(0);
    hexArr.forEach(v => {
        freq[v]++;
        if (v % 2 === 0) evenCount++; else oddCount++;
        if ([2,3,5,7,11,13].includes(v)) primeCount++;
    });

    // Độ phân tán (entropy)
    let entropy = 0;
    for (let i = 0; i < 16; i++) {
        if (freq[i] > 0) {
            const p = freq[i] / len;
            entropy -= p * Math.log2(p);
        }
    }
    // Entropy max = log2(16) = 4, min = 0

    // Chia thành cặp và bộ ba
    const pairs = [];
    for (let i = 0; i < len - 1; i += 2) pairs.push(parseInt(hash.substr(i, 2), 16));
    const avgPair = pairs.length ? pairs.reduce((a,b)=>a+b,0)/pairs.length : 0;

    const triples = [];
    for (let i = 0; i < len - 2; i += 3) triples.push(parseInt(hash.substr(i, 3), 16));
    const avgTriple = triples.length ? triples.reduce((a,b)=>a+b,0)/triples.length : 0;

    // XOR toàn bộ
    let xorAll = 0;
    hexArr.forEach(v => xorAll ^= v);

    // Bit cuối (của từng ký tự hex -> lấy bit 0)
    let lastBitSum = 0;
    hexArr.forEach(v => lastBitSum += (v & 1));

    // Độ lệch chuẩn
    const variance = hexArr.reduce((s, v) => s + (v - avg) ** 2, 0) / len;
    const stddev = Math.sqrt(variance);

    // Số lần xuất hiện của các giá trị đặc biệt
    const zeroCount = freq[0];
    const fifteenCount = freq[15];

    // ========== XÂY DỰNG CÁC THUẬT TOÁN CON ==========
    // Mỗi thuật toán: { name, judge, weight } 
    // judge là hàm trả về 'TÀI' hoặc 'XỈU'
    // weight là trọng số (0-100)

    const algorithms = [];

    // 1. Tổng chẵn/lẻ
    algorithms.push({
        name: 'Tổng chẵn/lẻ',
        judge: (totalSum % 2 === 0) ? 'TÀI' : 'XỈU',
        weight: 80 + (totalSum % 20) // 80-100
    });

    // 2. Tỉ lệ chẵn/lẻ
    algorithms.push({
        name: 'Tỉ lệ chẵn/lẻ',
        judge: (evenCount > oddCount) ? 'TÀI' : 'XỈU',
        weight: 70 + Math.min(Math.abs(evenCount - oddCount) * 2, 30)
    });

    // 3. Số nguyên tố
    algorithms.push({
        name: 'Số nguyên tố',
        judge: (primeCount > len / 4) ? 'TÀI' : 'XỈU',
        weight: 70 + primeCount * 2
    });

    // 4. Giá trị trung bình
    algorithms.push({
        name: 'Giá trị trung bình',
        judge: (avg > 7.5) ? 'TÀI' : 'XỈU',
        weight: 75 + Math.abs(avg - 7.5) * 3
    });

    // 5. Cặp số
    algorithms.push({
        name: 'Cặp số (2 ký tự)',
        judge: (avgPair > 127) ? 'TÀI' : 'XỈU',
        weight: 70 + Math.min(avgPair / 10, 30)
    });

    // 6. Bộ ba số
    algorithms.push({
        name: 'Bộ ba số (3 ký tự)',
        judge: (avgTriple > 2047) ? 'TÀI' : 'XỈU',
        weight: 70 + Math.min(avgTriple / 50, 30)
    });

    // 7. Bit cuối (tổng bit 0)
    algorithms.push({
        name: 'Bit cuối (chẵn/lẻ)',
        judge: (lastBitSum > len / 2) ? 'TÀI' : 'XỈU',
        weight: 65 + (lastBitSum / len) * 20
    });

    // 8. XOR toàn bộ
    algorithms.push({
        name: 'XOR tích lũy',
        judge: (xorAll > 7) ? 'TÀI' : 'XỈU',
        weight: 70 + (xorAll * 2)
    });

    // 9. Entropy (độ hỗn loạn)
    algorithms.push({
        name: 'Entropy',
        judge: (entropy > 2.5) ? 'TÀI' : 'XỈU',
        weight: 70 + (entropy / 4) * 30
    });

    // 10. Độ lệch chuẩn
    algorithms.push({
        name: 'Độ lệch chuẩn',
        judge: (stddev > 3.5) ? 'TÀI' : 'XỈU',
        weight: 70 + (stddev / 5) * 30
    });

    // 11. Số 0 và số 15
    algorithms.push({
        name: 'Mật độ cực trị (0/15)',
        judge: (zeroCount + fifteenCount > len / 4) ? 'TÀI' : 'XỈU',
        weight: 60 + (zeroCount + fifteenCount) * 2
    });

    // 12. Phân bố chữ số (so với phân phối đều)
    let chiSquare = 0;
    const expected = len / 16;
    for (let i = 0; i < 16; i++) {
        chiSquare += (freq[i] - expected) ** 2 / expected;
    }
    algorithms.push({
        name: 'Phân bố χ²',
        judge: (chiSquare > 15) ? 'TÀI' : 'XỈU',
        weight: 70 + Math.min(chiSquare / 2, 30)
    });

    // 13. Tổng các cặp kề nhau (khác loại)
    let adjacentDiff = 0;
    for (let i = 0; i < len - 1; i++) adjacentDiff += Math.abs(hexArr[i] - hexArr[i+1]);
    const avgDiff = adjacentDiff / (len - 1);
    algorithms.push({
        name: 'Biến thiên kề',
        judge: (avgDiff > 4) ? 'TÀI' : 'XỈU',
        weight: 70 + (avgDiff / 8) * 30
    });

    // 14. Số lượng chữ số lặp lại nhiều nhất
    const maxFreq = Math.max(...freq);
    algorithms.push({
        name: 'Độ lặp lại cao nhất',
        judge: (maxFreq > len / 10) ? 'TÀI' : 'XỈU',
        weight: 60 + maxFreq * 2
    });

    // 15. Tổng các số nguyên tố trong cặp (lấy theo cặp)
    let primePairSum = 0;
    for (let i = 0; i < len - 1; i += 2) {
        const val = parseInt(hash.substr(i, 2), 16);
        if ([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251].includes(val)) {
            primePairSum += val;
        }
    }
    algorithms.push({
        name: 'Tổng cặp nguyên tố',
        judge: (primePairSum > 500) ? 'TÀI' : 'XỈU',
        weight: 60 + Math.min(primePairSum / 50, 40)
    });

    // 16. Thuật toán đặc biệt: dùng SHA256 của hash (nhưng khác biệt)
    const specialHash = crypto.createHash('sha256').update(hash + 's2king_premium_v2').digest('hex');
    const specialVal = parseInt(specialHash.substr(0, 2), 16);
    algorithms.push({
        name: 'Siêu dự đoán (SHA256)',
        judge: (specialVal > 127) ? 'TÀI' : 'XỈU',
        weight: 75 + (specialVal % 25) // 75-100
    });

    // ========== TỔNG HỢP KẾT QUẢ ==========
    let taiScore = 0, xiuScore = 0;
    let taiWeight = 0, xiuWeight = 0;
    let taiAlgoCount = 0, xiuAlgoCount = 0;
    let algoDetails = [];

    algorithms.forEach((algo, idx) => {
        const w = Math.min(Math.max(algo.weight, 0), 100);
        if (algo.judge === 'TÀI') {
            taiScore += w;
            taiWeight += w;
            taiAlgoCount++;
        } else {
            xiuScore += w;
            xiuWeight += w;
            xiuAlgoCount++;
        }
        algoDetails.push({
            index: idx + 1,
            name: algo.name,
            result: algo.judge,
            weight: w
        });
    });

    const totalWeight = taiWeight + xiuWeight;
    const taiPercent = (taiWeight / totalWeight) * 100;
    const xiuPercent = (xiuWeight / totalWeight) * 100;

    // Quyết định cuối cùng
    let finalResult, confidence, dominance;
    if (taiPercent > xiuPercent) {
        finalResult = 'TÀI';
        confidence = taiPercent.toFixed(2);
        dominance = (taiAlgoCount / algorithms.length * 100).toFixed(1);
    } else if (xiuPercent > taiPercent) {
        finalResult = 'XỈU';
        confidence = xiuPercent.toFixed(2);
        dominance = (xiuAlgoCount / algorithms.length * 100).toFixed(1);
    } else {
        // Hòa – dùng thuật toán đặc biệt (của SHA256)
        const tieBreaker = parseInt(crypto.createHash('sha256').update(hash + 'tiebreaker').digest('hex').substr(0,2), 16);
        finalResult = (tieBreaker > 127) ? 'TÀI' : 'XỈU';
        confidence = '50.00';
        dominance = '50.0';
    }

    // ========== TẠO BÁO CÁO ==========
    let report = `🔬 *PHÂN TÍCH HASH SIÊU TÁO BẠO V2*\n\n`;
    report += `📌 *Loại hash*: ${hashType}\n`;
    report += `🔢 *Độ dài*: ${len} ký tự\n\n`;

    report += `📊 *THUẬT TOÁN THAM GIA (${algorithms.length} thuật toán):*\n`;
    algoDetails.forEach(a => {
        const emoji = a.result === 'TÀI' ? '🔴' : '🔵';
        report += `${a.index}. ${a.name}: ${emoji} ${a.result} (${a.weight.toFixed(1)}%)\n`;
    });

    report += `\n🎯 *KẾT QUẢ TỔNG HỢP:*\n`;
    report += `🔴 *TÀI*: ${taiPercent.toFixed(1)}% (${taiAlgoCount}/${algorithms.length} thuật toán, trọng số ${taiWeight.toFixed(0)})\n`;
    report += `🔵 *XỈU*: ${xiuPercent.toFixed(1)}% (${xiuAlgoCount}/${algorithms.length} thuật toán, trọng số ${xiuWeight.toFixed(0)})\n`;
    report += `\n🔥 *FINAL: ${finalResult}* 🏆\n`;
    report += `📊 *Độ tin cậy*: ${confidence}%\n`;
    report += `💪 *Sức mạnh thống trị*: ${dominance}%`;

    return {
        result: finalResult,
        confidence: confidence,
        analysis: report,
        hashType: hashType,
        stats: {
            taiPercent: taiPercent,
            xiuPercent: xiuPercent,
            taiAlgorithms: taiAlgoCount,
            xiuAlgorithms: xiuAlgoCount,
            totalAlgorithms: algorithms.length
        }
    };
}

// ======================== BOT COMMANDS ========================

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        `👑 *S2KING-PREMIUM V2*\n\n` +
        `🔥 *Thuật toán dự đoán siêu cấp mới nhất!*\n` +
        `🎯 *Chỉ nhận MD5 (32 ký tự) hoặc SHA256 (64 ký tự)*\n\n` +
        `📌 *Cách sử dụng:*\n` +
        `🔹 /hash <hash> - Phân tích chi tiết\n` +
        `🔹 /random <hash> - Dự đoán nhanh Tài/Xỉu\n` +
        `🔹 /help - Hướng dẫn chi tiết\n\n` +
        `💎 *S2KING-PREMIUM v2.0*`,
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        `📖 *HƯỚNG DẪN SỬ DỤNG*\n\n` +
        `🔹 /hash <hash> – phân tích toàn bộ với 16 thuật toán con, đưa ra báo cáo chi tiết.\n` +
        `🔹 /random <hash> – chỉ đưa ra kết quả nhanh (Tài/Xỉu + độ tin cậy).\n\n` +
        `⚙️ *Yêu cầu:* hash chỉ chứa ký tự hex (0-9, a-f).\n` +
        `📏 *Độ dài:* MD5 = 32 ký tự, SHA256 = 64 ký tự.\n\n` +
        `🧠 *Thuật toán:* 16 phương pháp khác nhau (tổng, chẵn/lẻ, nguyên tố, entropy, …).\n` +
        `🎯 *Kết quả cuối cùng* dựa trên trọng số tổng hợp.`,
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/hash (.+)/, (msg, match) => {
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
    bot.sendMessage(chatId, result.analysis, { parse_mode: 'Markdown' });
});

bot.onText(/\/random (.+)/, (msg, match) => {
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
    const response = `🎰 *DỰ ĐOÁN NHANH*\n\n` +
        `${result.result === 'TÀI' ? '🔴' : '🔵'} *Kết quả*: ${result.result}\n` +
        `📊 *Độ tin cậy*: ${result.confidence}%\n` +
        `🔢 *Loại hash*: ${result.hashType}\n` +
        `📈 *Tỷ lệ*: TÀI ${result.stats.taiPercent.toFixed(1)}% - XỈU ${result.stats.xiuPercent.toFixed(1)}%\n` +
        `⚡ *Thuật toán ủng hộ*: ${result.stats.taiAlgorithms}/${result.stats.totalAlgorithms}`;
    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

// ======================== WEB SERVER ========================
app.get('/', (req, res) => {
    res.json({
        name: 'S2KING-PREMIUM',
        version: '2.0.0',
        status: '🚀 ACTIVE',
        features: ['MD5', 'SHA256', '16 algorithms', 'Premium']
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('👑 S2KING-PREMIUM V2 ONLINE!');
    console.log(`🚀 Port: ${PORT}`);
    console.log('🔥 Thuật toán siêu tác bạo v2 đã sẵn sàng!');
});