import 'dotenv/config'
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from '@prisma/adapter-pg'

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
	throw new Error('Missing DATABASE_URL in environment')
}

// Use the pg driver adapter as required by the generated client configuration.
const adapter = new PrismaPg({ connectionString: dbUrl })

const prisma = new PrismaClient({
	adapter,
	log: ['warn', 'error'],
})

export default prisma
