// Registration System - DEBUGGED VERSION
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Registration system initialized');
    
    initializeRegistration();
});

function initializeRegistration() {
    console.log('🔄 Initializing registration form...');
    
    // Load programmes for student registration
    loadProgrammes();
    loadFaculties();
    // Setup event listeners
    setupRegistrationEvents();
}
async function loadFaculties() {
    try {
        console.log('🔄 Loading faculties for admin registration...');
        const response = await fetch('http://localhost:3000/api/programmes/faculties');
        
        if (response.ok) {
            const faculties = await response.json();
            console.log('✅ Faculties from API:', faculties);
            populateFacultyDropdown(faculties);
        } else {
            // Fallback to hardcoded based on your database data
            console.log('🔄 Using fallback faculties...');
            const fallbackFaculties = [
                { Faculty_Code: 'FBS', Faculty_Name: 'Faculty of Business Studies' },
                { Faculty_Code: 'FCS', Faculty_Name: 'Faculty of Computer Science' },
                { Faculty_Code: 'FEN', Faculty_Name: 'Faculty of Engineering' }
            ];
            populateFacultyDropdown(fallbackFaculties);
        }
    } catch (error) {
        console.error('❌ Error loading faculties, using fallback:', error);
        const fallbackFaculties = [
            { Faculty_Code: 'FBS', Faculty_Name: 'Faculty of Business Studies' },
            { Faculty_Code: 'FCS', Faculty_Name: 'Faculty of Computer Science' },
            { Faculty_Code: 'FEN', Faculty_Name: 'Faculty of Engineering' }
        ];
        populateFacultyDropdown(fallbackFaculties);
    }
}

function populateFacultyDropdown(faculties) {
    const dropdown = document.getElementById('admin-faculty');
    if (dropdown) {
        console.log('📝 Populating faculty dropdown with', faculties.length, 'options');
        console.log('🔍 Faculty data for dropdown:', faculties);
        
        dropdown.innerHTML = '<option value="">Select Faculty</option>';
        
        faculties.forEach(faculty => {
            // Handle various data structures
            const facultyCode = faculty.Faculty_Code || faculty.faculty_code || faculty.code || faculty.FacultyCode || faculty.Faculty_Code;
            const facultyName = faculty.Faculty_Name || faculty.faculty_name || faculty.name || faculty.FacultyName || faculty.Faculty_Name || 'Unknown Faculty';
            
            console.log(`📋 Processing faculty: ${facultyName} (${facultyCode})`);
            
            // Use code as value, or name if no code
            const value = facultyCode || facultyName;
            const displayText = facultyCode ? 
                `${facultyName} (${facultyCode})` : 
                facultyName;
                
            dropdown.innerHTML += `<option value="${value}">${displayText}</option>`;
        });
        
        console.log('✅ Faculty dropdown populated');
    } else {
        console.error('❌ Faculty dropdown not found!');
    }
}

function populateFacultyDropdown(faculties) {
    const dropdown = document.getElementById('admin-faculty');
    if (!dropdown) {
        console.error('❌ Faculty dropdown not found!');
        return;
    }
    
    console.log('📝 Populating faculty dropdown with:', faculties);
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Faculty';
    dropdown.appendChild(defaultOption);
    
    // Check if faculties is an array and has data
    if (!Array.isArray(faculties) || faculties.length === 0) {
        console.error('❌ No faculties data available');
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'No faculties available';
        dropdown.appendChild(errorOption);
        return;
    }
    
    // Add faculty options
    faculties.forEach(faculty => {
        const option = document.createElement('option');
        
        // Use the exact field names from your database
        const facultyCode = faculty.Faculty_Code;
        const facultyName = faculty.Faculty_Name;
        
        if (facultyCode && facultyName) {
            option.value = facultyCode;
            option.textContent = `${facultyName} (${facultyCode})`;
            dropdown.appendChild(option);
        }
    });
    
    console.log('✅ Faculty dropdown populated with', dropdown.options.length, 'options');
}
function setupRegistrationEvents() {
    console.log('🔧 Setting up registration events...');
    
    // Account type selection
    const typeBtns = document.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Account type changed to:', this.getAttribute('data-type'));
            typeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const accountType = this.getAttribute('data-type');
            showAccountFields(accountType);
        });
    });
    
    // Form submission - FIXED
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        console.log('✅ Register form found, adding submit listener');
        registerForm.addEventListener('submit', function(e) {
            console.log('📤 Form submission intercepted');
            handleRegistration(e);
        });
    } else {
        console.error('❌ Register form not found!');
    }
    
    // Password confirmation validation
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm-password');
    
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', validatePasswordMatch);
    }
    
    if (passwordField) {
        passwordField.addEventListener('input', validatePasswordMatch);
    }
}

function showAccountFields(accountType) {
    console.log('Showing fields for:', accountType);
    const studentFields = document.getElementById('student-fields');
    const adminFields = document.getElementById('admin-fields');
    
    if (accountType === 'student') {
        studentFields.style.display = 'block';
        adminFields.style.display = 'none';
        
        // Add required attributes to student fields
        document.getElementById('student-name').required = true;
        document.getElementById('student-dob').required = true;
        document.getElementById('student-programme').required = true;
        document.getElementById('student-year').required = true;
        document.getElementById('email').required = true;
        document.getElementById('password').required = true;
        
        // Remove required from admin fields
        document.getElementById('admin-name').required = false;
        document.getElementById('admin-faculty').required = false;
        
        console.log('✅ Student fields shown with required attributes');
    } else {
        studentFields.style.display = 'none';
        adminFields.style.display = 'block';
        
        // Add required attributes to admin fields
        document.getElementById('admin-name').required = true;
        document.getElementById('admin-faculty').required = true;
        document.getElementById('email').required = true;
        document.getElementById('password').required = true;
        
        // Remove required from student fields
        document.getElementById('student-name').required = false;
        document.getElementById('student-dob').required = false;
        document.getElementById('student-programme').required = false;
        document.getElementById('student-year').required = false;
        
        console.log('✅ Admin fields shown with required attributes');
    }
}

async function loadProgrammes() {
    try {
        console.log('🔄 Loading programmes for registration...');
        const response = await fetch('http://localhost:3000/api/programmes');
        
        console.log('Programmes response status:', response.status);
        
        if (response.ok) {
            const programmes = await response.json();
            console.log('✅ Programmes loaded:', programmes.length);
            populateProgrammeDropdown(programmes);
        } else {
            console.error('❌ Failed to load programmes:', response.status);
            // Use default programmes as fallback
            const defaultProgrammes = [
                { Programme_Code: 'CS001', Programme_Name: 'BSc Computer Science', Faculty_Name: 'Faculty of Computer Science' },
                { Programme_Code: 'CS002', Programme_Name: 'BSc Software Engineering', Faculty_Name: 'Faculty of Computer Science' },
                { Programme_Code: 'EN001', Programme_Name: 'BEng Civil Engineering', Faculty_Name: 'Faculty of Engineering' },
                { Programme_Code: 'BS001', Programme_Name: 'BBA Business Administration', Faculty_Name: 'Faculty of Business Studies' }
            ];
            populateProgrammeDropdown(defaultProgrammes);
        }
    } catch (error) {
        console.error('❌ Error loading programmes:', error);
    }
}

function populateProgrammeDropdown(programmes) {
    const dropdown = document.getElementById('student-programme');
    if (dropdown) {
        console.log('📝 Populating programme dropdown with', programmes.length, 'options');
        dropdown.innerHTML = '<option value="">Select Programme</option>';
        programmes.forEach(programme => {
            const displayText = `${programme.Programme_Name} (${programme.Faculty_Name})`;
            dropdown.innerHTML += `<option value="${programme.Programme_Code}">${displayText}</option>`;
        });
    } else {
        console.error('❌ Programme dropdown not found!');
    }
}

function validatePasswordMatch() {
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirm-password')?.value || '';
    const confirmField = document.getElementById('confirm-password');
    
    if (!confirmField) return false;
    
    if (confirmPassword && password !== confirmPassword) {
        confirmField.style.borderColor = '#e74c3c';
        return false;
    } else {
        confirmField.style.borderColor = '#27ae60';
        return true;
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    console.log('🚀 Starting registration process...');
    
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Clear previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    // Get account type
    const activeTypeBtn = document.querySelector('.type-btn.active');
    if (!activeTypeBtn) {
        showError('Please select an account type');
        return;
    }
    
    const accountType = activeTypeBtn.getAttribute('data-type');
    console.log('Account type:', accountType);
    
    // DEBUG: Check ALL form fields before validation
    console.log('🔍 DEBUG - Checking ALL form fields:');
    const facultyDropdown = document.getElementById('admin-faculty');
    console.log('🔍 Faculty dropdown:', {
        value: facultyDropdown?.value,
        selectedIndex: facultyDropdown?.selectedIndex,
        selectedText: facultyDropdown?.options[facultyDropdown?.selectedIndex]?.text,
        options: facultyDropdown ? Array.from(facultyDropdown.options).map(opt => ({value: opt.value, text: opt.text})) : 'No dropdown'
    });
    
    const adminName = document.getElementById('admin-name');
    console.log('🔍 Admin name:', adminName?.value);
    
    const email = document.getElementById('email');
    console.log('🔍 Email:', email?.value);
    
    // Validate form
    if (!validateForm(accountType)) {
        console.log('❌ Client-side validation failed');
        return;
    }
    
    console.log('✅ Client-side validation passed');
    
    // Validate password match
    if (!validatePasswordMatch()) {
        showError('Passwords do not match');
        return;
    }
    
    // Prepare form data - MANUAL way to avoid FormData issues
    const registrationData = {
        accountType: accountType,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };
    
    console.log('📦 Basic form data:', registrationData);
    
    // Add type-specific data MANUALLY
    if (accountType === 'student') {
        registrationData.studentName = document.getElementById('student-name').value;
        registrationData.dateOfBirth = document.getElementById('student-dob').value;
        registrationData.contactNumber = document.getElementById('student-contact').value;
        registrationData.programmeCode = document.getElementById('student-programme').value;
        registrationData.yearEnrolled = parseInt(document.getElementById('student-year').value);
        console.log('📦 Student data added');
    } else {
        // MANUAL data collection for admin
        registrationData.adminName = document.getElementById('admin-name').value;
        registrationData.faculty = document.getElementById('admin-faculty').value; // Use 'faculty' to match server
        
        console.log('📦 Admin data added MANUALLY:', {
            adminName: registrationData.adminName,
            faculty: registrationData.faculty
        });
    }
    
    console.log('📦 FINAL data being sent to server:', JSON.stringify(registrationData, null, 2));
    
    // Show loading state
    submitButton.textContent = 'Creating Account...';
    submitButton.disabled = true;
    
    try {
        console.log('🌐 Sending registration request to server...');
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });
        
        console.log('📨 Server response status:', response.status);
        
        const data = await response.json();
        console.log('📄 Server response data:', data);
        
        if (response.ok && data.success) {
            showSuccess(data.message || 'Account created successfully!');
            e.target.reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html?type=' + accountType;
            }, 2000);
            
        } else {
            showError(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        showError('Network error. Please check if the server is running.');
    } finally {
        // Reset button state
        submitButton.textContent = 'Create Account';
        submitButton.disabled = false;
    }
}
function validateForm(accountType) {
    console.log('🔍 Validating form for:', accountType);
    
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    
    // Basic validation
    if (!email || !password) {
        showError('Please fill in all required fields');
        return false;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return false;
    }
    
    // Type-specific validation
    if (accountType === 'student') {
        const studentName = document.getElementById('student-name')?.value || '';
        const programme = document.getElementById('student-programme')?.value || '';
        
        if (!studentName || !programme) {
            showError('Please fill in all student information');
            return false;
        }
    } else {
          const adminName = document.getElementById('admin-name')?.value || '';
        const facultyDropdown = document.getElementById('admin-faculty');
        const facultyCode = facultyDropdown ? facultyDropdown.value : '';
        
        console.log('🔍 Admin validation:', { 
            adminName, 
            facultyCode,
            facultyDropdownExists: !!facultyDropdown,
            selectedIndex: facultyDropdown?.selectedIndex,
            optionsLength: facultyDropdown?.options?.length
        });
        
        if (!adminName) {
            showError('Please fill in admin name');
            return false;
        }
        
        if (!facultyCode) {
            showError('Please select a faculty');
            return false;
        }
    }
    
    console.log('✅ Form validation passed');
    return true;
}

function showError(message) {
    console.error('❌ Error:', message);
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showSuccess(message) {
    console.log('✅ Success:', message);
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}