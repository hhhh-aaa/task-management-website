// ============================================================
// state.js — Trạng thái toàn cục của ứng dụng
// Tất cả dữ liệu có thể thay đổi runtime đều đặt ở đây.
// ============================================================

export const state = {
    currentDate: new Date(),
    currentView: 'dashboard',
    chartInstances: {},
    currentFilters: { priority: 'all', category: 'all', person: 'all' },
    userProfile: { name: '', email: '', id: null, role: 'member' },
    teamMembers: [],
    searchTerm: '',
    sortConfig: { key: 'due_date', direction: 'ascending' },
    tasksCache: [],
    categories: ['Chung', 'Công việc', 'Cá nhân', 'Học tập', 'Dự án'],

    // Callback được router.js gán vào để tránh circular dependency
    renderCurrentView: null,
};
