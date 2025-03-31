const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`MongoDB Connected: ${conn.connection.host}`)

    // Add event listeners for connection issues
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...")
    })

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected")
    })

    return conn
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB

