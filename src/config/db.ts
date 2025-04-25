import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()
class MongoDB {
  private readonly uri: string;

  constructor(uri: string) {
    if (!uri) {
      console.error("❌ MONGODB_URI is missing in environment variables.");
      process.exit(1);
    }
    this.uri = uri;
    this.registerEvents();
  }

  private registerEvents(): void {
    mongoose.connection.once("open", () => {
      console.log("✅ MongoDB connection established.");
    });

    mongoose.connection.on("error", (error: unknown) => {
      console.error("❌ MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected.");
    });
  }

  public async connect(): Promise<void> {
    try {
      await mongoose.connect(this.uri);
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log("🔌 MongoDB disconnected.");
    } catch (error) {
      console.error("❌ Error during MongoDB disconnection:", error);
    }
  }
}

// Export an instance for easy use
const db = new MongoDB(process.env.MONGODB_URI || "");
export default db;


