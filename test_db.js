const { Client } = require('pg');

const usernames = ['postgres', 'hilman', 'root'];
const passwords = ['123', '1234', 'Hilman123', 'hilman1234', 'hilman12345', 'postgres123', 'postgres1234'];
const databases = ['certimatch_db', 'postgres'];

async function testConnection(user, password, database) {
  const client = new Client({
    user,
    password,
    host: 'localhost',
    port: 5432,
    database
  });

  try {
    await client.connect();
    await client.end();
    return true;
  } catch (err) {
    if (err.code === '3D000') {
      return 'auth_success_no_db';
    }
    return err.message;
  }
}

async function main() {
  console.log("Starting credentials scan 2...");
  let lastError = '';
  for (const user of usernames) {
    for (const pass of passwords) {
      for (const db of databases) {
        const result = await testConnection(user, pass, db);
        if (result === true) {
          console.log(`\n[SUCCESS] Connection string: postgresql://${user}:${pass}@localhost:5432/${db}?schema=public`);
          return;
        } else if (result === 'auth_success_no_db') {
          console.log(`\n[SUCCESS] Auth successful, but db missing. Connection string: postgresql://${user}:${pass}@localhost:5432/certimatch_db?schema=public`);
          return;
        } else {
          lastError = result;
        }
      }
    }
  }
  console.log("\n[FAILED] None of the credentials worked.");
  console.log("Last Error:", lastError);
}

main();
