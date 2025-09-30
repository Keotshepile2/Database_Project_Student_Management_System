// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Auth check initialized');
    
    // Only run auth checks on specific pages
    const currentPage = window.location.pathname.split('/').pop();
    console.log('Current page:', currentPage);
    
    // Check authentication status
    checkAuthStatus();
    
    // Set login title based on URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const loginType = urlParams.get('type');
    
    if (loginType && document.getElementById('login-title')) {
        document.getElementById('login-title').textContent = 
            `${loginType.charAt(0).toUpperCase() + loginType.slice(1)} Login`;
    }
    
    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem('user');
    
    console.log('🔐 Auth status check:', {
        hasToken: !!token,
        userType: userType,
        hasUserData: !!userData,
        currentPage: window.location.pathname
    });
    
    // If no token, stay on current page (login or home)
    if (!token || !userType || !userData) {
        console.log('🔄 No valid session found, staying on current page');
        return;
    }
    
    try {
        // Verify token with server
        const response = await fetch('http://localhost:3000/api/auth/verify', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.valid) {
                console.log('✅ Valid session found, checking redirection...');
                
                const currentPage = window.location.pathname;
                const isLoginPage = currentPage.includes('login.html') || 
                                   currentPage === '/' ||
                                   currentPage.endsWith('/') ||
                                   currentPage.includes('index.html');
                
                // If on login page and already logged in, redirect to appropriate dashboard
                if (isLoginPage) {
                    console.log('🔄 Redirecting from login page to dashboard...');
                    setTimeout(() => {
                        if (userType === 'student') {
                            window.location.href = 'student-dashboard.html';
                        } else if (userType === 'admin') {
                            window.location.href = 'admin-dashboard.html';
                        }
                    }, 5000000);
                }
            } else {
                // Token is invalid, clear storage
                console.log('❌ Invalid token, clearing storage');
                clearAuthData();
            }
        } else {
            // Token verification failed, clear storage
            console.log('❌ Token verification failed, clearing storage');
            clearAuthData();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // On network error, keep the data but don't redirect
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Determine user type from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type') || 'student';
    
    console.log('🔐 Login attempt:', { email, userType });
    
    // Show loading state
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    errorMessage.style.display = 'none';
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.trim(),
                password: password.trim(),
                userType: userType
            })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (response.ok && data.success) {
            console.log('✅ Login successful!');
            
            // Store auth data
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', data.userType);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            console.log('📦 Data stored in localStorage:', {
                userType: data.userType,
                user: data.user
            });
            
            // Redirect to appropriate dashboard based on ACTUAL user type from server
            console.log('🔄 Redirecting to dashboard...');
            if (data.userType === 'student') {
                window.location.href = 'student-dashboard.html';
            } else if (data.userType === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                console.error('❌ Unknown user type:', data.userType);
                errorMessage.textContent = 'Unknown user type. Please contact administrator.';
                errorMessage.style.display = 'block';
            }
            
        } else {
            console.log('❌ Login failed:', data.message);
            errorMessage.textContent = data.message || 'Login failed. Please check your credentials.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Network error:', error);
        errorMessage.textContent = 'Network error. Please check if the server is running.';
        errorMessage.style.display = 'block';
    } finally {
        // Reset button state
        submitButton.textContent = 'Login';
        submitButton.disabled = false;
    }
}

function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
}

// Logout function
function logout() {
    console.log('🚪 Logging out...');
    clearAuthData();
    window.location.href = 'index.html';
}

// Make logout function globally available
window.logout = logout;

