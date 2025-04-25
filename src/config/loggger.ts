import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels and emojis
const logLevels = {
	info: { label: 'INFO', emoji: 'ℹ️' },
	warn: { label: 'WARN', emoji: '⚠️' },
	error: { label: 'ERROR', emoji: '❌' },
	debug: { label: 'DEBUG', emoji: '🐛' },
};

// Get formatted timestamp
const getTimestamp = (): string => {
	const now = new Date();
	return now.toISOString().replace('T', ' ').split('.')[0]; // YYYY-MM-DD HH:mm:ss
};

// Function to archive old logs
const archiveLogs = () => {
	const files = fs.readdirSync(logDir);
	const now = new Date();

	files.forEach((file) => {
		const filePath = path.join(logDir, file);
		const stats = fs.statSync(filePath);
		const fileSizeMB = stats.size / (1024 * 1024); // Convert bytes to MB

		// If file is older than 14 days OR exceeds 20MB, archive it
		const fileDate = new Date(stats.mtime);
		const daysOld = (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24);

		if (daysOld > 14 || fileSizeMB > 20) {
			const gzip = zlib.createGzip();
			const input = fs.createReadStream(filePath);
			const output = fs.createWriteStream(`${filePath}.gz`);

			input.pipe(gzip).pipe(output);

			output.on('finish', () => {
				fs.unlinkSync(filePath); // Delete old file after compression
				console.log(`Archived log: ${file}.gz`);
			});
		}
	});
};

// Function to write logs to file
const writeToFile = (logMessage: string) => {
	const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
	fs.appendFileSync(logFile, logMessage + '\n');
	archiveLogs(); // Call archive function every time a log is written
};

// Custom logger function
const log = (level: keyof typeof logLevels,  ...messages: any[]) => {
	const { label, emoji } = logLevels[level];
	const timestamp = getTimestamp();
	
    const Messages = messages.join(' '); // Combine multiple messages

	const formattedMessage = `${timestamp} [${label.toUpperCase()}]: ${emoji} ${Messages}`;

	// Print to console
	console.log(formattedMessage);

	// Write to log file
	writeToFile(formattedMessage);
};

// Export logger functions
 const  logger = {
	info: (...messages: any[]) => log('info', ...messages),
	warn: (...messages: any[]) => log('warn', ...messages),
	error: (...messages: any[]) => log('error', ...messages),
	debug: (...messages: any[]) => log('debug', ...messages),
};

export default logger


// Handle process errors
process.on('unhandledRejection', (error: Error) => {
	logger.error(`Unhandled Rejection: ${error.message || error}`);
	process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
	logger.error(`Uncaught Exception: ${error.message || error}`);
	process.exit(1);
});

process.on('warning', (warning: Error) => {
	logger.warn(`Warning: ${warning.message || warning}`);
});

