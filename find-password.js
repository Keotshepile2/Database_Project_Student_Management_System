const mysql = require('mysql2');

console.log('🔍 Trying to find correct MySQL password...\n');

const passwordAttempts = [
    '',           // empty password (XAMPP default)
    'root',       // common default
    'password',   // another common default
    '1234',       // simple password
    'admin',      // another common one
    'Password123' // complex common one
];

function testPassword(password, attempt) {
    console.log(`Attempt ${attempt}: Trying password '${password || 'empty'}'`);
    
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: password,
        database: 'mysql' // Connect to default mysql database first
    });
    
    connection.connect((err) => {
        if (err) {
            console.log(`   ❌ Failed: ${err.message}\n`);
            
            // Try next password
            if (attempt < passwordAttempts.length) {
                testPassword(passwordAttempts[attempt], attempt + 1);
            } else {
                console.log('💡 No password worked. Possible solutions:');
                console.log('1. Install XAMPP for easy MySQL setup');
                console.log('2. Reset MySQL password');
                console.log('3. Check if MySQL service is running');
            }
        } else {
            console.log(`   ✅ SUCCESS! Correct password is: '${password || 'empty'}'`);
            console.log('\n🎉 Now you can use this password in your .env file');
            
            // Test if our database exists
            connection.query('SHOW DATABASES', (err, results) => {
                if (err) {
                    console.log('Error checking databases:', err.message);
                } else {
                    console.log('\n📊 Available databases:');
                    results.forEach(db => {
                        console.log('   -', db.Database);
                    });
                    
                    // Check if our database exists
                    const hasOurDb = results.some(db => db.Database === 'student_record_system');
                    if (!hasOurDb) {
                        console.log('\n⚠️  Database "student_record_system" does not exist yet');
                        console.log('   We will create it in the next step');
                    }
                }
                connection.end();
                process.exit();
            });
        }
    });
}

// Start with empty password
testPassword('', 1);