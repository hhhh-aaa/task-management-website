// ============================================================
// views/monthly.js — Lịch Tháng
// ============================================================

import { state } from '../state.js';
import { stringToColor, formatDate, getRandomPastelColor, escapeHtml } from '../utils.js';

export function renderMonthlyView() {
    const container = document.getElementById('monthly-view-container');
    container.classList.remove('hidden');

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    container.innerHTML = `
        <div class="bg-white rounded-lg shadow-sm">
            <div class="p-4 flex justify-between items-center border-b border-gray-200">
                <button id="prev-month" class="p-2 rounded-md hover:bg-gray-100"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button>
                <h2 class="text-xl font-semibold">${firstDayOfMonth.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}</h2>
                <button id="next-month" class="p-2 rounded-md hover:bg-gray-100"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></button>
            </div>
            <div class="month-grid">
                ${['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'].map(day => `<div class="p-2 text-center font-semibold text-sm text-gray-600">${day}</div>`).join('')}
                ${Array(startDayOfWeek).fill('').map(() => `<div class="month-day other-month"></div>`).join('')}
                ${Array.from({ length: daysInMonth }, (_, i) => renderMonthDay(i + 1, month, year)).join('')}
            </div>
        </div>`;

    // Thêm task vào các ô ngày
    state.tasksCache.forEach(task => {
        const dateParts = task.due_date.split('-').map(Number);
        const taskDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        if (taskDate.getFullYear() !== year || taskDate.getMonth() !== month) return;

        const day = taskDate.getDate();
        const dayTasksContainer = container.querySelector(`.month-day[data-day="${day}"] .month-day-tasks`);
        if (dayTasksContainer) {
            const avatarHTML = task.assigned_to_name
                ? `<div class="avatar text-white flex-shrink-0" style="width:14px; height:14px; font-size:0.6rem; background-color: ${stringToColor(task.assigned_to_email)}" title="${escapeHtml(task.assigned_to_name)}">${escapeHtml(task.assigned_to_name.charAt(0))}</div>`
                : '';
            const statusIndicator = getTaskMonthStatusIndicator(task);
            dayTasksContainer.innerHTML += `
                <div class="month-task-item text-xs p-1 rounded bg-white/60 flex items-center gap-1.5 task-item-clickable" title="${escapeHtml(task.content)}" data-task-id="${task.id}">
                    ${avatarHTML}
                    <div class="flex-shrink-0" title="${statusIndicator.title}">${statusIndicator.iconHTML}</div>
                    <span class="truncate">${escapeHtml(task.content)}</span>
                </div>`;
        }
    });

    document.getElementById('prev-month').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        if (state.renderCurrentView) state.renderCurrentView();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        if (state.renderCurrentView) state.renderCurrentView();
    });
}

function renderMonthDay(day, month, year) {
    const today = new Date();
    let dayClasses = 'month-day p-2 flex flex-col';
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dayClasses += ' ring-2 ring-indigo-500 z-10';
    }
    return `
        <div class="${dayClasses}" data-day="${day}" style="background-color: ${getRandomPastelColor()};">
            <span class="font-medium ${day === today.getDate() && month === today.getMonth() ? 'text-indigo-600' : ''}">${day}</span>
            <div class="month-day-tasks mt-1 space-y-1 pr-1"></div>
        </div>`;
}

function getTaskMonthStatusIndicator(task) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateParts = task.due_date.split('-').map(Number);
    const dueDate = new Date(dueDateParts[0], dueDateParts[1] - 1, dueDateParts[2]);
    dueDate.setHours(0, 0, 0, 0);

    if (task.is_completed) {
        const completedDate = new Date(task.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        if (completedDate < dueDate) return { title: 'Hoàn thành sớm hạn', iconHTML: `<svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>` };
        if (completedDate > dueDate) return { title: 'Hoàn thành trễ hạn', iconHTML: `<svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.01-1.742 3.01H4.42c-1.53 0-2.493-1.676-1.743-3.01l5.58-9.92zM10 5a1 1 0 011 1v3a1 1 0 11-2 0V6a1 1 0 011-1zm1 5a1 1 0 10-2 0v2a1 1 0 102 0v-2z" clip-rule="evenodd"></path></svg>` };
        return { title: 'Hoàn thành đúng hạn', iconHTML: `<svg class="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>` };
    }
    if (dueDate < today) return { title: 'Quá hạn', iconHTML: `<svg class="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>` };
    if (task.status === 'Đang làm') return { title: 'Đang làm', iconHTML: `<svg class="w-3 h-3 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="6"/></svg>` };
    return { title: 'Cần làm', iconHTML: `<svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9v2h2V9H9z" clip-rule="evenodd"></path></svg>` };
}
