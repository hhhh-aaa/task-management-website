// ============================================================
// profile.js — Quản lý hồ sơ người dùng và thành viên nhóm
// ============================================================

import { state } from './state.js';
import { stringToColor } from './utils.js';
import { showModal, setupModalEvents } from './ui.js';
import { authApi } from './api.js';

export function loadUserData() {
    // Profile user lấy từ server (state.userProfile đã được set sau khi đăng nhập)
    // Chỉ cần update UI
    updateProfileUI();
}

export function saveUserData() {
    // Không còn lưu vào localStorage nữa, profile được lưu trên server
}

export function updateProfileUI() {
    const nameDisplay = document.getElementById('user-name-display');
    const avatarDisplay = document.getElementById('user-avatar');
    nameDisplay.textContent = state.userProfile.name || 'Hồ sơ';
    avatarDisplay.textContent = state.userProfile.name ? state.userProfile.name.charAt(0).toUpperCase() : '?';
    avatarDisplay.style.backgroundColor = stringToColor(state.userProfile.email || '');
}

export function openProfileModal() {
    const teamList = state.teamMembers.length
        ? state.teamMembers.map(m => `<li class="text-sm text-gray-700">${m.name} <span class="text-gray-400">(${m.email})</span></li>`).join('')
        : '<li class="text-sm text-gray-400">Chưa có thành viên nào khác.</li>';

    const body = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Tên của bạn</label>
                <input id="profile-name-input" type="text" value="${state.userProfile.name}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Email của bạn</label>
                <input id="profile-email-input" type="email" value="${state.userProfile.email}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
            </div>
            <hr>
            <div>
                <p class="block text-sm font-medium text-gray-700 mb-1">Thành viên nhóm (từ CSDL)</p>
                <ul class="space-y-1 pl-2 list-disc list-inside">${teamList}</ul>
                <p class="text-xs text-gray-400 mt-1">Thành viên mới đăng ký tài khoản sẽ tự động xuất hiện ở đây.</p>
            </div>
        </div>`;

    const footer = `
        <button id="open-settings-btn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300">Cài đặt</button>
        <button id="logout-btn" class="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600">Đăng xuất</button>
        <button id="save-profile-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">Lưu thay đổi</button>`;

    const modalElement = showModal('Hồ sơ & Quản lý Nhóm', body, footer);
    const closeModal = setupModalEvents(modalElement);

    modalElement.querySelector('#open-settings-btn').addEventListener('click', () => {
        closeModal();
        openSettingsModal();
    });

    modalElement.querySelector('#logout-btn').addEventListener('click', async () => {
        if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
        try {
            await authApi.logout();
        } catch (e) { /* bỏ qua lỗi mạng */ }
        location.reload();
    });

    modalElement.querySelector('#save-profile-btn').addEventListener('click', async () => {
        const name  = modalElement.querySelector('#profile-name-input').value.trim();
        const email = modalElement.querySelector('#profile-email-input').value.trim();
        if (!name || !email) {
            alert('Tên và Email của bạn không được để trống.');
            return;
        }

        try {
            const { user } = await authApi.updateProfile(name, email);
            state.userProfile.name  = user.name;
            state.userProfile.email = user.email;
            updateProfileUI();
            if (state.renderCurrentView) state.renderCurrentView();
            closeModal();
        } catch (err) {
            alert('Lỗi cập nhật hồ sơ: ' + err.message);
        }
    });
}

export function openSettingsModal() {
    const body = `
        <div class="space-y-4">
            <h4 class="text-lg font-semibold text-red-600">Khu vực nguy hiểm</h4>
            <p class="text-sm text-gray-600">Các hành động sau đây không thể hoàn tác. Hãy chắc chắn trước khi tiếp tục.</p>
            <div>
                <button id="delete-all-data-btn" class="w-full px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700">Xóa Toàn Bộ Dữ Liệu</button>
                <p class="text-xs text-gray-500 mt-1">Thao tác này sẽ xóa vĩnh viễn tất cả công việc trong cơ sở dữ liệu (chỉ admin mới dùng được).</p>
            </div>
        </div>`;

    const modalElement = showModal('Cài đặt Nâng cao', body, '');
    const closeModal = setupModalEvents(modalElement);

    modalElement.querySelector('#delete-all-data-btn').addEventListener('click', async () => {
        const confirmation = prompt('HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC.\nTất cả công việc sẽ bị xóa vĩnh viễn cho TẤT CẢ NGƯỜI DÙNG.\n\nGõ "xóa tất cả" để xác nhận.');
        if (confirmation === 'xóa tất cả') {
            try {
                await authApi.truncateTasks();
                state.tasksCache = [];
                alert('Toàn bộ dữ liệu đã được xóa thành công.');
                closeModal();
                if (state.renderCurrentView) state.renderCurrentView();
            } catch (err) {
                alert('Đã xảy ra lỗi: ' + err.message);
            }
        } else {
            alert('Hành động đã được hủy.');
        }
    });
}
