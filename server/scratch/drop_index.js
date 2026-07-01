const mongoose = require("mongoose");
require("dotenv").config();

async function dropRoomIdIndex() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/intellmeet";
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const collections = await mongoose.connection.db.listCollections().toArray();
    const meetingsExist = collections.find(c => c.name === 'meetings');

    if (meetingsExist) {
      const indexes = await mongoose.connection.collection('meetings').indexes();
      console.log("Current indexes on 'meetings' collection:", indexes.map(i => i.name));
      
      const hasRoomIdIndex = indexes.find(idx => idx.name === 'roomId_1');
      if (hasRoomIdIndex) {
        console.log("Found 'roomId_1' unique index. Dropping it...");
        await mongoose.connection.collection('meetings').dropIndex('roomId_1');
        console.log("Successfully dropped 'roomId_1' index!");
      } else {
        console.log("No 'roomId_1' index found on 'meetings' collection.");
      }
    } else {
      console.log("Collection 'meetings' does not exist yet.");
    }
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

dropRoomIdIndex();
