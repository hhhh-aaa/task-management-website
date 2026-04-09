// ============================================================
// views/dashboard.js — Dashboard tổng quan
// ============================================================

import { state } from '../state.js';
import { STATUS_COLORS, STATUS_CHART_COLORS, PRIORITY_COLORS, CATEGORY_COLORS } from '../config.js';
import { stringToColor, formatDate, escapeHtml } from '../utils.js';
import { getFilteredTasksFromCache } from '../filters.js';
import { createChart } from '../charts.js';
import { openEarlyCompletionModal, openListTasksModal } from '../tasks.js';

export function renderDashboardView() {
    const container = document.getElementById('dashboard-view-container');
    container.classList.remove('hidden');

    container.innerHTML = `
        <div id="dashboard-cards-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-3 p-4 rounded-lg shadow-sm bg-white border border-gray-200/80">
                <h3 class="font-semibold mb-2 text-green-800" id="monthly-progress-title">Tiến độ Tháng</h3>
                <div class="bg-gray-200 rounded-full h-4"><div id="monthly-progress-bar" class="bg-green-500 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style="width: 0%;">0%</div></div>
            </div>
            <div class="p-4 rounded-lg shadow-sm bg-teal-50 border border-teal-200/80"><h3 class="font-semibold text-center mb-2 text-teal-800">Theo Trạng thái</h3><div class="h-64 relative"><canvas id="status-chart"></canvas></div></div>
            <div class="p-4 rounded-lg shadow-sm bg-amber-50 border border-amber-200/80"><h3 class="font-semibold text-center mb-2 text-amber-800">Theo Ưu tiên</h3><div class="h-64 relative"><canvas id="priority-chart"></canvas></div></div>
            <div class="p-4 rounded-lg shadow-sm bg-sky-50 border border-sky-200/80"><h3 class="font-semibold text-center mb-2 text-sky-800">Theo Danh mục</h3><div class="h-64 relative"><canvas id="category-chart"></canvas></div></div>
            <div id="early-completion-card" class="p-4 rounded-lg shadow-sm bg-emerald-50 border border-emerald-200/80 flex flex-col items-center justify-center text-center task-item-clickable">
                <h3 class="font-semibold mb-2 text-emerald-800">Hoàn thành sớm hạn</h3>
                <p id="early-completion-count" class="text-4xl font-bold text-emerald-600">0</p>
                <p id="early-completion-rate" class="text-sm text-gray-500 mt-1">0% trên tổng số hoàn thành</p>
            </div>
            <div class="p-4 rounded-lg shadow-sm bg-red-50 border border-red-200/80 flex flex-col">
                <h3 id="dashboard-overdue-title" class="font-semibold mb-2 text-red-700 task-item-clickable">Công việc quá hạn</h3>
                <div id="overdue-tasks-list" class="task-list space-y-2 overflow-y-auto max-h-48 flex-grow"></div>
            </div>
            <div class="p-4 rounded-lg shadow-sm bg-indigo-50 border border-indigo-200/80 flex flex-col">
                <h3 id="dashboard-today-title" class="font-semibold mb-2 text-indigo-700 task-item-clickable">Công việc hôm nay</h3>
                <div id="today-tasks-list" class="task-list space-y-2 overflow-y-auto max-h-48 flex-grow"></div>
            </div>
            <div class="p-4 rounded-lg shadow-sm bg-violet-50 border border-violet-200/80"><h3 class="font-semibold text-center mb-2 text-violet-800">Theo Người phụ trách</h3><div class="h-64 relative"><canvas id="person-chart"></canvas></div></div>
            <div class="lg:col-span-2 p-4 rounded-lg shadow-sm bg-slate-50 border border-slate-200/80 flex flex-col">
                <h3 id="dashboard-upcoming-title" class="font-semibold mb-2 text-slate-700 task-item-clickable">Công việc sắp tới</h3>
                <div id="upcoming-tasks-list" class="task-list space-y-2 overflow-y-auto max-h-48 flex-grow"></div>
            </div>
        </div>`;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const todayStr = formatDate(today);
    const tasks = getFilteredTasksFromCache();

    // Hoàn thành sớm hạn
    const allCompletedTasks = tasks.filter(t => t.is_completed);
    const earlyCompletedTasks = allCompletedTasks.filter(t => {
        if (!t.completed_at || !t.due_date) return false;
        const completionDate = new Date(t.completed_at);
        completionDate.setHours(0, 0, 0, 0);
        const dueDateParts = t.due_date.split('-').map(Number);
        const dueDate = new Date(dueDateParts[0], dueDateParts[1] - 1, dueDateParts[2]);
        dueDate.setHours(0, 0, 0, 0);
        return completionDate < dueDate;
    });
    const earlyCount = earlyCompletedTasks.length;
    const earlyRate = allCompletedTasks.length > 0 ? Math.round((earlyCount / allCompletedTasks.length) * 100) : 0;
    document.getElementById('early-completion-count').textContent = earlyCount;
    document.getElementById('early-completion-rate').textContent = `${earlyRate}% trên tổng số hoàn thành`;

    // Tiến độ tháng
    const monthTasks = tasks.filter(t => {
        const dateParts = t.due_date.split('-').map(Number);
        const taskDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        return taskDate.getFullYear() === year && taskDate.getMonth() === month;
    });
    const totalTasks = monthTasks.length;
    const completedTasks = monthTasks.filter(t => t.is_completed).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const bar = document.getElementById('monthly-progress-bar');
    bar.style.width = `${progress}%`;
    bar.textContent = `${progress}%`;
    document.getElementById('monthly-progress-title').textContent = `Tiến độ Tháng ${month + 1}`;

    // Danh sách công việc
    const overdueTasks = tasks.filter(t => t.due_date < todayStr && !t.is_completed);
    const todayTasks = tasks.filter(t => t.due_date === todayStr);
    const upcomingTasks = tasks.filter(t => t.due_date > todayStr && !t.is_completed).slice(0, 10);
    renderTaskList('overdue-tasks-list', overdueTasks);
    renderTaskList('today-tasks-list', todayTasks);
    renderTaskList('upcoming-tasks-list', upcomingTasks);

    // Biểu đồ
    const statusCounts = tasks.reduce((acc, t) => { const s = t.status || 'Cần làm'; acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    createChart('status-chart', 'pie', Object.keys(statusCounts), Object.values(statusCounts), Object.keys(statusCounts).map(s => STATUS_CHART_COLORS[s] || '#d1d5db'));

    const priorityCounts = tasks.reduce((acc, t) => { const p = t.priority || 'Trung bình'; acc[p] = (acc[p] || 0) + 1; return acc; }, {});
    createChart('priority-chart', 'doughnut', Object.keys(priorityCounts), Object.values(priorityCounts), Object.keys(priorityCounts).map(p => PRIORITY_COLORS[p] || '#d1d5db'));

    const categoryCounts = tasks.reduce((acc, t) => { const c = t.category || 'Chung'; acc[c] = (acc[c] || 0) + 1; return acc; }, {});
    createChart('category-chart', 'pie', Object.keys(categoryCounts), Object.values(categoryCounts), CATEGORY_COLORS);

    const personCounts = tasks.reduce((acc, t) => { const name = t.assigned_to_name || 'Chưa giao'; acc[name] = (acc[name] || 0) + 1; return acc; }, {});
    createChart('person-chart', 'bar', Object.keys(personCounts), Object.values(personCounts), CATEGORY_COLORS);

    // Click events
    document.getElementById('early-completion-card').addEventListener('click', () => openEarlyCompletionModal(earlyCompletedTasks));
    document.getElementById('dashboard-overdue-title').addEventListener('click', () => openListTasksModal(overdueTasks, 'Danh sách Công việc Quá hạn'));
    document.getElementById('dashboard-today-title').addEventListener('click', () => openListTasksModal(todayTasks, 'Danh sách Công việc Hôm nay'));
    document.getElementById('dashboard-upcoming-title').addEventListener('click', () => openListTasksModal(upcomingTasks, 'Danh sách Công việc Sắp tới'));
}

function renderTaskList(elementId, tasks) {
    const listEl = document.getElementById(elementId);
    if (!listEl) return;
    if (!tasks || tasks.length === 0) {
        listEl.innerHTML = `<p class="text-sm text-gray-500 text-center py-4">Không có công việc nào.</p>`;
        return;
    }
    listEl.innerHTML = tasks.map(task => {
        const dateParts = task.due_date.split('-').map(Number);
        const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        return `
        <div class="text-sm p-2 bg-white/50 rounded-md task-item-clickable relative group" data-task-id="${task.id}">
            <p class="${task.is_completed ? 'line-through text-gray-400' : ''}">${escapeHtml(task.content)}</p>
            <div class="flex items-center justify-between text-xs text-gray-400 mt-1">
                <span>${localDate.toLocaleDateString('vi-VN')}</span>
                ${task.assigned_to_name ? `<div class="flex items-center gap-1"><div class="avatar" style="background-color: ${stringToColor(task.assigned_to_email)}" title="${escapeHtml(task.assigned_to_name)}">${escapeHtml(task.assigned_to_name.charAt(0))}</div><span>${escapeHtml(task.assigned_to_name)}</span></div>` : ''}
            </div>
            <button class="edit-task-btn absolute top-1 right-1 p-1 rounded-full bg-white/80 text-gray-500 hover:bg-gray-200 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" data-task-id="${task.id}">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg>
            </button>
        </div>`;
    }).join('');
}
