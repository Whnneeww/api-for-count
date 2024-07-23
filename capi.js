const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/accessCountDB', { useNewUrlParser: true, useUnifiedTopology: true });

const countSchema = new mongoose.Schema({
    userId: String,
    count: Number,
    lastAccessed: Date
});

const Count = mongoose.model('Count', countSchema);

app.post('/increment', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'IDが必要です！' });
    }

    let record = await Count.findOne({ userId });
    const currentDate = new Date();

    if (record) {
        record.count++;
        record.lastAccessed = currentDate;
    } else {
        record = new Count({ userId, count: 1, lastAccessed: currentDate });
    }

    await record.save();
    res.json({ userId: record.userId, count: record.count });
});

app.get('/count/:userId', async (req, res) => {
    const { userId } = req.params;

    let record = await Count.findOne({ userId });
    if (record) {
        return res.json({ userId: record.userId, count: record.count });
    } else {
        return res.json({ userId, count: 0 });
    }
});

app.get('/api/count/:userId', async (req, res) => {
    const { userId } = req.params;

    let record = await Count.findOne({ userId });
    if (record) {
        return res.json({ userId: record.userId, count: record.count });
    } else {
        return res.status(404).json({ error: '指定されたIDのカウンターが見つかりません。' });
    }
});

const deleteOldCounters = async () => {
    const sixMonthsAgo = moment().subtract(6, 'months').toDate();
    await Count.deleteMany({ lastAccessed: { $lt: sixMonthsAgo } });
    console.log('6ヶ月間アクセスのないカウンターが削除されました。');
};

setInterval(deleteOldCounters, 24 * 60 * 60 * 1000); // 24時間（ミリ秒）

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});