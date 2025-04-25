// Load environment variables from .env file
import dotenv from 'dotenv'
import app from './app'
import { shutdown } from './services'
import logger from './config/loggger'

// Load Env variable
dotenv.config()
const port: number = parseInt(process.env.PORT || "3000", 10);

const server = app.listen(port, () => {
	logger.info(`Server is running on port ${process.env.PORT || 3000}`)
})

process.on('SIGTERM', () => {
	logger.info('Received SIGTERM signal.')
	shutdown(server)
})
process.on('SIGINT', () => {
	logger.info('Received SIGINT signal.')
	shutdown(server)
})
