document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 Student dashboard loaded');
    initializeStudentDashboard();
});

async function initializeStudentDashboard() {
    console.log('🔄 Initializing student dashboard...');
    
    // Check authentication
    const authCheck = await checkStudentAuth();
    if (authCheck.isAuthenticated) {
        console.log('✅ Authentication successful, setting up dashboard...');
        setupEventListeners();
        loadStudentData();
    } else {
        console.log('❌ Authentication failed:', authCheck.reason);
        window.location.href = 'login.html?type=student';
    }
}

async function checkStudentAuth() {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem('user');
    
    console.log('🔐 Student auth check:', { 
        hasToken: !!token, 
        userType: userType, 
        hasUserData: !!userData 
    });
    
    // Basic checks
    if (!token) {
        return { isAuthenticated: false, reason: 'No authentication token found' };
    }
    
    if (!userType || userType !== 'student') {
        return { isAuthenticated: false, reason: 'Not logged in as student' };
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
        
        console.log('✅ Student authentication successful');
        const user = JSON.parse(userData);
        
        // Update UI
        if (document.getElementById('student-name')) {
            document.getElementById('student-name').textContent = `Welcome, ${user.name}`;
        }
        
        return { isAuthenticated: true, user: user };
        
    } catch (error) {
        console.error('Auth check error:', error);
        return { isAuthenticated: false, reason: 'Authentication check failed: ' + error.message };
    }
}
function showAuthError(reason) {
    console.error('Authentication error:', reason);
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-container" style="text-align: center; padding: 2rem;">
                <h2>Authentication Required</h2>
                <p>You need to be logged in as a student to access this page.</p>
                <p><small>Error: ${reason}</small></p>
                <div style="margin-top: 2rem;">
                    <button onclick="redirectToStudentLogin()" class="btn btn-primary">Login as Student</button>
                    <button onclick="goHome()" class="btn btn-secondary">Go Home</button>
                </div>
            </div>
        `;
    }
}

function redirectToStudentLogin() {
    window.location.href = 'login.html?type=student';
}

function goHome() {
    window.location.href = 'index.html';
}
function setupEventListeners() {
    // Tab navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
            
            // Load content for the tab
            if (this.getAttribute('data-tab') === 'modules') {
                loadStudentModules();
            } else if (this.getAttribute('data-tab') === 'marks') {
                loadStudentMarks();
            }
        });
    });
    
    // Report buttons
    document.getElementById('semester-report-btn').addEventListener('click', generateSemesterReport);
    document.getElementById('academic-record-btn').addEventListener('click', generateAcademicRecord);
    document.getElementById('transcript-btn').addEventListener('click', generateTranscript);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
}

async function loadStudentData() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        console.log('Loading student data for ID:', user.id);
        const response = await fetch(`http://localhost:3000/api/students/${user.id}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.ok) {
            const student = await response.json();
            console.log('Student data loaded:', student);
            
            // Update student info in the dashboard
            document.getElementById('student-name').textContent = `Welcome, ${student.Student_Name}`;
            document.getElementById('student-id').textContent = student.Student_ID;
            document.getElementById('student-programme').textContent = student.Programme_Name || student.Programme_Code;
            document.getElementById('student-year').textContent = student.Year_Enrolled;
            
            // Load initial tab content
            loadStudentModules();
        } else {
            console.error('Failed to load student data, status:', response.status);
            document.getElementById('student-name').textContent = 'Welcome, Student';
        }
    } catch (error) {
        console.error('Error loading student data:', error);
        document.getElementById('student-name').textContent = 'Welcome, Student';
    }
}

async function loadStudentModules() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        console.log('Loading modules for student ID:', user.id);
        const response = await fetch(`http://localhost:3000/api/enrollments/student/${user.id}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        console.log('Modules response status:', response.status);
        
        if (response.ok) {
            const enrollments = await response.json();
            console.log('Enrollments data:', enrollments);
            displayModules(enrollments);
        } else {
            console.error('Failed to load student modules, status:', response.status);
            document.getElementById('modules-list').innerHTML = `
                <div class="error-message">
                    <p>Error loading modules. Status: ${response.status}</p>
                    <button onclick="loadStudentModules()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading student modules:', error);
        document.getElementById('modules-list').innerHTML = `
            <div class="error-message">
                <p>Error loading modules: ${error.message}</p>
                <button onclick="loadStudentModules()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }
}

function displayModules(enrollments) {
    const container = document.getElementById('modules-list');
    
    if (!enrollments || enrollments.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <p>No modules enrolled yet.</p>
                <p>Please contact administration to enroll in modules.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="modules-table">
                <thead>
                    <tr>
                        <th>Module Code</th>
                        <th>Module Name</th>
                        <th>Credit Hours</th>
                        <th>Semester</th>
                        <th>Academic Year</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    enrollments.forEach(enrollment => {
        const marks = enrollment.Mark_Obtained !== null ? enrollment.Mark_Obtained : 'Not graded';
        const grade = calculateGrade(enrollment.Mark_Obtained);
        const status = enrollment.Status || 'Enrolled';
        
        html += `
            <tr>
                <td>${enrollment.Module_Code || 'N/A'}</td>
                <td>${enrollment.Module_Name || 'N/A'}</td>
                <td>${enrollment.Credit_Hours || 'N/A'}</td>
                <td>${enrollment.Semester_Number || 'N/A'}</td>
                <td>${enrollment.Academic_Year || 'N/A'}</td>
                <td class="${marks !== 'Not graded' ? 'marks-value' : ''}">${marks}</td>
                <td class="grade-${grade.toLowerCase()}">${grade}</td>
                <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

async function loadStudentMarks() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        console.log('Loading marks for student ID:', user.id);
        
        // Use the same endpoint as modules but filter for graded ones
        const response = await fetch(`http://localhost:3000/api/enrollments/student/${user.id}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.ok) {
            const enrollments = await response.json();
            // Filter only enrollments with marks
            const gradedEnrollments = enrollments.filter(e => e.Mark_Obtained !== null);
            console.log('Graded enrollments:', gradedEnrollments);
            displayMarks(gradedEnrollments);
        } else {
            console.error('Failed to load student marks, status:', response.status);
            document.getElementById('marks-list').innerHTML = `
                <div class="error-message">
                    <p>Error loading marks. Status: ${response.status}</p>
                    <button onclick="loadStudentMarks()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading student marks:', error);
        document.getElementById('marks-list').innerHTML = `
            <div class="error-message">
                <p>Error loading marks: ${error.message}</p>
                <button onclick="loadStudentMarks()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }
}

function displayMarks(enrollments) {
    const container = document.getElementById('marks-list');
    
    if (!enrollments || enrollments.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <p>No marks available yet.</p>
                <p>Marks will appear here once they are entered by your instructors.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="marks-table">
                <thead>
                    <tr>
                        <th>Module Code</th>
                        <th>Module Name</th>
                        <th>Semester</th>
                        <th>Academic Year</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    enrollments.forEach(enrollment => {
        const grade = calculateGrade(enrollment.Mark_Obtained);
        const status = enrollment.Status || 'Completed';
        
        html += `
            <tr>
                <td>${enrollment.Module_Code || 'N/A'}</td>
                <td>${enrollment.Module_Name || 'N/A'}</td>
                <td>${enrollment.Semester_Number || 'N/A'}</td>
                <td>${enrollment.Academic_Year || 'N/A'}</td>
                <td class="marks-value">${enrollment.Mark_Obtained}</td>
                <td class="grade-${grade.toLowerCase()}">${grade}</td>
                <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function calculateGrade(marks) {
    if (marks === null || marks === undefined) return 'N/A';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    return 'F';
}

async function generateSemesterReport() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        console.log('Generating semester report for student:', user.id);
        
        // Get current semester based on current date
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentSemester = now.getMonth() >= 7 ? 1 : 2; // Semester 1: Sep-Dec, Semester 2: Jan-May
        const semesterCode = `S${currentYear}${currentSemester}`;
        
        const response = await fetch(`http://localhost:3000/api/reports/semester/${user.id}/${semesterCode}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.ok) {
            // Handle PDF response
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `semester-result-${user.id}-${semesterCode}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            // Show success message
            showReportMessage('Semester report generated successfully!', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Error generating semester report:', error);
        showReportMessage(`Error generating semester report: ${error.message}`, 'error');
    }
}

async function generateAcademicRecord() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        console.log('Generating academic record for student:', user.id);
        
        const currentYear = new Date().getFullYear();
        const response = await fetch(`http://localhost:3000/api/reports/academic/${user.id}/${currentYear}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `academic-record-${user.id}-${currentYear}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            showReportMessage('Academic record generated successfully!', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Error generating academic record:', error);
        showReportMessage(`Error generating academic record: ${error.message}`, 'error');
    }
}

async function generateTranscript() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        console.log('Generating transcript for student:', user.id);
        
        const response = await fetch(`http://localhost:3000/api/reports/transcript/${user.id}`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `transcript-${user.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            showReportMessage('Transcript generated successfully!', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Error generating transcript:', error);
        showReportMessage(`Error generating transcript: ${error.message}`, 'error');
    }
}

function showReportMessage(message, type) {
    const reportResult = document.getElementById('report-result');
    const messageClass = type === 'success' ? 'success-message' : 'error-message';
    
    reportResult.innerHTML = `
        <div class="${messageClass}">
            <p>${message}</p>
        </div>
    `;
    
    // Clear message after 5 seconds
    setTimeout(() => {
        reportResult.innerHTML = '';
    }, 5000);
}

function logout() {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Make retry functions globally available
window.loadStudentModules = loadStudentModules;
window.loadStudentMarks = loadStudentMarks;
