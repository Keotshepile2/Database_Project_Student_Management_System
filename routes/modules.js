const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get all modules with programme details
router.get('/', auth, (req, res) => {
    const query = `
        SELECT m.*, p.Programme_Name, f.Faculty_Name 
        FROM Modules m 
        LEFT JOIN Programmes p ON m.Programme_Code = p.Programme_Code 
        LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
        ORDER BY m.Module_Code
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        res.json(results);
    });
});

// Get modules by programme
router.get('/programme/:programmeCode', auth, (req, res) => {
    const programmeCode = req.params.programmeCode;
    
    const query = 'SELECT * FROM Modules WHERE Programme_Code = ? ORDER BY Year_Level, Semester_Offered';
    
    db.query(query, [programmeCode], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        res.json(results);
    });
});

// Add new module (admin only)
// Add new module
router.post('/', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { moduleCode, moduleName, moduleDescription, creditHours, yearLevel, semesterOffered, programmeCode } = req.body;
    
    console.log('Received module data:', req.body);
    
    if (!moduleCode || !moduleName || !creditHours || !yearLevel || !programmeCode) {
        return res.status(400).json({ message: 'Required fields: code, name, credits, year level, programme' });
    }
    
    const query = `
        INSERT INTO Modules (Module_Code, Module_Name, Module_Description, Credit_Hours, Year_Level, Semester_Offered, Programme_Code) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [moduleCode, moduleName, moduleDescription, creditHours, yearLevel, semesterOffered || null, programmeCode], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }
        
        res.json({ 
            success: true,
            message: 'Module added successfully',
            moduleCode: moduleCode 
        });
    });
});

// Update module (admin only)
// Get module by code
router.get('/:code', auth, (req, res) => {
    const moduleCode = req.params.code;
    
    console.log('🔍 Fetching module with code:', moduleCode);
    
    const query = `
        SELECT m.*, p.Programme_Name, f.Faculty_Name 
        FROM Modules m 
        LEFT JOIN Programmes p ON m.Programme_Code = p.Programme_Code 
        LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
        WHERE m.Module_Code = ?
    `;
    
    db.query(query, [moduleCode], (err, results) => {
        if (err) {
            console.error('❌ Database error fetching module:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        console.log('📊 Module query results:', results);
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Module not found' 
            });
        }
        
        res.json(results[0]);
    });
});

// Add new module (admin only)
router.post('/', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin only.' 
        });
    }
    
    const { moduleCode, moduleName, moduleDescription, creditHours, yearLevel, semesterOffered, programmeCode } = req.body;
    
    console.log('Received module data:', req.body);
    
    if (!moduleCode || !moduleName || !creditHours || !yearLevel || !programmeCode) {
        return res.status(400).json({ 
            success: false,
            message: 'Required fields: code, name, credits, year level, programme' 
        });
    }
    
    const query = `
        INSERT INTO Modules (Module_Code, Module_Name, Module_Description, Credit_Hours, Year_Level, Semester_Offered, Programme_Code) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [moduleCode, moduleName, moduleDescription, creditHours, yearLevel, semesterOffered || null, programmeCode], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false,
                    message: 'Module code already exists' 
                });
            }
            
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Module added successfully',
            moduleCode: moduleCode 
        });
    });
});

// Update module (admin only)
router.put('/:code', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin only.' 
        });
    }
    
    const moduleCode = req.params.code;
    const { moduleName, moduleDescription, creditHours, yearLevel, semesterOffered, programmeCode } = req.body;
    
    console.log('🔄 Updating module:', moduleCode, req.body);
    
    if (!moduleName || !creditHours || !yearLevel || !programmeCode) {
        return res.status(400).json({ 
            success: false,
            message: 'Required fields: name, credits, year level, programme' 
        });
    }
    
    const query = `
        UPDATE Modules 
        SET Module_Name = ?, Module_Description = ?, Credit_Hours = ?, 
            Year_Level = ?, Semester_Offered = ?, Programme_Code = ?
        WHERE Module_Code = ?
    `;
    
    db.query(query, [moduleName, moduleDescription, creditHours, yearLevel, semesterOffered, programmeCode, moduleCode], (err, results) => {
        if (err) {
            console.error('❌ Database error updating module:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Module not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Module updated successfully'
        });
    });
});

// Delete module (admin only)
router.delete('/:code', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin only.' 
        });
    }
    
    const moduleCode = req.params.code;
    
    console.log('🗑️ Deleting module:', moduleCode);
    
    // Check if module has enrollments
    const checkQuery = 'SELECT * FROM Student_Enrollments WHERE Module_Code = ?';
    
    db.query(checkQuery, [moduleCode], (err, results) => {
        if (err) {
            console.error('❌ Database error checking enrollments:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Database error: ' + err.message 
            });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot delete module with existing enrollments' 
            });
        }
        
        const deleteQuery = 'DELETE FROM Modules WHERE Module_Code = ?';
        
        db.query(deleteQuery, [moduleCode], (err, results) => {
            if (err) {
                console.error('❌ Database error deleting module:', err);
                return res.status(500).json({ 
                    success: false,
                    message: 'Database error: ' + err.message 
                });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Module not found' 
                });
            }
            
            res.json({ 
                success: true,
                message: 'Module deleted successfully' 
            });
        });
    });
});
/*router.put('/:code', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const moduleCode = req.params.code;
    const { moduleName, description, creditHours, semester } = req.body;
    
    // Validate input
    if (!moduleName || !description || !creditHours || !semester) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    const query = `
        UPDATE Modules 
        SET ModuleName = ?, Description = ?, CreditHours = ?, Semester = ? 
        WHERE ModuleCode = ?
    `;
    
    db.query(query, [moduleName, description, creditHours, semester, moduleCode], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Module not found' });
        }
        
        res.json({ message: 'Module updated successfully' });
    });
});

// Delete module (admin only)
router.delete('/:code', auth, (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const moduleCode = req.params.code;
    
    // Check if module has enrollments
    const checkQuery = 'SELECT * FROM Enrollments WHERE ModuleCode = ?';
    
    db.query(checkQuery, [moduleCode], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ message: 'Cannot delete module with existing enrollments' });
        }
        
        const deleteQuery = 'DELETE FROM Modules WHERE ModuleCode = ?';
        
        db.query(deleteQuery, [moduleCode], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Module not found' });
            }
            
            res.json({ message: 'Module deleted successfully' });
        });
    });
});
*/
module.exports = router;