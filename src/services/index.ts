import dotenv from 'dotenv'
import path from 'path'
import logger from '../config/loggger'
import fs, { existsSync, mkdirSync } from "fs";


// Graceful shutdown function
export const shutdown = (server: any) => {
	try {
		logger.info('Shutting down gracefully...')
		// Attempt to close the server
		server.close(() => {
			logger.info('Closed all connections gracefully.')
			process.exit(0) // Exit the process after everything is closed
		})
		// If server hasn't closed after 10 seconds, force shutdown
		setTimeout(() => {
			logger.error('Forcing shutdown after timeout.')
			process.exit(1) // Force exit with an error code if shutdown times out
		}, 10000)
	} catch (error: any) {
		logger.error(`Error during shutdown: ${error.message}`)
		process.exit(1) // Exit with error code if shutdown fails
	}
}

dotenv.config({ path: path.join(__dirname, '../../../.env') })


// Function to clear .wwebjs files and folders
export const clearWWebjsCache = () => {
  const cacheDir = path.join(__dirname, "..wwebjs_auth");
  const wwebjsDir = path.join(__dirname, ".wwebjs_cache");

  // Delete cache/wwebjs folder
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log("Cleared cache/wwebjs folder.");
  }

  // Delete .wwebjs folder
  if (fs.existsSync(wwebjsDir)) {
    fs.rmSync(wwebjsDir, { recursive: true, force: true });
    console.log("Cleared .wwebjs folder.");
  }
};





/**
 * Ensures that a directory exists. If it doesn't, creates it (and any parent folders).
 * @param dirPath Absolute or relative path of folder to ensure.
 */
export function ensureDir(dirPath: string) {
	if (!existsSync(dirPath)) {
	  mkdirSync(dirPath, { recursive: true });
	  console.log(`📁 Created folder: ${dirPath}`);
	}
  }
  