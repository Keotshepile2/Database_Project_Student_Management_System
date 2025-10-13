const mysql = require('mysql2');
require('dotenv').config();

console.log('=== DATABASE CONFIGURATION ===');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);
console.log('Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'empty');

// Test different connection configurations
const connectionConfigs = [
    // XAMPP default (no password)
    {
        host: 'localhost',
        user: 'root',
        password: 'Keneilwe@1',
        database: 'student_record_system'
    },
   
];

function testConnection(config, attempt) {
    console.log(`\nAttempt ${attempt}: Trying to connect...`);
    console.log(`Host: ${config.host}, User: ${config.user}, DB: ${config.database}`);
    
    const connection = mysql.createConnection(config);
    
    connection.connect((err) => {
        if (err) {
            console.log(`❌ Connection failed: ${err.message}`);
            
            // Try next configuration
            if (attempt < connectionConfigs.length - 1) {
                testConnection(connectionConfigs[attempt + 1], attempt + 1);
            } else {
                console.log('\n💡 TROUBLESHOOTING TIPS:');
                console.log('1. Make sure MySQL is running (check XAMPP or MySQL service)');
                console.log('2. Try the correct password for your MySQL installation');
                console.log('3. Check if the database exists');
            }
            return;
        }
        
        console.log('✅ Connection successful!');
        
        // If we connected without a database, create it
        if (!config.database) {
            console.log('Creating database...');
            connection.query('CREATE DATABASE IF NOT EXISTS student_record_system', (err) => {
                if (err) {
                    console.log('Error creating database:', err.message);
                } else {
                    console.log('Database created/verified');
                }
                connection.end();
            });
        } else {
            // Test the connection works
            connection.query('SELECT 1 + 1 AS result', (err, results) => {
                if (err) {
                    console.log('Query test failed:', err.message);
                } else {
                    console.log('Query test successful. Result:', results[0].result);
                }
                connection.end();
            });
        }
    });
}

// Start testing with first configuration
testConnection(connectionConfigs[0], 1);

// Export a function to get a connection
function getConnection() {
    return mysql.createConnection(connectionConfigs[0]); // Use first working config
}

module.exports = getConnection();
