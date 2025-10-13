const mysql = require('mysql2');

console.log('🧪 Testing Database Connection...\n');

const testConfigs = [
    { host: 'localhost', user: 'root', password: '', database: 'mysql' },
    { host: 'localhost', user: 'root', password: 'root', database: 'mysql' },
    { host: '127.0.0.1', user: 'root', password: '', database: 'mysql' }
];

function testConnection(config, index) {
    console.log(`Attempt ${index + 1}: ${config.user}@${config.host} (pass: ${config.password || 'none'})`);
    
    const connection = mysql.createConnection(config);
    
    connection.connect((err) => {
        if (err) {
            console.log(`   ❌ FAILED: ${err.message}\n`);
            
            if (index < testConfigs.length - 1) {
                testConnection(testConfigs[index + 1], index + 1);
            } else {
                console.log('💡 SOLUTIONS:');
                console.log('1. Start MySQL service (XAMPP or Windows Services)');
                console.log('2. Use the correct password for your MySQL installation');
                console.log('3. Install XAMPP for easy MySQL setup');
            }
        } else {
            console.log('   ✅ SUCCESS! MySQL is running.\n');
            
            // Check if our database exists
            connection.query('SHOW DATABASES LIKE "student_record_system"', (err, results) => {
                if (err) {
                    console.log('Error checking databases:', err.message);
                } else if (results.length > 0) {
                    console.log('✅ Database "student_record_system" exists');
                } else {
                    console.log('❌ Database "student_record_system" does not exist');
                    console.log('   Run the schema.sql file to create it');
                }
                
                connection.end();
                process.exit();
            });
        }
    });
}

testConnection(testConfigs[0], 0);