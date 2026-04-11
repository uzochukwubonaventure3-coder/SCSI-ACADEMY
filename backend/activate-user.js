const { query } = require('./src/config/database.js')

async function activateUser() {
  const email = 'uzochukwubonaventure3@gmail.com'

  try {
    console.log('Activating user:', email)

    // Find the user
    const userRes = await query('SELECT id, plan FROM content_users WHERE email = $1', [email])
    if (!userRes.rows.length) {
      console.log('❌ User not found:', email)
      return
    }

    const user = userRes.rows[0]
    console.log('Found user:', user)

    // Calculate expiry (3 months for quarterly, 30 days for monthly)
    const days = user.plan === 'quarterly' ? 90 : 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    console.log(`Setting expiry to ${days} days: ${expiresAt.toISOString()}`)

    // Activate user
    const updateResult = await query('UPDATE content_users SET is_active = TRUE, expires_at = $1 WHERE id = $2', [expiresAt.toISOString(), user.id])
    console.log('User update result:', updateResult.rowCount, 'rows affected')

    // Update payment status
    const paymentResult = await query('UPDATE payments SET status = $1 WHERE user_id = $2 AND status = $3', ['success', user.id, 'pending'])
    console.log('Payment update result:', paymentResult.rowCount, 'rows affected')

    // Verify the activation
    const verifyRes = await query('SELECT email, is_active, expires_at, plan FROM content_users WHERE id = $1', [user.id])
    console.log('✅ Final user state:', verifyRes.rows[0])

  } catch (err) {
    console.error('❌ Error:', err)
  }
}

activateUser()