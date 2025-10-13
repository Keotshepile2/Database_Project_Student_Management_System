const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get all students with programme details
router.get('/', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const query = `
        SELECT s.*, p.Programme_Name, f.Faculty_Name 
        FROM Students s 
        LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code 
        LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
        ORDER BY s.Student_ID
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        res.json(results);
    });
});

// Get student by ID
router.get('/:id', auth, (req, res) => {
    const studentId = req.params.id;
    
    const query = `
        SELECT s.*, p.Programme_Name, f.Faculty_Name 
        FROM Students s 
        LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code 
        LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
        WHERE s.Student_ID = ?
    `;
    
    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json(results[0]);
    });
});

// Add new student
router.post('/', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { studentName, dateOfBirth, emailAddress, contactNumber, programmeCode, yearEnrolled, password } = req.body;
    
    if (!studentName || !emailAddress || !programmeCode || !yearEnrolled || !password) {
        return res.status(400).json({ message: 'All required fields must be filled' });
    }
    
    const query = `
        INSERT INTO Students (Student_Name, Date_of_Birth, Email_Address, Contact_Number, Programme_Code, Year_Enrolled, Password) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [studentName, dateOfBirth, emailAddress, contactNumber, programmeCode, yearEnrolled, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }
        
        res.json({ 
            success: true,
            message: 'Student added successfully',
            studentId: results.insertId 
        });
    });
});

// Update student
router.put('/:id', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const studentId = req.params.id;
    const { studentName, dateOfBirth, emailAddress, contactNumber, programmeCode, yearEnrolled, enrollmentStatus } = req.body;
    
    const query = `
        UPDATE Students 
        SET Student_Name = ?, Date_of_Birth = ?, Email_Address = ?, Contact_Number = ?, 
            Programme_Code = ?, Year_Enrolled = ?, Enrollment_Status = ?
        WHERE Student_ID = ?
    `;
    
    db.query(query, [studentName, dateOfBirth, emailAddress, contactNumber, programmeCode, yearEnrolled, enrollmentStatus, studentId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json({ 
            success: true,
            message: 'Student updated successfully' 
        });
    });
});

// Delete student
router.delete('/:id', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const studentId = req.params.id;
    
    // First check if student has enrollments
    const checkEnrollmentsQuery = 'SELECT * FROM Student_Enrollments WHERE Student_ID = ?';
    
    db.query(checkEnrollmentsQuery, [studentId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ message: 'Cannot delete student with existing enrollments' });
        }
        
        const deleteQuery = 'DELETE FROM Students WHERE Student_ID = ?';
        
        db.query(deleteQuery, [studentId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Student not found' });
            }
            
            res.json({ 
                success: true,
                message: 'Student deleted successfully' 
            });
        });
    });
});


// Get programmes for dropdown
router.get('/programmes', auth, (req, res) => {
    const query = `
        SELECT p.Programme_Code, p.Programme_Name, f.Faculty_Name 
        FROM Programmes p 
        JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
        ORDER BY p.Programme_Name
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        res.json(results);
    });
});

module.exports = router;