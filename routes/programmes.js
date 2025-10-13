const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get all programmes with faculty details - NO AUTH REQUIRED for simplicity
router.get('/', (req, res) => {
    console.log('📡 Programmes endpoint called');
    
    const query = `
        SELECT p.Programme_Code, p.Programme_Name, p.Duration_Years, f.Faculty_Name 
        FROM Programmes p 
        JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
        ORDER BY p.Programme_Name
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
                error: true,
                message: 'Database error: ' + err.message 
            });
        }
        
        console.log(`✅ Returning ${results.length} programmes`);
        res.json(results);
    });
});
// In your programmes route or create a new faculties route

//I ADDED THIS TO GET DISTINCT FACULTIES (REGISTRATION PAGE)
// In programmes.js - Add this route
// Get all faculties for admin registration
// Get all faculties for admin registration
// Get all faculties for admin registration
router.get('/faculties', (req, res) => {
    console.log('📋 Fetching faculties from database...');
    
    const query = `SELECT Faculty_Code, Faculty_Name FROM Faculties ORDER BY Faculty_Name`;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Database error fetching faculties:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Database error',
                details: err.message 
            });
        }
        
        console.log(`✅ Found ${results.length} faculties in database`);
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'No faculties found'
            });
        }
        
        // Return the raw database results directly
        console.log('📊 Sending faculties:', results);
        res.json(results);
    });
});
// Test endpoint
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Programmes endpoint is working!',
        testData: [
            { Programme_Code: 'TEST1', Programme_Name: 'Test Programme 1', Faculty_Name: 'Test Faculty' },
            { Programme_Code: 'TEST2', Programme_Name: 'Test Programme 2', Faculty_Name: 'Test Faculty' }
        ]
    });
});

module.exports = router;