// ============================================
// auth.js — Shared Authentication Module
// ============================================

const SUPABASE_URL = 'https://wtianainvlmlhtmquiby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWFuYWludmxtbGh0bXF1aWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzE2NjUsImV4cCI6MjA5MzYwNzY2NX0.NINMckzLG-Rsj4l26PJbrBfdFWHGU_jOzvFDIfPQl2c';



// Initialize Supabase client safely
let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('Supabase library not found. Network/Proxy might be blocking it.');
    }
} catch (e) {
    console.error('Failed to initialize Supabase:', e);
}

// Session key
const SESSION_KEY = 'itemgen_session';

// ============================================
// Session Management
// ============================================

function saveSession(userData) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
}

function getSession() {
    try {
        const data = sessionStorage.getItem(SESSION_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function getUser() {
    return getSession();
}

function isLoggedIn() {
    return getSession() !== null;
}

function logout() {
    clearSession();
    window.location.href = 'login.html';
}

// ============================================
// Auth Guards
// ============================================

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function requireRole(role) {
    const user = getUser();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    if (user.role !== role) {
        // Wrong role — redirect to homepage
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ============================================
// HRMS Authentication
// ============================================

async function hrmsLogin(username, password) {
    // MD5 hash the password
    const hashedPassword = md5(password);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(`${window.location.origin}/api/hrms/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account: username,
                password: hashedPassword
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('HRMS Auth error:', error);
        if (error.name === 'AbortError') {
            throw new Error('การเชื่อมต่อ HRMS หมดเวลา กรุณาลองใหม่อีกครั้ง');
        }
        throw new Error(`ไม่สามารถเชื่อมต่อระบบ HRMS ได้: ${error.message || error}`);
    }
}

async function hrmsGetEmployee(empId) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(`${window.location.origin}/api/hrms/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ empId }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('HRMS profile error: status', response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('HRMS Employee fetch error:', error);
        return null;
    }
}

// ============================================
// Database: User Management
// ============================================

async function findUserByEmpId(empId) {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('emp_id', empId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Find user error:', error);
    }
    return data;
}

async function createUser(userData) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const { data, error } = await supabaseClient
        .from('users')
        .insert(userData)
        .select()
        .single();

    if (error) {
        console.error('Create user error:', error);
        throw error;
    }
    return data;
}

async function updateLastLogin(empId) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('emp_id', empId);

    if (error) console.warn('Update last_login error:', error);
}

// ============================================
// Full Login Flow
// ============================================

async function performLogin(username, password) {
    // [DEMO BYPASS] Allow testing with dummy accounts
    if (username === 'testuser' && password === '123456') {
        const dummyEmpId = 'DUMMY001';
        let user = await findUserByEmpId(dummyEmpId);
        if (!user) {
            user = await createUser({
                emp_id: dummyEmpId,
                full_name: 'Test User (Dummy)',
                email: 'test@example.com',
                role: 'user',
                status: 'active',
                company: 'Demo Corporation',
                department: 'Testing Dept'
            });
        }
        const sessionData = { ...user };
        saveSession(sessionData);
        return sessionData;
    }

    if (username === 'testadmin' && password === 'admin1234') {
        const dummyEmpId = 'DUMMY_ADM';
        let user = await findUserByEmpId(dummyEmpId);
        if (!user) {
            user = await createUser({
                emp_id: dummyEmpId,
                full_name: 'Test Admin (Dummy)',
                email: 'admin_test@example.com',
                role: 'admin',
                status: 'active',
                company: 'Demo Corporation',
                department: 'IT Dept'
            });
        }
        const sessionData = { ...user };
        saveSession(sessionData);
        return sessionData;
    }

    if (username === 'testuser2' && password === 'user123456') {
        const dummyEmpId = 'DUMMY002';
        let user = await findUserByEmpId(dummyEmpId);
        if (!user) {
            user = await createUser({
                emp_id: dummyEmpId,
                full_name: 'Test User 2 (Dummy)',
                email: 'test2@example.com',
                role: 'user',
                status: 'active',
                company: 'Demo Corporation',
                department: 'Sales Dept'
            });
        }
        const sessionData = { ...user };
        saveSession(sessionData);
        return sessionData;
    }

    // Step 1: Authenticate with HRMS
    const authResult = await hrmsLogin(username, password);

    // Check result
    if (!authResult || authResult.Result !== 'OK') {
        throw new Error(authResult?.Message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    const empId = authResult.EmpId || authResult.empId;
    if (!empId) {
        throw new Error('ไม่พบรหัสพนักงาน กรุณาติดต่อ IT');
    }

    // Step 2: Fetch fresh profile data from HRMS
    let profileData = {};
    const empProfile = await hrmsGetEmployee(empId);
    
    if (empProfile && empProfile.status === 'success' && empProfile.data?.employee) {
        const emp = empProfile.data.employee;
        profileData = {
            full_name: emp.EmpName || username,
            email: emp.EMail || '',
            phone: emp.Sim_Number || '',
            position: emp.Position || '',
            department: emp.Department || '',
            company: emp.CompanyName || ''
        };
    } else {
        // Fallback for profile data if HRMS fetch fails
        profileData = {
            full_name: username,
            email: '',
            phone: '',
            position: '',
            department: '',
            company: ''
        };
    }

    // Step 3: Check if user exists in our database
    let user = await findUserByEmpId(empId);

    if (user) {
        // Existing user — Update profile and last login
        const { error } = await supabaseClient
            .from('users')
            .update({ 
                ...profileData,
                last_login: new Date().toISOString() 
            })
            .eq('emp_id', empId);
        
        if (error) console.warn('Update user profile error:', error);
        // Refresh local user object
        user = { ...user, ...profileData };
    } else {
        // New user — create record
        user = await createUser({
            emp_id: empId,
            ...profileData,
            role: 'user',
            status: 'active'
        });
    }

    // Step 3: Save session
    const sessionData = {
        emp_id: user.emp_id,
        full_name: user.full_name,
        email: user.email,
        position: user.position,
        department: user.department,
        company: user.company,
        role: user.role,
        status: user.status
    };

    saveSession(sessionData);
    return sessionData;
}

// ============================================
// UI Helpers
// ============================================

function renderUserBar(containerId) {
    const user = getUser();
    if (!user) return;

    // We no longer render into the old containerId. Instead, we populate the modern header elements if they exist.
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const userInitials = document.getElementById('userInitials');
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownRole = document.getElementById('dropdownRole');
    const dropdownMeta = document.getElementById('dropdownMeta');
    const profileToggle = document.getElementById('profileToggle');
    const profileDropdown = document.getElementById('profileDropdown');

    const roleLabel = user.role === 'admin' ? 'Admin' : 'User';
    const roleBadgeColor = user.role === 'admin' ? 'color: #1e3a8a; background: #dbeafe;' : 'color: #475569; background: #f1f5f9;';
    const avatarColor = user.role === 'admin' ? '#1e3a8a' : '#475569';

    // 1. Calculate initials
    const nameParts = (user.full_name || '').split(' ');
    let initials = '';
    if (nameParts.length > 0 && nameParts[0]) initials += nameParts[0][0];
    if (nameParts.length > 1 && nameParts[1]) initials += nameParts[1][0];
    initials = (initials || user.email || 'US').substring(0, 2).toUpperCase();

    // 2. Populate Header
    if (headerUserName) headerUserName.textContent = user.full_name || 'User';
    if (headerUserRole) {
        headerUserRole.textContent = roleLabel;
        headerUserRole.style.cssText = `font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-top: 2px; ${roleBadgeColor}`;
    }
    if (userInitials) {
        userInitials.textContent = initials;
        userInitials.style.backgroundColor = avatarColor;
    }

    // 3. Populate Dropdown
    if (dropdownAvatar) {
        dropdownAvatar.textContent = initials;
        dropdownAvatar.style.backgroundColor = avatarColor;
    }
    if (dropdownName) dropdownName.textContent = user.full_name || 'User';
    if (dropdownRole) dropdownRole.textContent = roleLabel;
    
    if (dropdownMeta) {
        let metaHtml = '';
        if (user.email) metaHtml += `<div>📧 ${user.email}</div>`;
        if (user.department) metaHtml += `<div>🏢 ${user.department}</div>`;
        if (user.company) metaHtml += `<div>💼 ${user.company}</div>`;
        dropdownMeta.innerHTML = metaHtml;
    }

    // 4. Attach click listener if not already attached
    if (profileToggle && profileDropdown && !profileToggle.dataset.listenerAttached) {
        profileToggle.dataset.listenerAttached = 'true';
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!profileToggle.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }

    // 5. Hide specific menu items for non-admins
    if (user.role !== 'admin') {
        const navBulkUpdates = document.getElementById('navBulkUpdates');
        const navPermissions = document.getElementById('navPermissions');
        
        if (navBulkUpdates) navBulkUpdates.style.display = 'none';
        if (navPermissions) navPermissions.style.display = 'none';
    }
}
