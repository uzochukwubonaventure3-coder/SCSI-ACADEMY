/**
 * Run this once to generate your admin password hash.
 * Usage: npx tsx src/utils/hashPassword.ts yourPassword123
 * Then copy the output into your .env as ADMIN_PASSWORD_HASH
 */
import bcrypt from 'bcryptjs'

const password = process.argv[2]

async function main() {
  if (!password) {
    console.error('Usage: npx tsx src/utils/hashPassword.ts <your_password>')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 12)
  console.log('\nCopy this into your .env file:\n')
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`)
}

main().catch((error) => {
  console.error('Failed to hash password:', error)
  process.exit(1)
})
