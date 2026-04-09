// ============================================================
// tasks.js — CRUD công việc: thêm, sửa, xóa, modal danh sách
// ===============================================================..
// Feature: Task CRUD implementation
// Added create, update, delete functions
// Demo for report
import { state } from './state.js';
import { PRIORITIES, STATUSES, STATUS_COLORS } from './config.js';
import { formatDate, stringToColor, escapeHtml } from './utils.js';
import { showModal, setupModalEvents } from './ui.js';
import { tasksApi } from './api.js';

// ——— Modal danh sách (dùng chung bởi dashboard và báo cáo) ———

export function openEarlyCompletionModal(tasks) {
    const title = 'Danh sách công việc hoàn thành sớm hạn';
    let bodyHTML;

    if (!tasks || tasks.length === 0) {
        bodyHTML = '<p class="text-gray-500 text-center py-4">Không có công việc nào.</p>';
    } else {
        bodyHTML = '<div class="space-y-3">' + tasks.map(task => {
            const dateParts = task.due_date.split('-').map(Number);
            const dueDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const completedDate = new Date(task.completed_at);
            const assignedUserHTML = task.assigned_to_name
                ? `<div class="flex items-center gap-1.5"><div class="avatar" style="background-color: ${stringToColor(task.assigned_to_email)}" title="${task.assigned_to_name}">${task.assigned_to_name.charAt(0)}</div><span>${task.assigned_to_name}</span></div>`
                : '<span>-</span>';
            return `
                <div class="p-3 bg-white/60 rounded-lg border border-gray-200/80">
                    <p class="font-semibold text-gray-800">${escapeHtml(task.content)}</p>
                    <div class="mt-2 pt-2 border-t border-gray-200/60 text-xs text-gray-500 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div><strong>Người phụ trách:</strong> ${assignedUserHTML}</div>
                        <div class="flex items-center gap-1"><strong>Hoàn thành:</strong> <span class="text-green-600 font-medium">${completedDate.toLocaleDateString('vi-VN')}</span></div>
                        <div class="flex items-center gap-1"><strong>Hết hạn:</strong> <span class="font-medium">${dueDate.toLocaleDateString('vi-VN')}</span></div>
                    </div>
                </div>`;
        }).join('') + '</div>';
    }
    const modalElement = showModal(title, bodyHTML, '');
    setupModalEvents(modalElement);
}

export function openListTasksModal(tasks, title) {
    let bodyHTML;
    if (!tasks || tasks.length === 0) {
        bodyHTML = '<p class="text-gray-500 text-center py-4">Không có công việc nào trong danh sách này.</p>';
    } else {
        bodyHTML = '<div class="space-y-3">' + tasks.map(task => {
            const dateParts = task.due_date.split('-').map(Number);
            const dueDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const statusClass = STATUS_COLORS[task.status] || STATUS_COLORS['Cần làm'];
            const assignedUserHTML = task.assigned_to_name
                ? `<div class="flex items-center gap-1.5"><div class="avatar" style="background-color: ${stringToColor(task.assigned_to_email)}" title="${task.assigned_to_name}">${task.assigned_to_name.charAt(0)}</div><span>${task.assigned_to_name}</span></div>`
                : '<span>-</span>';
            return `
                <div class="p-3 bg-white/60 rounded-lg border border-gray-200/80">
                    <p class="font-semibold text-gray-800 ${task.is_completed ? 'line-through text-gray-400' : ''}">${escapeHtml(task.content)}</p>
                    <div class="mt-2 pt-2 border-t border-gray-200/60 text-xs text-gray-500 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div><strong>Người phụ trách:</strong> ${assignedUserHTML}</div>
                        <div><strong>Trạng thái:</strong> <span class="status-badge ${statusClass}">${task.status || 'Cần làm'}</span></div>
                        <div><strong>Hết hạn:</strong> <span class="font-medium">${dueDate.toLocaleDateString('vi-VN')}</span></div>
                    </div>
                </div>`;
        }).join('') + '</div>';
    }
    const modalElement = showModal(title, bodyHTML, '');
    setupModalEvents(modalElement);
}

// ——— Thêm công việc mới ———

export function openAddTaskModal(dueDate = '') {
    const allUsers = [state.userProfile, ...state.teamMembers];
    const body = `
        <div class="space-y-4">
            <div>
                <label for="task-content-input" class="block text-sm font-medium text-gray-700">Tên công việc</label>
                <input type="text" id="task-content-input" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="VD: Hoàn thành báo cáo...">
            </div>
            <div>
                <label for="task-due-date-input" class="block text-sm font-medium text-gray-700">Ngày hết hạn</label>
                <input type="date" id="task-due-date-input" value="${dueDate || formatDate(new Date())}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
            </div>
            <div>
                <label for="task-assign-to" class="block text-sm font-medium text-gray-700">Giao cho</label>
                <select id="task-assign-to" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                    <option value="">-- Chọn thành viên --</option>
                    ${allUsers.map(u => `<option value="${u.email}">${u.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label for="task-priority-select" class="block text-sm font-medium text-gray-700">Mức độ ưu tiên</label>
                <select id="task-priority-select" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                    ${Object.keys(PRIORITIES).map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
            </div>
            <div>
                <label for="task-category-select" class="block text-sm font-medium text-gray-700">Danh mục</label>
                <select id="task-category-select" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                    ${state.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
        </div>`;

    const footer = `
        <button class="cancel-btn px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">Hủy</button>
        <button class="save-task-btn px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">Lưu công việc</button>`;

    const modalElement = showModal('Thêm công việc mới', body, footer);
    const closeModal = setupModalEvents(modalElement);

    modalElement.querySelector('.cancel-btn').addEventListener('click', closeModal);
    modalElement.querySelector('.save-task-btn').addEventListener('click', async () => {
        const content = modalElement.querySelector('#task-content-input').value.trim();
        const dueDateValue = modalElement.querySelector('#task-due-date-input').value;
        if (!content) { alert('Vui lòng nhập tên công việc.'); return; }
        if (!dueDateValue) { alert('Vui lòng chọn ngày hết hạn.'); return; }

        const assignedToEmail = modalElement.querySelector('#task-assign-to').value;
        const assignedToUser = allUsers.find(u => u.email === assignedToEmail);

        const taskData = {
            content: content,
            due_date: dueDateValue,
            priority: modalElement.querySelector('#task-priority-select').value,
            category: modalElement.querySelector('#task-category-select').value,
            status: 'Cần làm',
            is_completed: false,
            assigned_to_email: assignedToUser ? assignedToUser.email : null,
            assigned_to_name: assignedToUser ? assignedToUser.name : null,
        };

        const saveBtn = modalElement.querySelector('.save-task-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu...';

        try {
            const data = await tasksApi.create(taskData);
            state.tasksCache.push(data);
            if (state.renderCurrentView) state.renderCurrentView();
            closeModal();
        } catch (err) {
            alert('Lỗi: ' + err.message);
            saveBtn.disabled = false;
            saveBtn.textContent = 'Lưu công việc';
        }
    });
}

// ——— Sửa / Xóa công việc ———

export function openEditTaskModal(taskId) {
    const task = state.tasksCache.find(t => t.id == taskId);
    if (!task) {
        alert('Không thể tìm thấy công việc.');
        return;
    }

    const allUsers = [state.userProfile, ...state.teamMembers];
    const body = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Tên công việc</label>
                <input type="text" id="edit-task-content" value="${escapeHtml(task.content)}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Ngày hết hạn</label>
                    <input type="date" id="edit-task-due-date" value="${task.due_date}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Giao cho</label>
                    <select id="edit-task-assign-to" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        <option value="">-- Bỏ trống --</option>
                        ${allUsers.map(u => `<option value="${u.email}" ${task.assigned_to_email === u.email ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Ưu tiên</label>
                    <select id="edit-task-priority" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        ${Object.keys(PRIORITIES).map(p => `<option value="${p}" ${task.priority === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Trạng thái</label>
                    <select id="edit-task-status" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        ${STATUSES.map(s => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Danh mục</label>
                <input type="text" id="edit-task-category" value="${escapeHtml(task.category || '')}" list="category-datalist" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                <datalist id="category-datalist">${state.categories.map(c => `<option value="${c}">`).join('')}</datalist>
            </div>
        </div>`;

    const footer = `
        <button id="delete-task-btn" class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">Xóa công việc</button>
        <button id="update-task-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">Lưu thay đổi</button>`;

    const modalElement = showModal('Chi tiết công việc', body, footer);
    const closeModal = setupModalEvents(modalElement);

    modalElement.querySelector('#update-task-btn').addEventListener('click', async () => {
        const content = modalElement.querySelector('#edit-task-content').value.trim();
        if (!content) { alert('Tên công việc không được để trống.'); return; }

        const assignedToEmail = modalElement.querySelector('#edit-task-assign-to').value;
        const assignedToUser = allUsers.find(u => u.email === assignedToEmail);
        const newStatus = modalElement.querySelector('#edit-task-status').value;

        const updatedData = {
            content: content,
            due_date: modalElement.querySelector('#edit-task-due-date').value,
            priority: modalElement.querySelector('#edit-task-priority').value,
            status: newStatus,
            category: modalElement.querySelector('#edit-task-category').value.trim(),
            assigned_to_email: assignedToUser ? assignedToUser.email : null,
            assigned_to_name: assignedToUser ? assignedToUser.name : null,
            is_completed: newStatus === 'Hoàn thành',
            completed_at: newStatus === 'Hoàn thành' ? new Date() : null
        };

        try {
            const data = await tasksApi.update(taskId, updatedData);
            const index = state.tasksCache.findIndex(t => t.id === data.id);
            if (index > -1) state.tasksCache[index] = data;
            if (state.renderCurrentView) state.renderCurrentView();
            closeModal();
        } catch (err) {
            alert('Lỗi khi cập nhật công việc: ' + err.message);
        }
    });

    modalElement.querySelector('#delete-task-btn').addEventListener('click', async () => {
        const confirmed = prompt('Công việc này sẽ bị xóa vĩnh viễn. Gõ "xóa" để xác nhận.');
        if (confirmed === 'xóa') {
            try {
                await tasksApi.delete(taskId);
                state.tasksCache = state.tasksCache.filter(t => t.id !== taskId);
                if (state.renderCurrentView) state.renderCurrentView();
                closeModal();
            } catch (err) {
                alert('Lỗi khi xóa công việc: ' + err.message);
            }
        }
    });
}
