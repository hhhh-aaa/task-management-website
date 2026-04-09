// ============================================================
// router.js — Điều hướng view và render view hiện tại
// ============================================================

import { state } from './state.js';
import { renderFilters } from './filters.js';
import { renderDashboardView } from './views/dashboard.js';
import { renderWeeklyView, cleanupWeeklyView } from './views/weekly.js';
import { renderMonthlyView } from './views/monthly.js';
import { renderKanbanView } from './views/kanban.js';
import { renderListView } from './views/list.js';
import { renderMembersView } from './views/members.js';
import { renderReportsView } from './views/reports.js';

const ALL_VIEWS = ['dashboard', 'week', 'month', 'kanban', 'list', 'members', 'reports'];
const VIEWS_WITH_FILTERS = ['dashboard', 'kanban', 'list', 'members', 'week', 'reports'];
const CHART_VIEWS = ['dashboard', 'reports'];

// Map view key → container ID thực tế trong HTML
const VIEW_CONTAINER_IDS = {
    dashboard: 'dashboard-view-container',
    week:      'weekly-view-container',
    month:     'monthly-view-container',
    kanban:    'kanban-view-container',
    list:      'list-view-container',
    members:   'members-view-container',
    reports:   'reports-view-container',
};

const VIEW_TITLES = {
    dashboard: 'Dashboard',
    week:      'Lịch Tuần',
    month:     'Lịch Tháng',
    kanban:    'Bảng Kanban',
    list:      'Danh sách',
    members:   'Nhân sự',
    reports:   'Báo cáo',
};

export function renderCurrentView() {
    renderView(state.currentView);
}

export function switchView(view) {
    if (!ALL_VIEWS.includes(view)) return;

    // Cleanup trước khi rời view tuần
    if (state.currentView === 'week' && view !== 'week') {
        cleanupWeeklyView();
    }

    // Destroy charts khi rời các view có chart
    if (CHART_VIEWS.includes(state.currentView) && !CHART_VIEWS.includes(view)) {
        Object.values(state.chartInstances).forEach(c => c && c.destroy());
        state.chartInstances = {};
    }

    state.currentView = view;

    // Cập nhật active nav link
    document.querySelectorAll('#sidebar-nav .sidebar-item').forEach(link => {
        link.classList.toggle('active', link.dataset.view === view);
    });

    // Cập nhật tiêu đề mobile header
    const titleEl = document.getElementById('current-view-title');
    if (titleEl) titleEl.textContent = VIEW_TITLES[view] || 'Dashboard';

    // Ẩn tất cả view container
    ALL_VIEWS.forEach(v => {
        const el = document.getElementById(VIEW_CONTAINER_IDS[v]);
        if (el) el.classList.add('hidden');
    });

    // Hiển thị/ẩn filter bar
    const filterBar = document.getElementById('search-and-filter-container');
    if (filterBar) {
        if (VIEWS_WITH_FILTERS.includes(view)) {
            filterBar.classList.remove('hidden');
            renderFilters();
        } else {
            filterBar.classList.add('hidden');
        }
    }

    renderView(view);
}

function renderView(view) {
    switch (view) {
        case 'dashboard': renderDashboardView(); break;
        case 'week': renderWeeklyView(); break;
        case 'month': renderMonthlyView(); break;
        case 'kanban': renderKanbanView(); break;
        case 'list': renderListView(); break;
        case 'members': renderMembersView(); break;
        case 'reports': renderReportsView(); break;
        default: renderDashboardView();
    }
}
