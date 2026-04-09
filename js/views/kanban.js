// ============================================================
// views/kanban.js — Bảng Kanban với kéo thả
// ============================================================

import { state } from '../state.js';
import { STATUSES, KANBAN_COLUMN_COLORS, PRIORITY_COLORS } from '../config.js';
import { stringToColor, formatDate, escapeHtml } from '../utils.js';
import { getFilteredTasksFromCache } from '../filters.js';
import { tasksApi } from '../api.js';

export function renderKanbanView() {
    const container = document.getElementById('kanban-view-container');
    container.classList.remove('hidden');

    container.innerHTML = `
        <div id="kanban-columns-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            ${STATUSES.map(status => `
                <div class="rounded-lg p-4 flex flex-col ${KANBAN_COLUMN_COLORS[status] || 'bg-gray-100/80 border border-gray-200/80'}">
                    <h3 class="font-semibold mb-4 text-center">${status}</h3>
                    <div class="kanban-tasks flex-grow space-y-3 overflow-y-auto min-h-[300px]" data-status="${status}"></div>
                </div>`).join('')}
        </div>`;

    const tasks = getFilteredTasksFromCache();
    tasks.forEach(task => {
        const status = task.status || 'Cần làm';
        const column = container.querySelector(`.kanban-tasks[data-status="${status}"]`);
        if (column) column.insertAdjacentHTML('beforeend', renderKanbanTask(task));
    });

    setupKanbanDragAndDrop();
}

function renderKanbanTask(task) {
    const priorityBorder = PRIORITY_COLORS[task.priority] || '#9ca3af';
    const dateParts = task.due_date.split('-').map(Number);
    const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    return `
        <div class="kanban-task bg-white p-3 rounded-md shadow-sm border-l-4 task-item-clickable relative group" style="border-color: ${priorityBorder}" data-task-id="${task.id}">
            <p class="font-medium text-sm mb-2">${escapeHtml(task.content)}</p>
            <div class="flex items-center justify-between text-xs text-gray-500">
                <span>${localDate.toLocaleDateString('vi-VN')}</span>
                ${task.assigned_to_name ? `<div class="avatar" style="background-color: ${stringToColor(task.assigned_to_email)}" title="${escapeHtml(task.assigned_to_name)}">${escapeHtml(task.assigned_to_name.charAt(0))}</div>` : ''}
            </div>
            <button class="edit-task-btn absolute top-1 right-1 p-1 rounded-full bg-white/50 text-gray-500 hover:bg-gray-200/80 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" data-task-id="${task.id}">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg>
            </button>
        </div>`;
}

function setupKanbanDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-tasks');
    columns.forEach(column => {
        new Sortable(column, {
            group: 'kanban',
            animation: 150,
            ghostClass: 'ghost-class',
            onEnd: async function(evt) {
                const taskId = evt.item.dataset.taskId;
                const newStatus = evt.to.dataset.status;
                const isCompleted = newStatus === 'Hoàn thành';
                const updatedData = {
                    status: newStatus,
                    is_completed: isCompleted,
                    completed_at: isCompleted ? new Date() : null
                };
                try {
                    const data = await tasksApi.update(taskId, updatedData);
                    const index = state.tasksCache.findIndex(t => t.id === data.id);
                    if (index > -1) state.tasksCache[index] = data;
                } catch (err) {
                    alert('Lỗi cập nhật trạng thái: ' + err.message);
                    evt.from.appendChild(evt.item);
                }
            },
        });
    });
}
