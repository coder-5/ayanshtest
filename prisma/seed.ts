import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // This seed file is intentionally empty
  // All data should come from real document uploads, not hardcoded samples

  console.log('Database is ready for real data!')
  console.log('Upload math competition documents to populate the database.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })