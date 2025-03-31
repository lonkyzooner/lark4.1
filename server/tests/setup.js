const mongoose = require("mongoose")
const { MongoMemoryServer } = require("mongodb-memory-server")
const dotenv = require("dotenv")
const path = require("path")

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.test") })

let mongoServer

// Setup before tests
beforeAll(async () => {
  // Create in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()

  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  console.log(`MongoDB successfully connected to ${mongoUri}`)
})

// Clean up after tests
afterAll(async () => {
  // Disconnect and stop MongoDB server
  await mongoose.disconnect()
  await mongoServer.stop()

  console.log("MongoDB connection closed")
})

// Reset database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections

  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})

// Global test timeout
jest.setTimeout(30000)

