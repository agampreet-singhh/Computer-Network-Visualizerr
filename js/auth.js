// ========================================================
// Authentication & Session Management (Local Storage based)
// ========================================================

const AUTH_STORAGE_KEY = "cn_users";
const SESSION_STORAGE_KEY = "cn_current_user";

// Initialize default mock users if not present
function initAuth() {
    if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
        const defaultUsers = [
            { username: "admin", password: "admin123", name: "Administrator", role: "Lab Instructor" },
            { username: "student", password: "password", name: "Student User", role: "Student" }
        ];
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUsers));
    }
}

// Get all registered users
function getUsers() {
    initAuth();
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || [];
}

// Get current logged-in user
function getCurrentUser() {
    const userStr = localStorage.getItem(SESSION_STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

// Login
function login(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (user) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            username: user.username,
            name: user.name,
            role: user.role
        }));
        return { success: true, user: user };
    }
    return { success: false, message: "Invalid username or password. Try admin / admin123" };
}

// Register new user
function register(username, password, name) {
    if (!username.trim() || !password.trim()) {
        return { success: false, message: "Username and password cannot be empty." };
    }
    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
        return { success: false, message: "Username already exists. Please choose another." };
    }
    const newUser = {
        username: username.trim(),
        password: password,
        name: name.trim() || username.trim(),
        role: "Student"
    };
    users.push(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
    return { success: true, message: "Account created successfully! You can now log in." };
}

// Logout
function logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.location.href = "index.html";
}

// Guard for protected pages (topology, protocols, about)
function requireAuth() {
    initAuth();
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "index.html?msg=unauthorized";
        return null;
    }
    
    // Update navbar badge if element exists
    const userBadgeEl = document.getElementById("navbarUserBadge");
    if (userBadgeEl) {
        userBadgeEl.innerHTML = `
            <span>👤 ${user.username} (${user.role})</span>
            <button class="btn-logout" onclick="logout()">Logout</button>
        `;
    }
    return user;
}

// Redirect already logged in user if on login page
function redirectIfLoggedIn() {
    initAuth();
    const user = getCurrentUser();
    if (user) {
        // Optional quick banner or redirect
        const noticeEl = document.getElementById("alreadyLoggedInNotice");
        if (noticeEl) {
            noticeEl.style.display = "block";
            noticeEl.innerHTML = `You are already logged in as <strong>${user.username}</strong>. <a href="topology.html" style="color:#1a365d;font-weight:bold;">Go to Visualizer &rarr;</a>`;
        }
    }
}

