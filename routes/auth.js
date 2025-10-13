const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

router.post('/login', (req, res) => {
    const { email, password, userType } = req.body;

    console.log('\n=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('User Type:', userType);

    const table = userType === 'admin' ? 'Admins' : 'Students';
    const emailColumn = userType === 'admin' ? 'Email_Address' : 'Email_Address';
    const idColumn = userType === 'admin' ? 'Admin_ID' : 'Student_ID';
    const nameColumn = userType === 'admin' ? 'Admin_Name' : 'Student_Name';
    
    const query = `SELECT * FROM ${table} WHERE ${emailColumn} = ?`;
    
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error' 
            });
        }
        
        if (results.length === 0) {
            console.log('No user found with email:', email);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
        
        const user = results[0];
        console.log('User found:', user[emailColumn]);
        
        if (user.Password === password) {
            console.log('✅ Login successful!');
            
            const token = jwt.sign(
                { 
                    id: user[idColumn], 
                    email: user[emailColumn],
                    userType: userType,
                    name: user[nameColumn]
                },
                process.env.JWT_SECRET || 'fallback-secret-key',
                { expiresIn: '24h' }
            );
            
            let userData = {
                id: user[idColumn],
                name: user[nameColumn],
                email: user[emailColumn],
                userType: userType
            };
            
            // Add student-specific fields
            if (userType === 'student') {
                userData.programmeCode = user.Programme_Code;
                userData.yearEnrolled = user.Year_Enrolled;
                userData.enrollmentStatus = user.Enrollment_Status;
            }
            
            return res.json({
                success: true,
                message: 'Login successful',
                token: token,
                user: userData,
                userType: userType
            });
        } else {
            console.log('❌ Password mismatch');
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }
    });
});

router.get('/verify', (req, res) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
        return res.status(401).json({ valid: false, message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        res.json({ valid: true, user: decoded });
    } catch (error) {
        res.status(401).json({ valid: false, message: 'Token invalid' });
    }
});

//I ADDED THIS FOR REGISTERING

// Registration endpoint
router.post('/register', (req, res) => {
    const { accountType, email, password, ...userData } = req.body;

    console.log('\n=== REGISTRATION ATTEMPT ===');
    console.log('Account Type:', accountType);
    console.log('Email:', email);

    // Validate required fields
    if (!accountType || !email || !password) {
        return res.status(400).json({ 
            success: false,
            message: 'Account type, email, and password are required' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false,
            message: 'Password must be at least 6 characters long' 
        });
    }

    // Determine table and fields based on account type
    const table = accountType === 'admin' ? 'Admins' : 'Students';
    const emailColumn = 'Email_Address';
    
    // Check if email already exists
    const checkQuery = `SELECT * FROM ${table} WHERE ${emailColumn} = ?`;
    
    db.query(checkQuery, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error during registration' 
            });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists. Please use a different email or login.' 
            });
        }

        // Insert new user based on account type
        if (accountType === 'student') {
            registerStudent(req.body, res);
        } else {
            registerAdmin(req.body, res);
        }
    });
});

function registerStudent(studentData, res) {
    const { email, password, studentName, dateOfBirth, contactNumber, programmeCode, yearEnrolled } = studentData;

    // Validate student-specific fields
    if (!studentName || !programmeCode || !yearEnrolled) {
        return res.status(400).json({ 
            success: false,
            message: 'Student name, programme, and year enrolled are required' 
        });
    }

    const insertQuery = `
        INSERT INTO Students (Student_Name, Date_of_Birth, Email_Address, Contact_Number, Programme_Code, Year_Enrolled, Password, Enrollment_Status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `;
    
    db.query(insertQuery, [studentName, dateOfBirth, email, contactNumber, programmeCode, yearEnrolled, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            
            // Handle specific database errors
            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid programme selected. Please choose a valid programme.' 
                });
            }
            
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        console.log('✅ Student registered successfully. ID:', results.insertId);
        
        res.json({
            success: true,
            message: 'Student account created successfully! You can now login.',
            studentId: results.insertId
        });
    });
}

function registerAdmin(adminData, res) {
    const { email, password, adminName, faculty } = adminData;

    console.log('🔍 Admin registration data:', adminData);

    // Validate admin-specific fields
    if (!adminName) {
        return res.status(400).json({ 
            success: false,
            message: 'Admin name is required' 
        });
    }

    if (!faculty) {
        return res.status(400).json({ 
            success: false,
            message: 'Please select a faculty' 
        });
    }

    // Check if faculty exists using Faculty_Code - FIXED: use 'faculty' not 'facultyId'
    const checkFacultyQuery = `SELECT Faculty_Code FROM Faculties WHERE Faculty_Code = ?`;
    
    db.query(checkFacultyQuery, [faculty], (err, facultyResults) => { // FIXED: [faculty] not [facultyId]
        if (err) {
            console.error('❌ Faculty check error:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error checking faculty' 
            });
        }
        
        if (facultyResults.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid faculty selected. Please choose a valid faculty.' 
            });
        }
        
        // Faculty exists, proceed with registration - FIXED: use 'faculty' not 'facultyId'
        const insertQuery = `
            INSERT INTO Admins (Admin_Name, Email_Address, Password, Faculty_Code) 
            VALUES (?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [adminName, email, password, faculty], (err, results) => { // FIXED: [faculty] not [facultyId]
            if (err) {
                console.error('❌ Database error:', err);
                
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ 
                        success: false,
                        message: 'Email already exists. Please use a different email.' 
                    });
                }

                if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                    return res.status(400).json({ 
                        success: false,
                        message: 'Invalid faculty selected. Please choose a valid faculty.' 
                    });
                }
                
                return res.status(500).json({ 
                    success: false,
                    message: 'Database error: ' + err.message 
                });
            }
            
            console.log('✅ Admin registered successfully. ID:', results.insertId);
            
            res.json({
                success: true,
                message: 'Admin account created successfully! You can now login.',
                adminId: results.insertId
            });
        });
    });
}
module.exports = router;
