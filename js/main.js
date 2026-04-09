// ============================================================
// main.js — Entry point: khởi tạo ứng dụng, event listeners
// ============================================================

import { state } from './state.js';
import { debounce } from './utils.js';
import { showLoading, hideLoading } from './ui.js';
import { authApi, tasksApi } from './api.js';
import { showAuthScreen } from './auth.js';
import { updateProfileUI, openProfileModal } from './profile.js';
import { openAddTaskModal, openEditTaskModal } from './tasks.js';
import { renderCurrentView, switchView } from './router.js';

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.toggle('-translate-x-full');
    sidebarBackdrop.classList.toggle('hidden');
}

function setupEventListeners() {
    const hamburgerBtn    = document.getElementById('hamburger-btn');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebar         = document.getElementById('sidebar');
    const sidebarNav      = document.getElementById('sidebar-nav');
    const appContainer    = document.getElementById('app-container');

    hamburgerBtn.addEventListener('click', toggleSidebar);
    sidebarBackdrop.addEventListener('click', toggleSidebar);

    document.getElementById('profile-btn').addEventListener('click', openProfileModal);
    document.getElementById('fab-add-task').addEventListener('click', () => openAddTaskModal());

    sidebarNav.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.closest('.sidebar-item');
        if (target) {
            const view = target.dataset.view;
            switchView(view);
            if (window.innerWidth < 1024 && !sidebar.classList.contains('-translate-x-full')) {
                toggleSidebar();
            }
        }
    });

    document.getElementById('priority-filter').addEventListener('change', (e) => {
        state.currentFilters.priority = e.target.value;
        renderCurrentView();
    });
    document.getElementById('category-filter').addEventListener('change', (e) => {
        state.currentFilters.category = e.target.value;
        renderCurrentView();
    });
    document.getElementById('person-filter').addEventListener('change', (e) => {
        state.currentFilters.person = e.target.value;
        renderCurrentView();
    });
    document.getElementById('search-input').addEventListener('input', debounce((e) => {
        state.searchTerm = e.target.value;
        renderCurrentView();
    }, 300));

    appContainer.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-task-btn');
        if (editButton) {
            e.preventDefault();
            e.stopPropagation();
            const taskId = editButton.dataset.taskId;
            if (taskId) openEditTaskModal(taskId);
            return;
        }
        const taskElement = e.target.closest('.task-item-clickable');
        if (taskElement && !e.target.matches('input[type="checkbox"]')) {
            e.preventDefault();
            const taskId = taskElement.dataset.taskId;
            if (taskId) openEditTaskModal(taskId);
        }
    });
}

async function startApp() {
    state.renderCurrentView = renderCurrentView;
    setupEventListeners();
    updateProfileUI();

    showLoading();
    try {
        // Tải công việc từ server
        const tasks = await tasksApi.getAll();
        state.tasksCache = tasks || [];
        console.log(`Đã tải ${state.tasksCache.length} công việc.`);

        // Tải danh sách thành viên từ server
        try {
            const { users } = await authApi.getUsers();
            state.teamMembers = (users || [])
                .filter(u => u.email !== state.userProfile.email)
                .map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
        } catch (e) {
            console.warn('Không tải được danh sách thành viên:', e.message);
        }

        document.getElementById('app-container').classList.remove('hidden');
        hideLoading();
        switchView('dashboard');
    } catch (e) {
        hideLoading();
        alert('Lỗi tải dữ liệu: ' + e.message);
    }
}

// ——— Khởi động: kiểm tra session, nếu chưa đăng nhập thì hiện màn hình auth ———
(async function boot() {
    try {
        const { user } = await authApi.me();
        if (user) {
            state.userProfile = { id: user.id, name: user.name, email: user.email, role: user.role };
            await startApp();
        } else {
            showAuthScreen();
            window.addEventListener('auth:success', () => startApp(), { once: true });
        }
    } catch (e) {
        showAuthScreen();
        window.addEventListener('auth:success', () => startApp(), { once: true });
    }
})();
