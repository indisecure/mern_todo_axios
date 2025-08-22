require('dotenv').config();
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

module.exports = async (req, res) => {
  if (req.query.token !== process.env.SECRET) return;

  try {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }

    const db = client.db('axios');
    const reminders = db.collection('reminders');
    const now = new Date();

    const dueReminders = await reminders.find({
      dueAt: { $lte: now },
      sent: false
    }).toArray();

    for (const reminder of dueReminders) {
      await reminders.updateOne(
        { _id: reminder._id },
        { $set: { sent: true, sentAt: now } }
      );
    }

    res.json({
      success:true
    })
  } catch (err) {
    console.error('MongoDB error:', err);    
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
