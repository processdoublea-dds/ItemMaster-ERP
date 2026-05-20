// ============================================
// admin_users.js — Account Management Logic
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // === Auth Guard: Admin only ===
    if (!requireAuth()) return;
    const user = getUser();
    if (user.role !== 'admin') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        window.location.href = 'index.html';
        return;
    }

    // 1. Initial Render
    renderUserBar('userBar');
    await loadUsers();

    // 2. Event Listeners
    document.getElementById('btnRefresh')?.addEventListener('click', loadUsers);
});

async function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    const statTotal = document.getElementById('statTotal');
    const statAdmins = document.getElementById('statAdmins');
    const statActive = document.getElementById('statActive');
    const statInactive = document.getElementById('statInactive');

    if (!supabaseClient) {
        tableBody.innerHTML = '<tr><td colspan="7" class="table-empty">ไม่สามารถเชื่อมต่อ Supabase ได้</td></tr>';
        return;
    }

    try {
        // Fetch all users
        const { data: users, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('emp_id', { ascending: true });

        if (error) throw error;

        // Calculate Stats
        const total = users.length;
        const admins = users.filter(u => u.role === 'admin').length;
        const active = users.filter(u => u.status === 'active').length;
        const inactive = users.filter(u => u.status === 'inactive').length;

        // Update Stats UI
        if (statTotal) statTotal.textContent = total;
        if (statAdmins) statAdmins.textContent = admins;
        if (statActive) statActive.textContent = active;
        if (statInactive) statInactive.textContent = inactive;

        // Render Table
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="table-empty">ไม่พบข้อมูลผู้ใช้งาน</td></tr>';
            return;
        }

        tableBody.innerHTML = users.map(user => {
            const lastLogin = user.last_login 
                ? new Date(user.last_login).toLocaleString('th-TH') 
                : 'ไม่เคยเข้าใช้งาน';
            
            return `
                <tr>
                    <td class="user-id-cell">${user.emp_id}</td>
                    <td>
                        <div style="font-weight: 600;">${user.full_name}</div>
                        <div style="font-size: 0.75rem; color: #666;">${user.email || '-'}</div>
                    </td>
                    <td>${user.company || '-'}</td>
                    <td>
                        <div>${user.department || '-'}</div>
                        <div style="font-size: 0.75rem; color: #888;">${user.position || '-'}</div>
                    </td>
                    <td>
                        <select class="inline-badge-select role-${user.role}" onchange="updateUserRole('${user.emp_id}', this.value)" ${user.emp_id === 'DUMMY_SUPER' ? 'disabled' : ''}>
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>👤 USER</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>🛡️ ADMIN</option>
                        </select>
                    </td>
                    <td>
                        <select class="inline-badge-select status-${user.status}" onchange="updateUserStatus('${user.emp_id}', this.value)" ${user.emp_id === 'DUMMY_SUPER' ? 'disabled' : ''}>
                            <option value="active" ${user.status === 'active' ? 'selected' : ''}>🟢 Active</option>
                            <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>⚪ Inactive</option>
                        </select>
                    </td>
                    <td style="font-size: 0.85rem;">${lastLogin}</td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('Load users error:', err);
        tableBody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color: red;">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
    }
}

async function updateUserRole(empId, newRole) {
    if (!confirm(`คุณต้องการเปลี่ยนสิทธิ์ของพนักงานรหัส ${empId} เป็น ${newRole.toUpperCase()} ใช่หรือไม่?`)) {
        await loadUsers(); // Reset view
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('users')
            .update({ role: newRole })
            .eq('emp_id', empId);

        if (error) throw error;
        
        // If current user updated themselves, we should update session but it's rare
        const sessionUser = getUser();
        if (sessionUser && sessionUser.emp_id === empId) {
            sessionUser.role = newRole;
            saveSession(sessionUser);
        }

        await loadUsers();
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการอัปเดตสิทธิ์: ' + err.message);
        await loadUsers();
    }
}

async function updateUserStatus(empId, newStatus) {
    if (!confirm(`คุณต้องการเปลี่ยนสถานะของพนักงานรหัส ${empId} เป็น ${newStatus.toUpperCase()} ใช่หรือไม่?`)) {
        await loadUsers(); // Reset view
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('users')
            .update({ status: newStatus })
            .eq('emp_id', empId);

        if (error) throw error;
        
        await loadUsers();
    } catch (err) {
        alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ: ' + err.message);
        await loadUsers();
    }
}
