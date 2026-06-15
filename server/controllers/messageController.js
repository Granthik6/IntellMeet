const Message = require("../models/Message");

// Save Message
const sendMessage = async (req, res) => {
  try {
    const { sender, meetingId, text } = req.body;

    const message = await Message.create({
      sender,
      meetingId,
      text,
    });

    res.status(201).json(message);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Messages by Meeting
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      meetingId: req.params.meetingId,
    });

    res.status(200).json(messages);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};