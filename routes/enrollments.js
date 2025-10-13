/*const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get enrollments for a specific student
router.get('/student/:studentId', auth, (req, res) => {
    const studentId = req.params.studentId;
    
    console.log('=== GET STUDENT ENROLLMENTS ===');
    console.log('Requested student ID:', studentId);
    console.log('Authenticated user:', req.user);
    
    // Students can only access their own data, admins can access any
    if (req.user.userType === 'student' && parseInt(req.user.id) !== parseInt(studentId)) {
        console.log('Access denied: Student trying to access other student data');
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
        SELECT 
            e.Enrollment_ID,
            e.Student_ID,
            e.Module_Code,
            m.Module_Name,
            m.Module_Description,
            m.Credit_Hours,
            e.Semester_Code,
            sem.Semester_Number,
            sem.Academic_Year,
            e.Mark_Obtained,
            e.Grade,
            e.Enrollment_Date,
            e.Status,
            p.Programme_Name
        FROM Student_Enrollments e
        LEFT JOIN Modules m ON e.Module_Code = m.Module_Code
        LEFT JOIN Semesters sem ON e.Semester_Code = sem.Semester_Code
        LEFT JOIN Students s ON e.Student_ID = s.Student_ID
        LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code
        WHERE e.Student_ID = ?
        ORDER BY sem.Academic_Year DESC, sem.Semester_Number DESC, m.Module_Code
    `;
    
    console.log('Executing query for student:', studentId);
    
    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                message: 'Database error: ' + err.message,
                error: err 
            });
        }
        
        console.log(`Query successful. Found ${results.length} enrollments`);
        console.log('Enrollments data:', results);
        
        if (results.length === 0) {
            console.log('No enrollments found for student:', studentId);
            // Return empty array instead of error
            return res.json([]);
        }
        
        res.json(results);
    });
});

// Get all enrollments (admin only)
router.get('/', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const query = `
        SELECT 
            e.Enrollment_ID, e.Student_ID, s.Student_Name, 
            e.Module_Code, m.Module_Name, m.Credit_Hours,
            e.Semester_Code, sem.Academic_Year, sem.Semester_Number,
            e.Mark_Obtained, e.Grade, e.Enrollment_Date, e.Status,
            p.Programme_Name
        FROM Student_Enrollments e
        JOIN Students s ON e.Student_ID = s.Student_ID
        JOIN Modules m ON e.Module_Code = m.Module_Code
        JOIN Semesters sem ON e.Semester_Code = sem.Semester_Code
        LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code
        ORDER BY e.Enrollment_ID DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        res.json(results);
    });
});
// Get marks for a specific student

router.get('/student/:studentId/marks', auth, (req, res) => {
    const studentId = req.params.studentId;
    
    // Students can only access their own data, admins can access any
    if (req.user.userType === 'student' && req.user.id != studentId) {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
        SELECT e.ModuleCode, m.ModuleName, e.Semester, e.Marks
        FROM Enrollments e
        JOIN Modules m ON e.ModuleCode = m.ModuleCode
        WHERE e.StudentID = ? AND e.Marks IS NOT NULL
        ORDER BY e.Semester, m.ModuleCode
    `;
    
    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        res.json(results);
    });
});
// Get semesters for dropdown
router.get('/semesters', auth, (req, res) => {
    const query = 'SELECT * FROM Semesters ORDER BY Academic_Year DESC, Semester_Number DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        res.json(results);
    });
});

// Get all marks (admin only)
router.get('/marks', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
        SELECT e.EnrollmentID, e.StudentID, s.Name as StudentName, s.Surname, 
               e.ModuleCode, m.ModuleName, e.Semester, e.Marks
        FROM Enrollments e
        JOIN Students s ON e.StudentID = s.StudentID
        JOIN Modules m ON e.ModuleCode = m.ModuleCode
        ORDER BY e.StudentID, e.Semester, m.ModuleCode
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        results.forEach(enrollment => {
            enrollment.StudentName = `${enrollment.StudentName} ${enrollment.Surname}`;
        });
        
        res.json(results);
    });
});


// Add new enrollment (admin only)
router.post('/', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { studentId, moduleCode, semesterCode } = req.body;
    
    if (!studentId || !moduleCode || !semesterCode) {
        return res.status(400).json({ message: 'Student, module, and semester are required' });
    }
    
    // Check if enrollment already exists
    const checkQuery = 'SELECT * FROM Student_Enrollments WHERE Student_ID = ? AND Module_Code = ? AND Semester_Code = ?';
    
    db.query(checkQuery, [studentId, moduleCode, semesterCode], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ message: 'Student is already enrolled in this module for the selected semester' });
        }
        
        // Insert new enrollment
        const insertQuery = `
            INSERT INTO Student_Enrollments (Student_ID, Module_Code, Semester_Code) 
            VALUES (?, ?, ?)
        `;
        
        db.query(insertQuery, [studentId, moduleCode, semesterCode], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            res.json({ 
                message: 'Student enrolled successfully',
                enrollmentId: results.insertId 
            });
        });
    });
});

// Update marks (admin only)
router.put('/marks', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { enrollmentId, markObtained } = req.body;
    
    if (!enrollmentId || markObtained === undefined) {
        return res.status(400).json({ message: 'Enrollment ID and marks are required' });
    }
    
    if (markObtained < 0 || markObtained > 100) {
        return res.status(400).json({ message: 'Marks must be between 0 and 100' });
    }
    
    // Calculate grade
    let grade = 'F';
    if (markObtained >= 80) grade = 'A';
    else if (markObtained >= 70) grade = 'B';
    else if (markObtained >= 60) grade = 'C';
    else if (markObtained >= 50) grade = 'D';
    
    const updateQuery = 'UPDATE Student_Enrollments SET Mark_Obtained = ?, Grade = ? WHERE Enrollment_ID = ?';
    
    db.query(updateQuery, [markObtained, grade, enrollmentId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        
        res.json({ message: 'Marks updated successfully' });
    });
});


// Delete enrollment (admin only)



//ADDiTIONAL ROUTES FOR EDITING/DELETING ENROLLEMENTS (ADMIN ONLY)
// Get enrollment by ID
router.get('/:id', auth, (req, res) => {
    const enrollmentId = req.params.id;
    
    console.log('🔍 Fetching enrollment with ID:', enrollmentId);
    
    const query = `
        SELECT e.*, s.Student_Name, m.Module_Name, sem.Semester_Number, sem.Academic_Year
        FROM Student_Enrollments e
        JOIN Students s ON e.Student_ID = s.Student_ID
        JOIN Modules m ON e.Module_Code = m.Module_Code
        JOIN Semesters sem ON e.Semester_Code = sem.Semester_Code
        WHERE e.Enrollment_ID = ?
    `;
    
    db.query(query, [enrollmentId], (err, results) => {
        if (err) {
            console.error('❌ Database error fetching enrollment:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        console.log('📊 Enrollment query results:', results);
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Enrollment not found' 
            });
        }
        
        res.json(results[0]);
    });
});

// Update enrollment (admin only)
router.put('/:id', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin only.' 
        });
    }
    
    const enrollmentId = req.params.id;
    const { studentId, moduleCode, semesterCode } = req.body;
    
    console.log('🔄 Updating enrollment:', enrollmentId, req.body);
    
    if (!studentId || !moduleCode || !semesterCode) {
        return res.status(400).json({ 
            success: false,
            message: 'Student, module, and semester are required' 
        });
    }
    
    // Check if another enrollment already exists with same student, module, and semester
    const checkQuery = 'SELECT * FROM Student_Enrollments WHERE Student_ID = ? AND Module_Code = ? AND Semester_Code = ? AND Enrollment_ID != ?';
    
    db.query(checkQuery, [studentId, moduleCode, semesterCode, enrollmentId], (err, results) => {
        if (err) {
            console.error('❌ Database error checking duplicate enrollment:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Student is already enrolled in this module for the selected semester' 
            });
        }
        
        // Update enrollment
        const updateQuery = `
            UPDATE Student_Enrollments 
            SET Student_ID = ?, Module_Code = ?, Semester_Code = ? 
            WHERE Enrollment_ID = ?
        `;
        
        db.query(updateQuery, [studentId, moduleCode, semesterCode, enrollmentId], (err, results) => {
            if (err) {
                console.error('❌ Database error updating enrollment:', err);
                return res.status(500).json({ 
                    success: false,
                    message: 'Database error: ' + err.message 
                });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Enrollment not found' 
                });
            }
            
            res.json({ 
                success: true,
                message: 'Enrollment updated successfully'
            });
        });
    });
});


// Get semesters for dropdown
router.get('/semesters', auth, (req, res) => {
    const query = 'SELECT * FROM Semesters ORDER BY Academic_Year DESC, Semester_Number DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        res.json(results);
    });
});
router.delete('/:id', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin only.' 
        });
    }
    
    const enrollmentId = req.params.id;
    
    console.log('🗑️ Deleting enrollment:', enrollmentId);
    
    // First check if enrollment exists
    const checkQuery = 'SELECT * FROM Student_Enrollments WHERE Enrollment_ID = ?';
    
    db.query(checkQuery, [enrollmentId], (err, results) => {
        if (err) {
            console.error('❌ Database error checking enrollment:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        if (results.length === 0) {
            console.log('❌ Enrollment not found with ID:', enrollmentId);
            return res.status(404).json({ 
                success: false,
                message: 'Enrollment not found' 
            });
        }
        
        // Delete the enrollment - FIXED TABLE NAME
        const deleteQuery = 'DELETE FROM Student_Enrollments WHERE Enrollment_ID = ?';
        
        db.query(deleteQuery, [enrollmentId], (err, results) => {
            if (err) {
                console.error('❌ Database error deleting enrollment:', err);
                return res.status(500).json({ 
                    success: false,
                    message: 'Database error: ' + err.message 
                });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Enrollment not found' 
                });
            }
            
            console.log('✅ Enrollment deleted successfully. Affected rows:', results.affectedRows);
            
            res.json({ 
                success: true,
                message: 'Enrollment deleted successfully',
                deletedEnrollmentId: enrollmentId
            });
        });
    });
});

module.exports = router;*/
/*router.delete('/:id', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const enrollmentId = req.params.id;
    
    const query = 'DELETE FROM Enrollments WHERE EnrollmentID = ?';
    
    db.query(query, [enrollmentId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        
        res.json({ message: 'Enrollment deleted successfully' });
    });
});*/

const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get enrollments for a specific student
router.get('/student/:studentId', auth, (req, res) => {
    const studentId = req.params.studentId;
    
    console.log('=== GET STUDENT ENROLLMENTS ===');
    console.log('Requested student ID:', studentId);
    
    // Students can only access their own data, admins can access any
    if (req.user.userType === 'student' && parseInt(req.user.id) !== parseInt(studentId)) {
        console.log('Access denied: Student trying to access other student data');
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
        SELECT 
            e.Enrollment_ID,
            e.Student_ID,
            e.Module_Code,
            m.Module_Name,
            m.Module_Description,
            m.Credit_Hours,
            e.Semester_Code,
            sem.Semester_Number,
            sem.Academic_Year,
            e.Mark_Obtained,
            e.Grade,
            e.Enrollment_Date,
            e.Status,
            p.Programme_Name
        FROM Student_Enrollments e
        LEFT JOIN Modules m ON e.Module_Code = m.Module_Code
        LEFT JOIN Semesters sem ON e.Semester_Code = sem.Semester_Code
        LEFT JOIN Students s ON e.Student_ID = s.Student_ID
        LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code
        WHERE e.Student_ID = ?
        ORDER BY sem.Academic_Year DESC, sem.Semester_Number DESC, m.Module_Code
    `;
    
    console.log('Executing query for student:', studentId);
    
    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                message: 'Database error: ' + err.message
            });
        }
        
        console.log(`Query successful. Found ${results.length} enrollments`);
        
        if (results.length === 0) {
            console.log('No enrollments found for student:', studentId);
            return res.json([]);
        }
        
        res.json(results);
    });
});

// Get all enrollments (admin only)
router.get('/', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const query = `
        SELECT 
            e.Enrollment_ID, e.Student_ID, s.Student_Name, 
            e.Module_Code, m.Module_Name, m.Credit_Hours,
            e.Semester_Code, sem.Academic_Year, sem.Semester_Number,
            e.Mark_Obtained, e.Grade, e.Enrollment_Date, e.Status,
            p.Programme_Name
        FROM Student_Enrollments e
        JOIN Students s ON e.Student_ID = s.Student_ID
        JOIN Modules m ON e.Module_Code = m.Module_Code
        JOIN Semesters sem ON e.Semester_Code = sem.Semester_Code
        LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code
        ORDER BY e.Enrollment_ID DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }
        
        res.json(results);
    });
});



// Get semesters for dropdown
router.get('/semesters', auth, (req, res) => {
    const query = 'SELECT * FROM Semesters ORDER BY Academic_Year DESC, Semester_Number DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        res.json(results);
    });
});

// Add new enrollment (admin only)
// Add new enrollment (admin only)
router.post('/', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { studentId, moduleCode, semesterCode } = req.body;
    
    if (!studentId || !moduleCode || !semesterCode) {
        return res.status(400).json({ message: 'Student, module, and semester are required' });
    }
    
    // First: Check if student has already PASSED this module (grade A-D or marks >= 50)
    const checkPassedQuery = `
        SELECT * FROM Student_Enrollments 
        WHERE Student_ID = ? AND Module_Code = ? 
        AND (Grade IN ('A', 'B', 'C', 'D') OR Mark_Obtained >= 50)
        AND Status = 'Completed'
    `;
    
    db.query(checkPassedQuery, [studentId, moduleCode], (err, passedResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }
        
        // If student has already PASSED this module, prevent re-enrollment
        if (passedResults.length > 0) {
            const bestMark = Math.max(...passedResults.map(r => r.Mark_Obtained || 0));
            const bestGrade = passedResults.find(r => r.Mark_Obtained === bestMark)?.Grade || 'N/A';
            return res.status(400).json({ 
                message: `Student has already passed this module with ${bestMark}% (Grade: ${bestGrade}) and cannot re-enroll` 
            });
        }
        
        // Second: Check if enrollment already exists for this semester
        const checkCurrentQuery = 'SELECT * FROM Student_Enrollments WHERE Student_ID = ? AND Module_Code = ? AND Semester_Code = ?';
        
        db.query(checkCurrentQuery, [studentId, moduleCode, semesterCode], (err, currentResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error: ' + err.message });
            }
            
            if (currentResults.length > 0) {
                return res.status(400).json({ 
                    message: 'Student is already enrolled in this module for the selected semester' 
                });
            }
            
            // Third: Check if student has any FAILED attempts and is currently enrolled
            const checkFailedAndCurrentQuery = `
                SELECT * FROM Student_Enrollments 
                WHERE Student_ID = ? AND Module_Code = ? 
                AND (Status = 'Enrolled' OR (Status = 'Completed' AND (Grade = 'F' OR Mark_Obtained < 50)))
            `;
            
            db.query(checkFailedAndCurrentQuery, [studentId, moduleCode], (err, failedAndCurrentResults) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Database error: ' + err.message });
                }
                
                // Check if student is currently enrolled in this module
                const currentlyEnrolled = failedAndCurrentResults.some(enrollment => 
                    enrollment.Status === 'Enrolled'
                );
                
                if (currentlyEnrolled) {
                    return res.status(400).json({ 
                        message: 'Student is currently enrolled in this module in another semester' 
                    });
                }
                
                // Check if student has failed attempts
                const failedAttempts = failedAndCurrentResults.filter(enrollment => 
                    enrollment.Status === 'Completed' && (enrollment.Grade === 'F' || enrollment.Mark_Obtained < 50)
                );
                
                // If student has failed attempts, show warning but allow enrollment
                if (failedAttempts.length > 0) {
                    const lastAttempt = failedAttempts[failedAttempts.length - 1];
                    console.log(`⚠️ Student has failed this module previously with ${lastAttempt.Mark_Obtained}% - allowing re-enrollment`);
                    // Continue with enrollment - don't return error
                }
                
                // All checks passed - insert new enrollment
                const insertQuery = `
                    INSERT INTO Student_Enrollments (Student_ID, Module_Code, Semester_Code, Status) 
                    VALUES (?, ?, ?, 'Enrolled')
                `;
                
                db.query(insertQuery, [studentId, moduleCode, semesterCode], (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ message: 'Database error: ' + err.message });
                    }
                    
                    // If there were previous failed attempts, include a warning in the success message
                    const warning = failedAttempts.length > 0 
                        ? ` Note: Student had ${failedAttempts.length} previous failed attempt(s).` 
                        : '';
                    
                    res.json({ 
                        success: true,
                        message: 'Student enrolled successfully.' + warning,
                        enrollmentId: results.insertId,
                        hasPreviousFailures: failedAttempts.length > 0
                    });
                });
            });
        });
    });
});



// Update marks (admin only)
router.put('/marks', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { enrollmentId, markObtained } = req.body;
    
    if (!enrollmentId || markObtained === undefined) {
        return res.status(400).json({ message: 'Enrollment ID and marks are required' });
    }
    
    if (markObtained < 0 || markObtained > 100) {
        return res.status(400).json({ message: 'Marks must be between 0 and 100' });
    }
    
    // Calculate grade
    let grade = 'F';
    if (markObtained >= 80) grade = 'A';
    else if (markObtained >= 70) grade = 'B';
    else if (markObtained >= 60) grade = 'C';
    else if (markObtained >= 50) grade = 'D';
    
    const updateQuery = 'UPDATE Student_Enrollments SET Mark_Obtained = ?, Grade = ? WHERE Enrollment_ID = ?';
    
    db.query(updateQuery, [markObtained, grade, enrollmentId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        
        res.json({ message: 'Marks updated successfully' });
    });
});

// Delete enrollment (admin only) - FIXED
router.delete('/:id', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin only.' 
        });
    }
    
    const enrollmentId = req.params.id;
    
    console.log('🗑️ Deleting enrollment:', enrollmentId);
    
    // First check if enrollment exists
    const checkQuery = 'SELECT * FROM Student_Enrollments WHERE Enrollment_ID = ?';
    
    db.query(checkQuery, [enrollmentId], (err, results) => {
        if (err) {
            console.error('❌ Database error checking enrollment:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        if (results.length === 0) {
            console.log('❌ Enrollment not found with ID:', enrollmentId);
            return res.status(404).json({ 
                success: false,
                message: 'Enrollment not found' 
            });
        }
        
        // Delete the enrollment - FIXED TABLE NAME
        const deleteQuery = 'DELETE FROM Student_Enrollments WHERE Enrollment_ID = ?';
        
        db.query(deleteQuery, [enrollmentId], (err, results) => {
            if (err) {
                console.error('❌ Database error deleting enrollment:', err);
                return res.status(500).json({ 
                    success: false,
                    message: 'Database error: ' + err.message 
                });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Enrollment not found' 
                });
            }
            
            console.log('✅ Enrollment deleted successfully. Affected rows:', results.affectedRows);
            
            res.json({ 
                success: true,
                message: 'Enrollment deleted successfully',
                deletedEnrollmentId: enrollmentId
            });
        });
    });
});

module.exports = router;