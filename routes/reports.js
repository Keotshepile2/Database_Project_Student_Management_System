/*const express = require('express');
const db = require('../config/database');
const PDFDocument = require('pdfkit');
const fontkit = require('fontkit');

const router = express.Router();

// Generate Semester Result Slip
router.get('/semester/:studentId/:semesterCode', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const semesterCode = req.params.semesterCode;
        
        console.log('Generating semester slip for:', studentId, semesterCode);
        
        // Get student info
        const studentQuery = `
            SELECT s.*, p.Programme_Name, f.Faculty_Name 
            FROM Students s 
            LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code 
            LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
            WHERE s.Student_ID = ?
        `;
        
        const [studentResults] = await db.promise().query(studentQuery, [studentId]);
        
        if (studentResults.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const student = studentResults[0];
        
        // Get semester info
        const semesterQuery = 'SELECT * FROM Semesters WHERE Semester_Code = ?';
        const [semesterResults] = await db.promise().query(semesterQuery, [semesterCode]);
        
        if (semesterResults.length === 0) {
            return res.status(404).json({ message: 'Semester not found' });
        }
        
        const semester = semesterResults[0];
        
        // Get enrollments for the semester
        const enrollmentsQuery = `
            SELECT e.*, m.Module_Name, m.Credit_Hours 
            FROM Student_Enrollments e 
            JOIN Modules m ON e.Module_Code = m.Module_Code 
            WHERE e.Student_ID = ? AND e.Semester_Code = ?
            ORDER BY m.Module_Code
        `;
        
        const [enrollments] = await db.promise().query(enrollmentsQuery, [studentId, semesterCode]);
        
        // Generate PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
             font: 'Helvetica'
        });
        
        // Set PDF headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="semester-result-${studentId}-${semesterCode}.pdf"`);
        
        doc.pipe(res);
        
        // Add university header
        addUniversityHeader(doc);
        
        // Add title
        doc.moveDown();
        doc.fontSize(18).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text('SEMESTER RESULT SLIP', { align: 'center' });
        
        doc.moveDown(0.5);
        
        // Add student information section
        addStudentInfoSection(doc, student, semester);
        
        doc.moveDown();
        
        // Add results table
        addResultsTable(doc, enrollments);
        
        // Add summary section
        addSummarySection(doc, enrollments);
        
        // Add footer
        addFooter(doc);
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating semester slip:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Generate Academic Record
router.get('/academic/:studentId/:academicYear', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const academicYear = req.params.academicYear;
        
        // Get student info
        const studentQuery = `
            SELECT s.*, p.Programme_Name, f.Faculty_Name 
            FROM Students s 
            LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code 
            LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
            WHERE s.Student_ID = ?
        `;
        
        const [studentResults] = await db.promise().query(studentQuery, [studentId]);
        
        if (studentResults.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const student = studentResults[0];
        
        // Get enrollments for the academic year
        const enrollmentsQuery = `
            SELECT e.*, m.Module_Name, m.Credit_Hours, sem.Academic_Year, sem.Semester_Number 
            FROM Student_Enrollments e 
            JOIN Modules m ON e.Module_Code = m.Module_Code 
            JOIN Semesters sem ON e.Semester_Code = sem.Semester_Code 
            WHERE e.Student_ID = ? AND sem.Academic_Year = ?
            ORDER BY sem.Semester_Number, m.Module_Code
        `;
        
        const [enrollments] = await db.promise().query(enrollmentsQuery, [studentId, academicYear]);
        
        // Generate PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
             font: 'Helvetica'
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="academic-record-${studentId}-${academicYear}.pdf"`);
        
        doc.pipe(res);
        
        // Add university header
        addUniversityHeader(doc);
        
        // Add title
        doc.moveDown();
        doc.fontSize(18).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text('ACADEMIC RECORD', { align: 'center' });
        
        doc.moveDown(0.5);
        
        // Add student information
        addStudentInfoSection(doc, student, { Academic_Year: academicYear });
        
        doc.moveDown();
        
        // Add academic record by semester
        addAcademicRecordBySemester(doc, enrollments, academicYear);
        
        // Add footer
        addFooter(doc);
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating academic record:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Generate Full Transcript
router.get('/transcript/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        // Get student info
        const studentQuery = `
            SELECT s.*, p.Programme_Name, f.Faculty_Name 
            FROM Students s 
            LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code 
            LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
            WHERE s.Student_ID = ?
        `;
        
        const [studentResults] = await db.promise().query(studentQuery, [studentId]);
        
        if (studentResults.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const student = studentResults[0];
        
        // Get all enrollments for the student
        const enrollmentsQuery = `
            SELECT e.*, m.Module_Name, m.Credit_Hours, sem.Academic_Year, sem.Semester_Number 
            FROM Student_Enrollments e 
            JOIN Modules m ON e.Module_Code = m.Module_Code 
            JOIN Semesters sem ON e.Semester_Code = sem.Semester_Code 
            WHERE e.Student_ID = ? 
            ORDER BY sem.Academic_Year, sem.Semester_Number, m.Module_Code
        `;
        
        const [enrollments] = await db.promise().query(enrollmentsQuery, [studentId]);
        
        // Generate PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
             font: 'Helvetica'
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="transcript-${studentId}.pdf"`);
        
        doc.pipe(res);
        
        // Add university header
        addUniversityHeader(doc);
        
        // Add title
        doc.moveDown();
        doc.fontSize(18).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text('OFFICIAL TRANSCRIPT', { align: 'center' });
        
        doc.moveDown(0.5);
        
        // Add comprehensive student information
        addTranscriptStudentInfo(doc, student);
        
        doc.moveDown();
        
        // Add complete academic history
        addCompleteAcademicHistory(doc, enrollments);
        
        // Add final summary
        addTranscriptSummary(doc, enrollments);
        
        // Add footer
        addFooter(doc, true); // Official transcript footer
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating transcript:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// ==================== HELPER FUNCTIONS ====================

function addUniversityHeader(doc) {
    // University header with styling
    doc.rect(50, 50, doc.page.width - 100, 60)
       .fillColor('#2c3e50')
       .fill();
    
    doc.fontSize(24).font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('MADIBOGO UNIVERSITY', 50, 65, { align: 'center' });
    
    doc.fontSize(12).font('Helvetica')
       .text('Quality Education for Future Leaders', 50, 95, { align: 'center' });
    
    // Reset color for rest of document
    doc.fillColor('#000000');
}

function addStudentInfoSection(doc, student, semester) {
    const startY = 150;
    let currentY = startY;
    
    doc.fontSize(12).font('Helvetica-Bold');
    
    // Student Information Box
    doc.rect(50, currentY, doc.page.width - 100, 80)
       .fillColor('#f8f9fa')
       .fill();
    
    doc.fillColor('#2c3e50');
    doc.text('STUDENT INFORMATION', 60, currentY + 10);
    doc.fillColor('#000000');
    
    currentY += 25;
    
    // Student details in two columns
    const col1X = 60;
    const col2X = 300;
    
    doc.font('Helvetica');
    doc.text(`Student Name: ${student.Student_Name}`, col1X, currentY);
    doc.text(`Student ID: ${student.Student_ID}`, col2X, currentY);
    
    currentY += 15;
    doc.text(`Programme: ${student.Programme_Name}`, col1X, currentY);
    doc.text(`Faculty: ${student.Faculty_Name}`, col2X, currentY);
    
    currentY += 15;
    if (semester.Academic_Year) {
        doc.text(`Academic Year: ${semester.Academic_Year}`, col1X, currentY);
    }
    if (semester.Semester_Number) {
        doc.text(`Semester: ${semester.Semester_Number}`, col2X, currentY);
    }
}

function addResultsTable(doc, enrollments) {
    const tableTop = 280;
    const colWidths = [80, 200, 60, 60, 60]; // Column widths
    
    // Table header
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#ffffff');
    
    doc.rect(50, tableTop, colWidths[0], 25).fillColor('#34495e').fill();
    doc.text('CODE', 50, tableTop + 8, { width: colWidths[0], align: 'center' });
    
    doc.rect(50 + colWidths[0], tableTop, colWidths[1], 25).fillColor('#34495e').fill();
    doc.text('MODULE NAME', 50 + colWidths[0], tableTop + 8, { width: colWidths[1], align: 'center' });
    
    doc.rect(50 + colWidths[0] + colWidths[1], tableTop, colWidths[2], 25).fillColor('#34495e').fill();
    doc.text('CREDITS', 50 + colWidths[0] + colWidths[1], tableTop + 8, { width: colWidths[2], align: 'center' });
    
    doc.rect(50 + colWidths[0] + colWidths[1] + colWidths[2], tableTop, colWidths[3], 25).fillColor('#34495e').fill();
    doc.text('MARKS', 50 + colWidths[0] + colWidths[1] + colWidths[2], tableTop + 8, { width: colWidths[3], align: 'center' });
    
    doc.rect(50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop, colWidths[4], 25).fillColor('#34495e').fill();
    doc.text('GRADE', 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop + 8, { width: colWidths[4], align: 'center' });
    
    doc.fillColor('#000000');
    
    // Table rows
    let currentY = tableTop + 25;
    let rowIndex = 0;
    
    enrollments.forEach(enrollment => {
        // Alternate row colors
        if (rowIndex % 2 === 0) {
            doc.rect(50, currentY, doc.page.width - 100, 20).fillColor('#f8f9fa').fill();
        }
        
        doc.fontSize(10).font('Helvetica');
        
        // Module code
        doc.text(enrollment.Module_Code, 50, currentY + 5, { 
            width: colWidths[0], 
            align: 'center' 
        });
        
        // Module name
        doc.text(enrollment.Module_Name, 50 + colWidths[0], currentY + 5, { 
            width: colWidths[1] 
        });
        
        // Credits
        doc.text(enrollment.Credit_Hours.toString(), 50 + colWidths[0] + colWidths[1], currentY + 5, { 
            width: colWidths[2], 
            align: 'center' 
        });
        
        // Marks
        const marks = enrollment.Mark_Obtained ? enrollment.Mark_Obtained.toString() : 'N/A';
        doc.text(marks, 50 + colWidths[0] + colWidths[1] + colWidths[2], currentY + 5, { 
            width: colWidths[3], 
            align: 'center' 
        });
        
        // Grade with color coding
        const grade = enrollment.Grade || 'N/A';
        doc.fillColor(getGradeColor(grade));
        doc.text(grade, 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY + 5, { 
            width: colWidths[4], 
            align: 'center' 
        });
        doc.fillColor('#000000');
        
        currentY += 20;
        rowIndex++;
        
        // Check if we need a new page
        if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50;
            // Add table header on new page
            addResultsTableHeader(doc, currentY, colWidths);
            currentY += 25;
        }
    });
}

function addResultsTableHeader(doc, yPosition, colWidths) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
    
    doc.rect(50, yPosition, colWidths[0], 25).fillColor('#34495e').fill();
    doc.text('CODE', 50, yPosition + 8, { width: colWidths[0], align: 'center' });
    
    doc.rect(50 + colWidths[0], yPosition, colWidths[1], 25).fillColor('#34495e').fill();
    doc.text('MODULE NAME', 50 + colWidths[0], yPosition + 8, { width: colWidths[1], align: 'center' });
    
    // ... repeat for other columns
}

function addSummarySection(doc, enrollments) {
    const summaryY = doc.y + 20;
    
    // Calculate totals
    let totalCredits = 0;
    let totalPoints = 0;
    
    enrollments.forEach(enrollment => {
        if (enrollment.Mark_Obtained && enrollment.Credit_Hours) {
            totalCredits += enrollment.Credit_Hours;
            totalPoints += enrollment.Credit_Hours * calculateGradePoints(enrollment.Grade);
        }
    });
    
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    
    // Summary box
    doc.rect(50, summaryY, doc.page.width - 100, 40)
       .fillColor('#e8f4f8')
       .fill();
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text('ACADEMIC SUMMARY', 60, summaryY + 10);
    
    doc.font('Helvetica');
    doc.text(`Total Credit Hours: ${totalCredits}`, 300, summaryY + 10);
    doc.text(`Grade Point Average: ${gpa}`, 300, summaryY + 25);
    
    doc.fillColor('#000000');
}

function addAcademicRecordBySemester(doc, enrollments, academicYear) {
    // Group by semester
    const semesters = {};
    enrollments.forEach(enrollment => {
        const semesterKey = `Semester ${enrollment.Semester_Number}`;
        if (!semesters[semesterKey]) {
            semesters[semesterKey] = [];
        }
        semesters[semesterKey].push(enrollment);
    });
    
    Object.keys(semesters).forEach(semesterName => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 200) {
            doc.addPage();
            doc.y = 50;
        }
        
        doc.fontSize(14).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text(semesterName, 50, doc.y);
        
        doc.moveDown(0.5);
        
        // Add semester results table
        addSimpleResultsTable(doc, semesters[semesterName]);
        
        // Add semester summary
        addSemesterSummary(doc, semesters[semesterName]);
        
        doc.moveDown();
    });
}

function addCompleteAcademicHistory(doc, enrollments) {
    // Group by academic year and semester
    const academicHistory = {};
    
    enrollments.forEach(enrollment => {
        const yearKey = `Year ${enrollment.Academic_Year}`;
        const semesterKey = `Semester ${enrollment.Semester_Number}`;
        
        if (!academicHistory[yearKey]) {
            academicHistory[yearKey] = {};
        }
        if (!academicHistory[yearKey][semesterKey]) {
            academicHistory[yearKey][semesterKey] = [];
        }
        
        academicHistory[yearKey][semesterKey].push(enrollment);
    });
    
    // Add each academic year
    Object.keys(academicHistory).sort().forEach(year => {
        if (doc.y > doc.page.height - 150) {
            doc.addPage();
            doc.y = 50;
        }
        
        doc.fontSize(16).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text(year.toUpperCase(), 50, doc.y);
        
        doc.moveDown(0.5);
        
        // Add each semester
        Object.keys(academicHistory[year]).sort().forEach(semester => {
            doc.fontSize(12).font('Helvetica-Bold')
               .fillColor('#34495e')
               .text(semester, 60, doc.y);
            
            doc.moveDown(0.3);
            
            // Add semester courses
            academicHistory[year][semester].forEach(enrollment => {
                const grade = enrollment.Grade || 'In Progress';
                doc.fontSize(10).font('Helvetica')
                   .text(`  ${enrollment.Module_Code} - ${enrollment.Module_Name}`, 70, doc.y, { continued: true })
                   .text(` (${enrollment.Credit_Hours} cr) - ${enrollment.Mark_Obtained || 'N/A'} - ${grade}`, { align: 'right' });
                
                doc.moveDown(0.2);
            });
            
            doc.moveDown(0.3);
        });
        
        doc.moveDown();
    });
}

function addTranscriptStudentInfo(doc, student) {
    const infoY = 150;
    
    doc.rect(50, infoY, doc.page.width - 100, 100)
       .fillColor('#f0f8ff')
       .fill();
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text('STUDENT PROFILE', 60, infoY + 15);
    
    const col1X = 60;
    const col2X = 300;
    let currentY = infoY + 35;
    
    doc.font('Helvetica').fillColor('#000000');
    doc.text(`Full Name: ${student.Student_Name}`, col1X, currentY);
    doc.text(`Student ID: ${student.Student_ID}`, col2X, currentY);
    
    currentY += 15;
    doc.text(`Programme: ${student.Programme_Name}`, col1X, currentY);
    doc.text(`Faculty: ${student.Faculty_Name}`, col2X, currentY);
    
    currentY += 15;
    doc.text(`Date of Birth: ${student.Date_of_Birth || 'N/A'}`, col1X, currentY);
    doc.text(`Year Enrolled: ${student.Year_Enrolled}`, col2X, currentY);
    
    currentY += 15;
    doc.text(`Email: ${student.Email_Address}`, col1X, currentY);
    doc.text(`Status: ${student.Enrollment_Status}`, col2X, currentY);
}

function addTranscriptSummary(doc, enrollments) {
    const summaryY = doc.y + 20;
    
    // Calculate overall statistics
    let totalCredits = 0;
    let totalPoints = 0;
    let completedCourses = 0;
    
    enrollments.forEach(enrollment => {
        if (enrollment.Mark_Obtained && enrollment.Credit_Hours) {
            totalCredits += enrollment.Credit_Hours;
            totalPoints += enrollment.Credit_Hours * calculateGradePoints(enrollment.Grade);
            completedCourses++;
        }
    });
    
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    
    doc.rect(50, summaryY, doc.page.width - 100, 60)
       .fillColor('#e8f4f8')
       .fill();
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text('TRANSCRIPT SUMMARY', 60, summaryY + 15);
    
    doc.font('Helvetica').fillColor('#000000');
    doc.text(`Total Courses Completed: ${completedCourses}`, 60, summaryY + 35);
    doc.text(`Total Credit Hours: ${totalCredits}`, 250, summaryY + 35);
    doc.text(`Cumulative GPA: ${gpa}`, 400, summaryY + 35);
}

function addFooter(doc, isOfficial = false) {
    const footerY = doc.page.height - 50;
    
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    
    if (isOfficial) {
        doc.text('This is an official transcript. Any alteration voids this document.', 50, footerY, { align: 'center' });
        doc.text('Issued by Madibogo University Registrar Office', 50, footerY + 12, { align: 'center' });
    } else {
        doc.text('Generated on: ' + new Date().toLocaleDateString(), 50, footerY, { align: 'center' });
        doc.text('Madibogo University - Student Record System', 50, footerY + 12, { align: 'center' });
    }
    
    // Add page numbers if multiple pages
    const pageCount = doc.bufferedPageRange().count;
    if (pageCount > 1) {
        doc.text(`Page ${doc.page.number} of ${pageCount}`, 50, footerY + 24, { align: 'center' });
    }
}

function addSimpleResultsTable(doc, enrollments) {
    const tableTop = doc.y;
    const colWidths = [80, 250, 60, 60, 60];
    
    // Simple table implementation
    enrollments.forEach((enrollment, index) => {
        const yPos = tableTop + (index * 15);
        
        doc.fontSize(9).font('Helvetica');
        doc.text(enrollment.Module_Code, 60, yPos, { width: colWidths[0] });
        doc.text(enrollment.Module_Name, 60 + colWidths[0], yPos, { width: colWidths[1] });
        doc.text(enrollment.Credit_Hours.toString(), 60 + colWidths[0] + colWidths[1], yPos, { width: colWidths[2], align: 'center' });
        
        const marks = enrollment.Mark_Obtained ? enrollment.Mark_Obtained.toString() : 'N/A';
        doc.text(marks, 60 + colWidths[0] + colWidths[1] + colWidths[2], yPos, { width: colWidths[3], align: 'center' });
        
        const grade = enrollment.Grade || 'N/A';
        doc.fillColor(getGradeColor(grade));
        doc.text(grade, 60 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos, { width: colWidths[4], align: 'center' });
        doc.fillColor('#000000');
    });
    
    doc.y = tableTop + (enrollments.length * 15) + 10;
}

function addSemesterSummary(doc, enrollments) {
    let semesterCredits = 0;
    let semesterPoints = 0;
    
    enrollments.forEach(enrollment => {
        if (enrollment.Mark_Obtained && enrollment.Credit_Hours) {
            semesterCredits += enrollment.Credit_Hours;
            semesterPoints += enrollment.Credit_Hours * calculateGradePoints(enrollment.Grade);
        }
    });
    
    const semesterGPA = semesterCredits > 0 ? (semesterPoints / semesterCredits).toFixed(2) : '0.00';
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Semester GPA: ${semesterGPA}`, { align: 'right' });
}

// Utility functions
function calculateGradePoints(grade) {
    if (!grade) return 0;
    switch(grade.toUpperCase()) {
        case 'A': return 4.0;
        case 'B': return 3.0;
        case 'C': return 2.0;
        case 'D': return 1.0;
        default: return 0.0;
    }
}

function getGradeColor(grade) {
    if (!grade) return '#666666';
    switch(grade.toUpperCase()) {
        case 'A': return '#27ae60'; // Green
        case 'B': return '#2980b9'; // Blue
        case 'C': return '#f39c12'; // Orange
        case 'D': return '#e74c3c'; // Red
        default: return '#666666';  // Gray
    }
}

module.exports = router;
*/
const express = require('express');
const db = require('../config/database');
const PDFDocument = require('pdfkit');
const fontkit = require('fontkit');

const router = express.Router();

// Generate Semester Result Slip
router.get('/semester/:studentId/:semesterCode', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const semesterCode = req.params.semesterCode;
        
        console.log('Generating semester slip for:', studentId, semesterCode);
        
        // Get student info
        const studentQuery = `
            SELECT s.*, p.Programme_Name, p.Programme_Code, f.Faculty_Name 
            FROM Students s 
            LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code 
            LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
            WHERE s.Student_ID = ?
        `;
        
        const [studentResults] = await db.promise().query(studentQuery, [studentId]);
        
        if (studentResults.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const student = studentResults[0];
        
        // Get semester info
        const semesterQuery = 'SELECT * FROM Semesters WHERE Semester_Code = ?';
        const [semesterResults] = await db.promise().query(semesterQuery, [semesterCode]);
        
        if (semesterResults.length === 0) {
            return res.status(404).json({ message: 'Semester not found' });
        }
        
        const semester = semesterResults[0];
        
        // Get enrollments for the semester
        const enrollmentsQuery = `
            SELECT e.*, m.Module_Name, m.Credit_Hours 
            FROM Student_Enrollments e 
            JOIN Modules m ON e.Module_Code = m.Module_Code 
            WHERE e.Student_ID = ? AND e.Semester_Code = ?
            ORDER BY m.Module_Code
        `;
        
        const [enrollments] = await db.promise().query(enrollmentsQuery, [studentId, semesterCode]);
        
        // Generate PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            font: 'Helvetica'
        });
        
        // Set PDF headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="semester-result-${studentId}-${semesterCode}.pdf"`);
        
        doc.pipe(res);
        
        // Add university header
        addUniversityHeader(doc);
        
        // Add title
        doc.moveDown();
        doc.fontSize(18).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text('SEMESTER RESULT SLIP', { align: 'center' });
        
        doc.moveDown(0.5);
        
        // Add student information section
        addStudentInfoSection(doc, student, semester);
        
        doc.moveDown();
        
        // Add results table
        addResultsTable(doc, enrollments);
        
        // Add summary section
        addSummarySection(doc, enrollments);
        
        // Add footer
        addFooter(doc);
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating semester slip:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Generate Academic Record
router.get('/academic/:studentId/:academicYear', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const academicYear = req.params.academicYear;
        
        // Get student info
        const studentQuery = `
            SELECT s.*, p.Programme_Name, p.Programme_Code, f.Faculty_Name 
            FROM Students s 
            LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code 
            LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
            WHERE s.Student_ID = ?
        `;
        
        const [studentResults] = await db.promise().query(studentQuery, [studentId]);
        
        if (studentResults.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const student = studentResults[0];
        
        // Get enrollments for the academic year
        const enrollmentsQuery = `
            SELECT e.*, m.Module_Name, m.Credit_Hours, sem.Academic_Year, sem.Semester_Number 
            FROM Student_Enrollments e 
            JOIN Modules m ON e.Module_Code = m.Module_Code 
            JOIN Semesters sem ON e.Semester_Code = sem.Semester_Code 
            WHERE e.Student_ID = ? AND sem.Academic_Year = ?
            ORDER BY sem.Semester_Number, m.Module_Code
        `;
        
        const [enrollments] = await db.promise().query(enrollmentsQuery, [studentId, academicYear]);
        
        // Generate PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            font: 'Helvetica'
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="academic-record-${studentId}-${academicYear}.pdf"`);
        
        doc.pipe(res);
        
        // Add university header
        addUniversityHeader(doc);
        
        // Add title
        doc.moveDown();
        doc.fontSize(18).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text('ACADEMIC RECORD', { align: 'center' });
        
        doc.moveDown(0.5);
        
        // Add student information
        addStudentInfoSection(doc, student, { Academic_Year: academicYear });
        
        doc.moveDown();
        
        // Add academic record by semester
        addAcademicRecordBySemester(doc, enrollments, academicYear);
        
        // Add footer
        addFooter(doc);
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating academic record:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Generate Full Transcript
router.get('/transcript/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        // Get student info
        const studentQuery = `
            SELECT s.*, p.Programme_Name, p.Programme_Code, f.Faculty_Name 
            FROM Students s 
            LEFT JOIN Programmes p ON s.Programme_Code = p.Programme_Code 
            LEFT JOIN Faculties f ON p.Faculty_Code = f.Faculty_Code 
            WHERE s.Student_ID = ?
        `;
        
        const [studentResults] = await db.promise().query(studentQuery, [studentId]);
        
        if (studentResults.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const student = studentResults[0];
        
        // Get all enrollments for the student
        const enrollmentsQuery = `
            SELECT e.*, m.Module_Name, m.Credit_Hours, sem.Academic_Year, sem.Semester_Number 
            FROM Student_Enrollments e 
            JOIN Modules m ON e.Module_Code = m.Module_Code 
            JOIN Semesters sem ON e.Semester_Code = sem.Semester_Code 
            WHERE e.Student_ID = ? 
            ORDER BY sem.Academic_Year, sem.Semester_Number, m.Module_Code
        `;
        
        const [enrollments] = await db.promise().query(enrollmentsQuery, [studentId]);
        
        // Generate PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            font: 'Helvetica'
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="transcript-${studentId}.pdf"`);
        
        doc.pipe(res);
        
        // Add university header
        addUniversityHeader(doc);
        
        // Add title
        doc.moveDown();
        doc.fontSize(18).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text('OFFICIAL TRANSCRIPT', { align: 'center' });
        
        doc.moveDown(0.5);
        
        // Add comprehensive student information
        addTranscriptStudentInfo(doc, student);
        
        doc.moveDown();
        
        // Add complete academic history
        addCompleteAcademicHistory(doc, enrollments);
        
        // Add final summary
        addTranscriptSummary(doc, enrollments);
        
        // Add footer
        addFooter(doc, true); // Official transcript footer
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating transcript:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// ==================== HELPER FUNCTIONS ====================

function addUniversityHeader(doc) {
    // University header with styling
    doc.rect(50, 50, doc.page.width - 100, 60)
       .fillColor('#2c3e50')
       .fill();
    
    doc.fontSize(24).font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('MADIBOGO UNIVERSITY', 50, 65, { align: 'center' });
    
    doc.fontSize(12).font('Helvetica')
       .text('Quality Education for Future Leaders', 50, 95, { align: 'center' });
    
    // Reset color for rest of document
    doc.fillColor('#000000');
}

function addStudentInfoSection(doc, student, semester) {
    const startY = 150;
    let currentY = startY;
    
    doc.fontSize(12).font('Helvetica-Bold');
    
    // Student Information Box
    doc.rect(50, currentY, doc.page.width - 100, 80)
       .fillColor('#f8f9fa')
       .fill();
    
    doc.fillColor('#2c3e50');
    doc.text('STUDENT INFORMATION', 60, currentY + 10);
    doc.fillColor('#000000');
    
    currentY += 25;
    
    // Student details in two columns
    const col1X = 60;
    const col2X = 300;
    
    doc.font('Helvetica');
    doc.text(`Student Name: ${student.Student_Name}`, col1X, currentY);
    doc.text(`Student ID: ${student.Student_ID}`, col2X, currentY);
    
    currentY += 15;
    doc.text(`Programme: ${student.Programme_Code || student.Programme_Name}`, col1X, currentY);
    doc.text(`Faculty: ${student.Faculty_Name}`, col2X, currentY);
    
    currentY += 15;
    if (semester.Academic_Year) {
        doc.text(`Academic Year: ${semester.Academic_Year}`, col1X, currentY);
    }
    if (semester.Semester_Number) {
        doc.text(`Semester: ${semester.Semester_Number}`, col2X, currentY);
    }
}

function addResultsTable(doc, enrollments) {
    const tableTop = 280;
    const colWidths = [80, 200, 60, 60, 60]; // Column widths
    
    // Table header
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#ffffff');
    
    doc.rect(50, tableTop, colWidths[0], 25).fillColor('#34495e').fill();
    doc.text('CODE', 50, tableTop + 8, { width: colWidths[0], align: 'center' });
    
    doc.rect(50 + colWidths[0], tableTop, colWidths[1], 25).fillColor('#34495e').fill();
    doc.text('MODULE NAME', 50 + colWidths[0], tableTop + 8, { width: colWidths[1], align: 'center' });
    
    doc.rect(50 + colWidths[0] + colWidths[1], tableTop, colWidths[2], 25).fillColor('#34495e').fill();
    doc.text('CREDITS', 50 + colWidths[0] + colWidths[1], tableTop + 8, { width: colWidths[2], align: 'center' });
    
    doc.rect(50 + colWidths[0] + colWidths[1] + colWidths[2], tableTop, colWidths[3], 25).fillColor('#34495e').fill();
    doc.text('MARKS', 50 + colWidths[0] + colWidths[1] + colWidths[2], tableTop + 8, { width: colWidths[3], align: 'center' });
    
    doc.rect(50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop, colWidths[4], 25).fillColor('#34495e').fill();
    doc.text('GRADE', 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop + 8, { width: colWidths[4], align: 'center' });
    
    doc.fillColor('#000000');
    
    // Table rows - FIXED: Ensure text is always visible
    let currentY = tableTop + 25;
    
    enrollments.forEach((enrollment, rowIndex) => {
        // Draw background first
        if (rowIndex % 2 === 0) {
            doc.rect(50, currentY, doc.page.width - 100, 20).fillColor('#f8f9fa').fill();
        } else {
            doc.rect(50, currentY, doc.page.width - 100, 20).fillColor('#ffffff').fill();
        }
        
        // Now draw text on top with proper color
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        
        // Module code
        doc.text(enrollment.Module_Code, 50, currentY + 5, { 
            width: colWidths[0], 
            align: 'center' 
        });
        
        // Module name
        doc.text(enrollment.Module_Name, 50 + colWidths[0], currentY + 5, { 
            width: colWidths[1] 
        });
        
        // Credits
        doc.text(enrollment.Credit_Hours.toString(), 50 + colWidths[0] + colWidths[1], currentY + 5, { 
            width: colWidths[2], 
            align: 'center' 
        });
        
        // Marks
        const marks = enrollment.Mark_Obtained ? enrollment.Mark_Obtained.toString() : 'N/A';
        doc.text(marks, 50 + colWidths[0] + colWidths[1] + colWidths[2], currentY + 5, { 
            width: colWidths[3], 
            align: 'center' 
        });
        
        // Grade with color coding
        const grade = enrollment.Grade || 'N/A';
        doc.fillColor(getGradeColor(grade));
        doc.text(grade, 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], currentY + 5, { 
            width: colWidths[4], 
            align: 'center' 
        });
        doc.fillColor('#000000');
        
        currentY += 20;
        
        // Check if we need a new page
        if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50;
            // Add table header on new page
            addResultsTableHeader(doc, currentY, colWidths);
            currentY += 25;
        }
    });
}

function addResultsTableHeader(doc, yPosition, colWidths) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff');
    
    doc.rect(50, yPosition, colWidths[0], 25).fillColor('#34495e').fill();
    doc.text('CODE', 50, yPosition + 8, { width: colWidths[0], align: 'center' });
    
    doc.rect(50 + colWidths[0], yPosition, colWidths[1], 25).fillColor('#34495e').fill();
    doc.text('MODULE NAME', 50 + colWidths[0], yPosition + 8, { width: colWidths[1], align: 'center' });
    
    doc.rect(50 + colWidths[0] + colWidths[1], yPosition, colWidths[2], 25).fillColor('#34495e').fill();
    doc.text('CREDITS', 50 + colWidths[0] + colWidths[1], yPosition + 8, { width: colWidths[2], align: 'center' });
    
    doc.rect(50 + colWidths[0] + colWidths[1] + colWidths[2], yPosition, colWidths[3], 25).fillColor('#34495e').fill();
    doc.text('MARKS', 50 + colWidths[0] + colWidths[1] + colWidths[2], yPosition + 8, { width: colWidths[3], align: 'center' });
    
    doc.rect(50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPosition, colWidths[4], 25).fillColor('#34495e').fill();
    doc.text('GRADE', 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPosition + 8, { width: colWidths[4], align: 'center' });
    
    doc.fillColor('#000000');
}

function addSummarySection(doc, enrollments) {
    const summaryY = doc.y + 20;
    
    // Calculate totals
    let totalCredits = 0;
    let totalPoints = 0;
    
    enrollments.forEach(enrollment => {
        if (enrollment.Mark_Obtained && enrollment.Credit_Hours) {
            totalCredits += enrollment.Credit_Hours;
            totalPoints += enrollment.Credit_Hours * calculateGradePoints(enrollment.Grade);
        }
    });
    
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    
    // Summary box
    doc.rect(50, summaryY, doc.page.width - 100, 40)
       .fillColor('#e8f4f8')
       .fill();
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text('ACADEMIC SUMMARY', 60, summaryY + 10);
    
    doc.font('Helvetica').fillColor('#000000');
    doc.text(`Total Credit Hours: ${totalCredits}`, 300, summaryY + 10);
    doc.text(`Grade Point Average: ${gpa}`, 300, summaryY + 25);
    
    doc.fillColor('#000000');
}

function addAcademicRecordBySemester(doc, enrollments, academicYear) {
    // Group by semester
    const semesters = {};
    enrollments.forEach(enrollment => {
        const semesterKey = `Semester ${enrollment.Semester_Number}`;
        if (!semesters[semesterKey]) {
            semesters[semesterKey] = [];
        }
        semesters[semesterKey].push(enrollment);
    });
    
    Object.keys(semesters).forEach(semesterName => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 200) {
            doc.addPage();
            doc.y = 50;
        }
        
        doc.fontSize(14).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text(semesterName, 50, doc.y);
        
        doc.moveDown(0.5);
        
        // Add semester results table
        addSimpleResultsTable(doc, semesters[semesterName]);
        
        // Add semester summary
        addSemesterSummary(doc, semesters[semesterName]);
        
        doc.moveDown();
    });
}

function addCompleteAcademicHistory(doc, enrollments) {
    // Group by academic year and semester
    const academicHistory = {};
    
    enrollments.forEach(enrollment => {
        const yearKey = `Year ${enrollment.Academic_Year}`;
        const semesterKey = `Semester ${enrollment.Semester_Number}`;
        
        if (!academicHistory[yearKey]) {
            academicHistory[yearKey] = {};
        }
        if (!academicHistory[yearKey][semesterKey]) {
            academicHistory[yearKey][semesterKey] = [];
        }
        
        academicHistory[yearKey][semesterKey].push(enrollment);
    });
    
    // Add each academic year
    Object.keys(academicHistory).sort().forEach(year => {
        if (doc.y > doc.page.height - 150) {
            doc.addPage();
            doc.y = 50;
        }
        
        doc.fontSize(16).font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text(year.toUpperCase(), 50, doc.y);
        
        doc.moveDown(0.5);
        
        // Add each semester
        Object.keys(academicHistory[year]).sort().forEach(semester => {
            doc.fontSize(12).font('Helvetica-Bold')
               .fillColor('#34495e')
               .text(semester, 60, doc.y);
            
            doc.moveDown(0.3);
            
            // Add semester courses
            academicHistory[year][semester].forEach(enrollment => {
                const grade = enrollment.Grade || 'In Progress';
                doc.fontSize(10).font('Helvetica')
                   .text(`  ${enrollment.Module_Code} - ${enrollment.Module_Name}`, 70, doc.y, { continued: true })
                   .text(` (${enrollment.Credit_Hours} cr) - ${enrollment.Mark_Obtained || 'N/A'} - ${grade}`, { align: 'right' });
                
                doc.moveDown(0.2);
            });
            
            doc.moveDown(0.3);
        });
        
        doc.moveDown();
    });
}

function addTranscriptStudentInfo(doc, student) {
    const infoY = 150;
    
    doc.rect(50, infoY, doc.page.width - 100, 100)
       .fillColor('#f0f8ff')
       .fill();
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text('STUDENT PROFILE', 60, infoY + 15);
    
    const col1X = 60;
    const col2X = 300;
    let currentY = infoY + 35;
    
    doc.font('Helvetica').fillColor('#000000');
    doc.text(`Full Name: ${student.Student_Name}`, col1X, currentY);
    doc.text(`Student ID: ${student.Student_ID}`, col2X, currentY);
    
    currentY += 15;
    doc.text(`Programme: ${student.Programme_Code || student.Programme_Name}`, col1X, currentY);
    doc.text(`Faculty: ${student.Faculty_Name}`, col2X, currentY);
    
    currentY += 15;
    // Fix date of birth formatting
    let dobFormatted = 'N/A';
    if (student.Date_of_Birth) {
        try {
            // Handle different date formats including the one from your example
            let dob = student.Date_of_Birth;
            // If it's in the format like "Wed Jun 13 2007 00:00:00 GMT..."
            if (typeof dob === 'string' && dob.includes('GMT')) {
                // Extract the date part and parse it
                const datePart = dob.split('GMT')[0].trim();
                const parsedDate = new Date(datePart);
                if (!isNaN(parsedDate.getTime())) {
                    dobFormatted = parsedDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            } else {
                // Try parsing as regular date
                const parsedDate = new Date(dob);
                if (!isNaN(parsedDate.getTime())) {
                    dobFormatted = parsedDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            }
        } catch (error) {
            console.error('Error parsing date of birth:', error);
            dobFormatted = 'Invalid Date';
        }
    }
    doc.text(`Date of Birth: ${dobFormatted}`, col1X, currentY);
    doc.text(`Year Enrolled: ${student.Year_Enrolled}`, col2X, currentY);
    
    currentY += 15;
    doc.text(`Email: ${student.Email_Address}`, col1X, currentY);
    doc.text(`Status: ${student.Enrollment_Status}`, col2X, currentY);
}

function addTranscriptSummary(doc, enrollments) {
    const summaryY = doc.y + 20;
    
    // Calculate overall statistics
    let totalCredits = 0;
    let totalPoints = 0;
    let completedCourses = 0;
    
    enrollments.forEach(enrollment => {
        if (enrollment.Mark_Obtained && enrollment.Credit_Hours) {
            totalCredits += enrollment.Credit_Hours;
            totalPoints += enrollment.Credit_Hours * calculateGradePoints(enrollment.Grade);
            completedCourses++;
        }
    });
    
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    
    doc.rect(50, summaryY, doc.page.width - 100, 60)
       .fillColor('#e8f4f8')
       .fill();
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text('TRANSCRIPT SUMMARY', 60, summaryY + 15);
    
    doc.font('Helvetica').fillColor('#000000');
    doc.text(`Total Courses Completed: ${completedCourses}`, 60, summaryY + 35);
    doc.text(`Total Credit Hours: ${totalCredits}`, 250, summaryY + 35);
    doc.text(`Cumulative GPA: ${gpa}`, 400, summaryY + 35);
}

function addFooter(doc, isOfficial = false) {
    const footerY = doc.page.height - 50;
    
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    
    if (isOfficial) {
        doc.text('This is an official transcript. Any alteration voids this document.', 50, footerY, { align: 'center' });
        doc.text('Issued by Madibogo University Registrar Office', 50, footerY + 12, { align: 'center' });
    } else {
        doc.text('Generated on: ' + new Date().toLocaleDateString(), 50, footerY, { align: 'center' });
        doc.text('Madibogo University - Student Record System', 50, footerY + 12, { align: 'center' });
    }
    
    // Add page numbers if multiple pages
    const pageCount = doc.bufferedPageRange().count;
    if (pageCount > 1) {
        doc.text(`Page ${doc.page.number} of ${pageCount}`, 50, footerY + 24, { align: 'center' });
    }
}

function addSimpleResultsTable(doc, enrollments) {
    const tableTop = doc.y;
    const colWidths = [80, 250, 60, 60, 60];
    
    // Simple table implementation
    enrollments.forEach((enrollment, index) => {
        const yPos = tableTop + (index * 15);
        
        // Ensure text is visible
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
        doc.text(enrollment.Module_Code, 60, yPos, { width: colWidths[0] });
        doc.text(enrollment.Module_Name, 60 + colWidths[0], yPos, { width: colWidths[1] });
        doc.text(enrollment.Credit_Hours.toString(), 60 + colWidths[0] + colWidths[1], yPos, { width: colWidths[2], align: 'center' });
        
        const marks = enrollment.Mark_Obtained ? enrollment.Mark_Obtained.toString() : 'N/A';
        doc.text(marks, 60 + colWidths[0] + colWidths[1] + colWidths[2], yPos, { width: colWidths[3], align: 'center' });
        
        const grade = enrollment.Grade || 'N/A';
        doc.fillColor(getGradeColor(grade));
        doc.text(grade, 60 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos, { width: colWidths[4], align: 'center' });
        doc.fillColor('#000000');
    });
    
    doc.y = tableTop + (enrollments.length * 15) + 10;
}

function addSemesterSummary(doc, enrollments) {
    let semesterCredits = 0;
    let semesterPoints = 0;
    
    enrollments.forEach(enrollment => {
        if (enrollment.Mark_Obtained && enrollment.Credit_Hours) {
            semesterCredits += enrollment.Credit_Hours;
            semesterPoints += enrollment.Credit_Hours * calculateGradePoints(enrollment.Grade);
        }
    });
    
    const semesterGPA = semesterCredits > 0 ? (semesterPoints / semesterCredits).toFixed(2) : '0.00';
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Semester GPA: ${semesterGPA}`, { align: 'right' });
}

// Utility functions
function calculateGradePoints(grade) {
    if (!grade) return 0;
    switch(grade.toUpperCase()) {
        case 'A': return 4.0;
        case 'B': return 3.0;
        case 'C': return 2.0;
        case 'D': return 1.0;
        default: return 0.0;
    }
}

function getGradeColor(grade) {
    if (!grade) return '#666666';
    switch(grade.toUpperCase()) {
        case 'A': return '#27ae60'; // Green
        case 'B': return '#2980b9'; // Blue
        case 'C': return '#f39c12'; // Orange
        case 'D': return '#e74c3c'; // Red
        default: return '#666666';  // Gray
    }
}

module.exports = router;