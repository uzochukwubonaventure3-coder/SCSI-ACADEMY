import { query } from './src/config/database.js'

async function checkUsers() {
  try {
    const users = await query('SELECT id, email, is_active, expires_at, plan FROM content_users')
    console.log('Users:', users.rows)

    const payments = await query('SELECT id, user_id, email, reference, status FROM payments ORDER BY created_at DESC LIMIT 5')
    console.log('Recent payments:', payments.rows)
  } catch (err) {
    console.error('Error:', err)
  }
}

checkUsers()