const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const moduleRoutes = require('./routes/modules');
const enrolmentRoutes = require('./routes/enrollments');
const reportRoutes = require('./routes/reports');
const programmeRoutes = require('./routes/programmes'); // Add this line

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/enrollments', enrolmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/programmes', programmeRoutes); // Add this line

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/student-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/student-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-dashboard.html'));
});

app.get('/api/debug/programmes', (req, res) => {
    const db = require('./config/database');
    
    db.query('SELECT * FROM Programmes', (err, results) => {
        if (err) {
            return res.json({ error: err.message });
        }
        res.json({ programmes: results });
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});