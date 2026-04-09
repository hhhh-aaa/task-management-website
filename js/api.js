// ============================================================
// api.js — Lớp giao tiếp với PHP backend (thay thế Supabase SDK)
// ============================================================

const API_BASE = 'api';

async function request(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        credentials: 'include',        // Gửi kèm session cookie
        headers: { 'Content-Type': 'application/json' },
    };
    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
        throw new Error(data.message || `Lỗi HTTP ${res.status}`);
    }
    return data;
}

// ——— Authentication API ———
export const authApi = {
    me:            ()                  => request('/auth.php?action=me'),
    login:         (email, password)   => request('/auth.php', 'POST', { action: 'login', email, password }),
    register:      (name, email, pass) => request('/auth.php', 'POST', { action: 'register', name, email, password: pass }),
    logout:        ()                  => request('/auth.php', 'POST', { action: 'logout' }),
    getUsers:      ()                  => request('/auth.php', 'POST', { action: 'users' }),
    updateProfile: (name, email)       => request('/auth.php', 'POST', { action: 'update_profile', name, email }),
    truncateTasks: ()                  => request('/auth.php', 'POST', { action: 'truncate_tasks' }),
};

// ——— Tasks API ———
export const tasksApi = {
    getAll: ()         => request('/tasks.php'),
    create: (data)     => request('/tasks.php', 'POST', data),
    update: (id, data) => request(`/tasks.php?id=${encodeURIComponent(id)}`, 'PUT', data),
    delete: (id)       => request(`/tasks.php?id=${encodeURIComponent(id)}`, 'DELETE'),
};
