// Admin Dashboard JavaScript - Complete Fix
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin dashboard loaded');
    initializeAdminDashboard();
});

async function initializeAdminDashboard() {
    console.log('🔄 Initializing admin dashboard...');
    
    // Check authentication but don't redirect immediately
    const authCheck = await checkAdminAuth();
    if (authCheck.isAuthenticated) {
        console.log('✅ Authentication successful, setting up dashboard...');
        setupEventListeners();
        // Wait a bit for DOM to be fully ready
        setTimeout(() => {
            loadInitialData();
        }, 100);
    } else {
        console.log('❌ Authentication failed:', authCheck.reason);
        // Show error message instead of immediate redirect
        showAuthError(authCheck.reason);
    }
}

async function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem('user');
    
    console.log('🔐 Admin auth check:', { 
        hasToken: !!token, 
        userType: userType, 
        hasUserData: !!userData 
    });
    
    // Basic checks
    if (!token) {
        return { isAuthenticated: false, reason: 'No authentication token found' };
    }
    
    if (!userType || userType !== 'admin') {
        return { isAuthenticated: false, reason: 'Not logged in as admin' };
    }
    
    if (!userData) {
        return { isAuthenticated: false, reason: 'No user data found' };
    }
    
    try {
        // Verify token with server
        const response = await fetch('http://localhost:3000/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Token verification failed');
        }
        
        const data = await response.json();
        
        if (!data.valid) {
            return { isAuthenticated: false, reason: 'Token is invalid' };
        }
        
        console.log('✅ Admin authentication successful');
        const user = JSON.parse(userData);
        
        // Update UI
        if (document.querySelector('nav span')) {
            document.querySelector('nav span').textContent = `Welcome, ${user.name}`;
        }
        
        return { isAuthenticated: true, user: user };
        
    } catch (error) {
        console.error('Auth check error:', error);
        return { isAuthenticated: false, reason: 'Authentication check failed: ' + error.message };
    }
}

function showAuthError(reason) {
    console.error('Authentication error:', reason);
    
    // Show user-friendly error message
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-container" style="text-align: center; padding: 2rem;">
                <h2>Authentication Required</h2>
                <p>You need to be logged in as an administrator to access this page.</p>
                <p><small>Error: ${reason}</small></p>
                <div style="margin-top: 2rem;">
                    <button onclick="redirectToLogin()" class="btn btn-primary">Login as Admin</button>
                    <button onclick="goHome()" class="btn btn-secondary">Go Home</button>
                </div>
            </div>
        `;
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function setupEventListeners() {
    // Tab navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
            
            // Load data for active tab
            const activeTab = this.getAttribute('data-tab');
            if (activeTab === 'students') {
                loadStudents();
            } else if (activeTab === 'modules') {
                loadModules();
            } else if (activeTab === 'enrollments') {
                loadEnrollments();
            } else if (activeTab === 'marks') {
                loadMarks();
            } else if (activeTab === 'reports') {
                loadReportsData();
            }
        });
    });
    
    // Student management
    document.getElementById('add-student-btn').addEventListener('click', showStudentForm);
    document.getElementById('cancel-student-btn').addEventListener('click', hideStudentForm);
    document.getElementById('student-form').addEventListener('submit', handleStudentSubmit);
    
    // Module management
    document.getElementById('add-module-btn').addEventListener('click', showModuleForm);
    document.getElementById('cancel-module-btn').addEventListener('click', hideModuleForm);
    document.getElementById('module-form').addEventListener('submit', handleModuleSubmit);
    
    // Enrollment management
    document.getElementById('add-enrollment-btn').addEventListener('click', showEnrollmentForm);
    document.getElementById('cancel-enrollment-btn').addEventListener('click', hideEnrollmentForm);
    document.getElementById('enrollment-form').addEventListener('submit', handleEnrollmentSubmit);
    
    // Marks management
    document.getElementById('add-mark-btn').addEventListener('click', showMarkForm);
    document.getElementById('cancel-mark-btn').addEventListener('click', hideMarkForm);
    document.getElementById('mark-form').addEventListener('submit', handleMarkSubmit);
    
    // Report generation
    document.getElementById('semester-report-btn').addEventListener('click', generateSemesterReport);
    document.getElementById('academic-record-btn').addEventListener('click', generateAcademicRecord);
    document.getElementById('transcript-btn').addEventListener('click', generateTranscript);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
}

async function loadInitialData() {
    await loadStudents();
    await loadModules();
    await loadProgrammes();
    await populateDropdowns();
}

// Student Management
let currentEditingStudentId = null;

function showStudentForm() {
    document.getElementById('add-student-form').style.display = 'block';
    currentEditingStudentId = null;
    document.getElementById('student-form').reset();
    document.querySelector('#add-student-form h4').textContent = 'Add New Student';
}

function hideStudentForm() {
    document.getElementById('add-student-form').style.display = 'none';
    document.getElementById('student-form').reset();
    currentEditingStudentId = null;
}

async function handleStudentSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const studentData = {
        studentName: formData.get('name'),
        dateOfBirth: formData.get('dateOfBirth'),
        emailAddress: formData.get('email'),
        contactNumber: formData.get('contactNumber'),
        programmeCode: formData.get('programme'),
        yearEnrolled: formData.get('yearEnrolled'),
        password: formData.get('password')
    };
    
    try {
        const url = currentEditingStudentId 
            ? `http://localhost:3000/api/students/${currentEditingStudentId}`
            : 'http://localhost:3000/api/students';
        
        const method = currentEditingStudentId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(studentData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(currentEditingStudentId ? 'Student updated successfully!' : 'Student added successfully!');
            hideStudentForm();
            loadStudents();
        } else {
            alert('Error: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function editStudent(studentId) {
    try {
        const response = await fetch(`http://localhost:3000/api/students/${studentId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const student = await response.json();
            showEditStudentForm(studentId, student);
        } else {
            alert('Error loading student data');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function showEditStudentForm(studentId, studentData) {
    document.getElementById('add-student-form').style.display = 'block';
    currentEditingStudentId = studentId;
    
    document.getElementById('student-name').value = studentData.Student_Name;
    document.getElementById('student-dob').value = studentData.Date_of_Birth;
    document.getElementById('student-email').value = studentData.Email_Address;
    document.getElementById('student-contact').value = studentData.Contact_Number || '';
    document.getElementById('student-programme').value = studentData.Programme_Code;
    document.getElementById('student-year').value = studentData.Year_Enrolled;
    document.getElementById('student-password').value = ''; // Don't show password
    
    document.querySelector('#add-student-form h4').textContent = 'Edit Student';
}

async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/students/${studentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Student deleted successfully!');
            loadStudents();
        } else {
            alert('Error: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadStudents() {
    try {
        const response = await fetch('http://localhost:3000/api/students', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const students = await response.json();
            displayStudents(students);
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function displayStudents(students) {
    const container = document.getElementById('students-list');
    
    if (!students || students.length === 0) {
        container.innerHTML = '<p>No students found.</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Programme</th>
                    <th>Faculty</th>
                    <th>Year Enrolled</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    students.forEach(student => {
        html += `
            <tr>
                <td>${student.Student_ID}</td>
                <td>${student.Student_Name}</td>
                <td>${student.Email_Address}</td>
                <td>${student.Programme_Name || 'N/A'}</td>
                <td>${student.Faculty_Name || 'N/A'}</td>
                <td>${student.Year_Enrolled}</td>
                <td>${student.Enrollment_Status}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editStudent(${student.Student_ID})">Edit</button>
                    <button class="btn btn-secondary" onclick="deleteStudent(${student.Student_ID})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Module Management
async function loadModules() {
    try {
        const response = await fetch('http://localhost:3000/api/modules', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const modules = await response.json();
            displayModules(modules);
        }
    } catch (error) {
        console.error('Error loading modules:', error);
    }
}

function displayModules(modules) {
    const container = document.getElementById('modules-list');
    
    if (!modules || modules.length === 0) {
        container.innerHTML = '<p>No modules found.</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Module Code</th>
                    <th>Module Name</th>
                    <th>Description</th>
                    <th>Credit Hours</th>
                    <th>Year Level</th>
                    <th>Semester</th>
                    <th>Programme</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    modules.forEach(module => {
        html += `
            <tr>
                <td>${module.Module_Code}</td>
                <td>${module.Module_Name}</td>
                <td>${module.Module_Description || 'N/A'}</td>
                <td>${module.Credit_Hours}</td>
                <td>${module.Year_Level}</td>
                <td>${module.Semester_Offered || 'N/A'}</td>
                <td>${module.Programme_Name || 'N/A'}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

async function handleModuleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const moduleData = {
        moduleCode: formData.get('moduleCode'),
        moduleName: formData.get('moduleName'),
        moduleDescription: formData.get('description'),
        creditHours: parseInt(formData.get('creditHours')),
        yearLevel: parseInt(formData.get('yearLevel')),
        semesterOffered: formData.get('semester') ? parseInt(formData.get('semester')) : null,
        programmeCode: formData.get('programme')
    };
    
    try {
        const response = await fetch('http://localhost:3000/api/modules', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(moduleData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Module added successfully!');
            hideModuleForm();
            loadModules();
        } else {
            alert('Error: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function showModuleForm() {
    document.getElementById('add-module-form').style.display = 'block';
    document.getElementById('module-form').reset();
}

function hideModuleForm() {
    document.getElementById('add-module-form').style.display = 'none';
}

// Enrollment Management
async function loadEnrollments() {
    try {
        const response = await fetch('http://localhost:3000/api/enrollments', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const enrollments = await response.json();
            displayEnrollments(enrollments);
        }
    } catch (error) {
        console.error('Error loading enrollments:', error);
    }
}

function displayEnrollments(enrollments) {
    const container = document.getElementById('enrollments-list');
    
    if (!enrollments || enrollments.length === 0) {
        container.innerHTML = '<p>No enrollments found.</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Enrollment ID</th>
                    <th>Student</th>
                    <th>Module</th>
                    <th>Semester</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    enrollments.forEach(enrollment => {
        html += `
            <tr>
                <td>${enrollment.Enrollment_ID}</td>
                <td>${enrollment.Student_Name} (${enrollment.Student_ID})</td>
                <td>${enrollment.Module_Name} (${enrollment.Module_Code})</td>
                <td>Year ${enrollment.Academic_Year} - Sem ${enrollment.Semester_Number}</td>
                <td>${enrollment.Mark_Obtained || 'Not entered'}</td>
                <td>${enrollment.Grade || '-'}</td>
                <td>${enrollment.Status}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

async function handleEnrollmentSubmit(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('enrollment-student').value;
    const moduleCode = document.getElementById('enrollment-module').value;
    const semesterCode = document.getElementById('enrollment-semester').value;
    
    if (!studentId || !moduleCode || !semesterCode) {
        alert('Please select student, module, and semester');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/enrollments', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ studentId, moduleCode, semesterCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Enrollment added successfully!');
            hideEnrollmentForm();
            loadEnrollments();
        } else {
            alert('Error: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function showEnrollmentForm() {
    document.getElementById('add-enrollment-form').style.display = 'block';
    document.getElementById('enrollment-form').reset();
}

function hideEnrollmentForm() {
    document.getElementById('add-enrollment-form').style.display = 'none';
}

// Marks Management
async function loadMarks() {
    try {
        const response = await fetch('http://localhost:3000/api/enrollments', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const enrollments = await response.json();
            displayMarks(enrollments);
        }
    } catch (error) {
        console.error('Error loading marks:', error);
    }
}

function displayMarks(enrollments) {
    const container = document.getElementById('marks-list');
    
    if (!enrollments || enrollments.length === 0) {
        container.innerHTML = '<p>No marks found.</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Module</th>
                    <th>Semester</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    enrollments.forEach(enrollment => {
        html += `
            <tr>
                <td>${enrollment.Student_Name}</td>
                <td>${enrollment.Module_Name}</td>
                <td>Year ${enrollment.Academic_Year} - Sem ${enrollment.Semester_Number}</td>
                <td>${enrollment.Mark_Obtained || 'Not entered'}</td>
                <td>${enrollment.Grade || '-'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="editMarks(${enrollment.Enrollment_ID})">Edit Marks</button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

async function handleMarkSubmit(e) {
    e.preventDefault();
    
    const enrollmentId = document.getElementById('mark-enrollment').value;
    const markObtained = document.getElementById('mark-value').value;
    
    if (!enrollmentId || !markObtained) {
        alert('Please select enrollment and enter marks');
        return;
    }
    
    const marks = parseFloat(markObtained);
    if (isNaN(marks) || marks < 0 || marks > 100) {
        alert('Please enter valid marks between 0 and 100');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/enrollments/marks', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                enrollmentId: parseInt(enrollmentId), 
                markObtained: marks 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Marks saved successfully!');
            hideMarkForm();
            loadEnrollments();
            loadMarks();
        } else {
            alert('Error: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function editMarks(enrollmentId) {
    const markObtained = prompt('Enter marks (0-100):');
    if (markObtained === null) return;
    
    const marks = parseFloat(markObtained);
    if (isNaN(marks) || marks < 0 || marks > 100) {
        alert('Please enter valid marks between 0 and 100');
        return;
    }
    
    fetch('http://localhost:3000/api/enrollments/marks', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enrollmentId, markObtained: marks })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Marks updated successfully');
            loadEnrollments();
            loadMarks();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        alert('Error: ' + error.message);
    });
}

function showMarkForm() {
    document.getElementById('add-mark-form').style.display = 'block';
    document.getElementById('mark-form').reset();
    populateEnrollmentDropdown();
}

function hideMarkForm() {
    document.getElementById('add-mark-form').style.display = 'none';
}

async function populateEnrollmentDropdown() {
    try {
        const response = await fetch('http://localhost:3000/api/enrollments', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const enrollments = await response.json();
            const dropdown = document.getElementById('mark-enrollment');
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Select Enrollment</option>';
                enrollments.forEach(enrollment => {
                    const displayText = `${enrollment.Student_Name} - ${enrollment.Module_Name} (${enrollment.Semester_Code})`;
                    dropdown.innerHTML += `<option value="${enrollment.Enrollment_ID}">${displayText}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error populating enrollment dropdown:', error);
    }
}

// Report Generation
async function loadReportsData() {
    await populateReportsDropdowns();
}

async function populateReportsDropdowns() {
    try {
        const [studentsResponse, semestersResponse] = await Promise.all([
            fetch('http://localhost:3000/api/students', { headers: getAuthHeaders() }),
            fetch('http://localhost:3000/api/enrollments/semesters', { headers: getAuthHeaders() })
        ]);
        
        if (studentsResponse.ok) {
            const students = await studentsResponse.json();
            const dropdown = document.getElementById('report-student');
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Select Student</option>';
                students.forEach(student => {
                    const displayText = `${student.Student_Name} (${student.Student_ID}) - ${student.Programme_Name}`;
                    dropdown.innerHTML += `<option value="${student.Student_ID}">${displayText}</option>`;
                });
            }
        }
        
        if (semestersResponse.ok) {
            const semesters = await semestersResponse.json();
            const dropdown = document.getElementById('report-semester');
            if (dropdown) {
                dropdown.innerHTML = '<option value="">Select Semester</option>';
                semesters.forEach(semester => {
                    const displayText = `Year ${semester.Academic_Year} - Semester ${semester.Semester_Number}`;
                    dropdown.innerHTML += `<option value="${semester.Semester_Code}">${displayText}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error populating reports dropdowns:', error);
    }
}

// Report Generation - Fixed PDF download
async function generateSemesterReport() {
    const studentId = document.getElementById('report-student').value;
    const semesterCode = document.getElementById('report-semester').value;
    
    if (!studentId || !semesterCode) {
        alert('Please select both student and semester');
        return;
    }
    
    console.log('Generating semester report for:', studentId, semesterCode);
    
    // Create a hidden iframe to handle the PDF download
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `http://localhost:3000/api/reports/semester/${studentId}/${semesterCode}`;
    document.body.appendChild(iframe);
    
    // Remove the iframe after a delay
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 5000);
}

async function generateAcademicRecord() {
    const studentId = document.getElementById('report-student').value;
    const academicYear = document.getElementById('report-year').value;
    
    if (!studentId || !academicYear) {
        alert('Please select student and academic year');
        return;
    }
    
    console.log('Generating academic record for:', studentId, academicYear);
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `http://localhost:3000/api/reports/academic/${studentId}/${academicYear}`;
    document.body.appendChild(iframe);
    
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 5000);
}

async function generateTranscript() {
    const studentId = document.getElementById('report-student').value;
    
    if (!studentId) {
        alert('Please select a student');
        return;
    }
    
    console.log('Generating transcript for:', studentId);
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `http://localhost:3000/api/reports/transcript/${studentId}`;
    document.body.appendChild(iframe);
    
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 5000);
}

// Dropdown Population
async function populateDropdowns() {
    try {
        const [studentsResponse, modulesResponse, programmesResponse, semestersResponse] = await Promise.all([
            fetch('http://localhost:3000/api/students', { headers: getAuthHeaders() }),
            fetch('http://localhost:3000/api/modules', { headers: getAuthHeaders() }),
            fetch('http://localhost:3000/api/students/programmes/list', { headers: getAuthHeaders() }), // Fixed endpoint
            fetch('http://localhost:3000/api/enrollments/semesters', { headers: getAuthHeaders() })
        ]);
        
        console.log('Dropdown responses:', {
            students: studentsResponse.ok,
            modules: modulesResponse.ok,
            programmes: programmesResponse.ok,
            semesters: semestersResponse.ok
        });
        
        if (studentsResponse.ok) {
            const students = await studentsResponse.json();
            console.log('Students loaded:', students.length);
            populateStudentDropdowns(students);
        } else {
            console.error('Failed to load students:', studentsResponse.status);
        }
        
        if (modulesResponse.ok) {
            const modules = await modulesResponse.json();
            console.log('Modules loaded:', modules.length);
            populateModuleDropdowns(modules);
        } else {
            console.error('Failed to load modules:', modulesResponse.status);
        }
        
        if (programmesResponse.ok) {
            const programmes = await programmesResponse.json();
            console.log('Programmes loaded:', programmes.length);
            populateProgrammeDropdowns(programmes);
        } else {
            console.error('Failed to load programmes:', programmesResponse.status);
        }
        
        if (semestersResponse.ok) {
            const semesters = await semestersResponse.json();
            console.log('Semesters loaded:', semesters.length);
            populateSemesterDropdowns(semesters);
        } else {
            console.error('Failed to load semesters:', semestersResponse.status);
        }
        
    } catch (error) {
        console.error('Error populating dropdowns:', error);
    }
}

async function loadProgrammes() {
    console.log('🔄 Loading programmes...');
    
    const studentDropdown = document.getElementById('student-programme');
    const moduleDropdown = document.getElementById('module-programme');
    
    if (!studentDropdown || !moduleDropdown) {
        console.error('❌ Programme dropdowns not found!');
        return;
    }
    
    try {
        // Try multiple endpoints
        const endpoints = [
            'http://localhost:3000/api/programmes',
            'http://localhost:3000/api/programmes/test',
            'http://localhost:3000/api/debug/programmes'
        ];
        
        let programmesData = null;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`🔗 Trying endpoint: ${endpoint}`);
                const response = await fetch(endpoint);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Success with endpoint: ${endpoint}`);
                    
                    // Handle different response formats
                    if (Array.isArray(data)) {
                        programmesData = data;
                    } else if (data.programmes) {
                        programmesData = data.programmes;
                    } else if (data.testData) {
                        programmesData = data.testData;
                    } else {
                        programmesData = data;
                    }
                    break;
                }
            } catch (error) {
                console.log(`❌ Endpoint failed: ${endpoint}`, error.message);
            }
        }
        
        if (!programmesData) {
            console.log('⚠️ No data from API, using default programmes');
            programmesData = getDefaultProgrammes();
        }
        
        // Ensure programmesData is an array
        if (!Array.isArray(programmesData)) {
            programmesData = [programmesData];
        }
        
        console.log(`📊 Populating dropdowns with ${programmesData.length} programmes`);
        populateProgrammeDropdowns(programmesData);
        
    } catch (error) {
        console.error('❌ Error loading programmes:', error);
        const defaultProgrammes = getDefaultProgrammes();
        populateProgrammeDropdowns(defaultProgrammes);
    }
}

function getDefaultProgrammes() {
    return [
        { Programme_Code: 'CS001', Programme_Name: 'BSc Computer Science', Faculty_Name: 'Faculty of Computer Science' },
        { Programme_Code: 'CS002', Programme_Name: 'BSc Software Engineering', Faculty_Name: 'Faculty of Computer Science' },
        { Programme_Code: 'EN001', Programme_Name: 'BEng Civil Engineering', Faculty_Name: 'Faculty of Engineering' },
        { Programme_Code: 'BS001', Programme_Name: 'BBA Business Administration', Faculty_Name: 'Faculty of Business Studies' }
    ];
}

function populateStudentDropdowns(students) {
    const dropdowns = ['enrollment-student', 'mark-student', 'report-student'];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Select Student</option>';
            students.forEach(student => {
                const displayText = `${student.Student_Name} (${student.Student_ID}) - ${student.Programme_Name}`;
                dropdown.innerHTML += `<option value="${student.Student_ID}">${displayText}</option>`;
            });
        }
    });
}

function populateModuleDropdowns(modules) {
    const dropdowns = ['enrollment-module', 'mark-module'];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Select Module</option>';
            modules.forEach(module => {
                const displayText = `${module.Module_Name} (${module.Module_Code}) - Year ${module.Year_Level}`;
                dropdown.innerHTML += `<option value="${module.Module_Code}">${displayText}</option>`;
            });
        }
    });
}

function populateProgrammeDropdowns(programmes) {
    console.log('Populating programme dropdowns with:', programmes);
    
    // For student form
    const studentProgrammeDropdown = document.getElementById('student-programme');
    if (studentProgrammeDropdown) {
        studentProgrammeDropdown.innerHTML = '<option value="">Select Programme</option>';
        programmes.forEach(programme => {
            const displayText = `${programme.Programme_Name} (${programme.Faculty_Name})`;
            studentProgrammeDropdown.innerHTML += `<option value="${programme.Programme_Code}">${displayText}</option>`;
        });
        console.log('Student programme dropdown populated with options:', studentProgrammeDropdown.children.length);
    }
    
    // For module form
    const moduleProgrammeDropdown = document.getElementById('module-programme');
    if (moduleProgrammeDropdown) {
        moduleProgrammeDropdown.innerHTML = '<option value="">Select Programme</option>';
        programmes.forEach(programme => {
            const displayText = `${programme.Programme_Name} (${programme.Faculty_Name})`;
            moduleProgrammeDropdown.innerHTML += `<option value="${programme.Programme_Code}">${displayText}</option>`;
        });
        console.log('Module programme dropdown populated with options:', moduleProgrammeDropdown.children.length);
    }
}

function populateSemesterDropdowns(semesters) {
    const dropdowns = ['enrollment-semester', 'mark-semester', 'report-semester'];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Select Semester</option>';
            semesters.forEach(semester => {
                const displayText = `Year ${semester.Academic_Year} - Semester ${semester.Semester_Number}`;
                dropdown.innerHTML += `<option value="${semester.Semester_Code}">${displayText}</option>`;
            });
        }
    });
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}
