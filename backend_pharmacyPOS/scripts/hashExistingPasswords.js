const db = require('../db');
const bcrypt = require('bcryptjs');

async function hashPasswords() {
  const [users] = await db.query('SELECT id, password FROM users');
  for (const user of users) {
    // Skip if already hashed (bcrypt hashes start with $2)
    if (user.password.startsWith('$2')) continue;
    const hash = await bcrypt.hash(user.password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, user.id]);
    console.log(`Updated user ${user.id}`);
  }
  process.exit();
}

hashPasswords();
