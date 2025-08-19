require('dotenv').config();
const { client } = require('../database/dbConnection');
console.log('✅ trigger_reminder.js loaded');
module.exports = async (req, res) => {
  const { token } = req.query;
  if (token !== process.env.SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });
  }

  try {
    const db = client.db('axios'); 
    const reminders = db.collection('reminders');
    const now = new Date();
    const dueReminders = await reminders.find({
      dueAt: { $lte: now },
      sent: false
    }).toArray();

    let sentCount = 0;
    for (const reminder of dueReminders) {
      const result = await reminders.updateOne(
        { _id: reminder._id },
        { $set: { sent: true, sentAt: now } }
      );
      if (result.modifiedCount === 1) sentCount++;
    }
    res.json({
      success: true,
      processed: dueReminders.length,
      sent: sentCount,
      timestamp: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

  } catch (err) {
    console.error('Reminder trigger error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });
  }
};
