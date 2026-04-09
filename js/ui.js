// ============================================================
// ui.js — Các hàm UI dùng chung: modal, loading spinner
// ============================================================

const modalsContainer = document.getElementById('modals-container');

const ALL_VIEW_IDS = [
    'weekly-view-container', 'monthly-view-container', 'dashboard-view-container',
    'kanban-view-container', 'list-view-container', 'members-view-container',
    'reports-view-container', 'search-and-filter-container'
];

export function showLoading() {
    document.getElementById('loading-spinner').classList.remove('hidden');
    ALL_VIEW_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

export function hideLoading() {
    document.getElementById('loading-spinner').classList.add('hidden');
}

export function showModal(title, bodyHTML, footerHTML) {
    const modalId = `modal-${Date.now()}`;
    const modalElement = document.createElement('div');
    modalElement.id = modalId;
    modalElement.className = 'fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4';
    modalElement.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all glass-effect">
            <div class="flex justify-between items-center p-4 border-b">
                <h3 class="text-lg font-semibold">${title}</h3>
                <button class="p-1 rounded-full hover:bg-gray-200/50" data-close-modal="${modalId}">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-6 modal-body max-h-[70vh] overflow-y-auto">${bodyHTML}</div>
            <div class="p-4 bg-gray-50/50 border-t flex justify-end items-center">${footerHTML}</div>
        </div>`;
    modalsContainer.appendChild(modalElement);
    return modalElement;
}

export function setupModalEvents(modalElement) {
    const modalId = modalElement.id;
    const closeModal = () => modalElement.remove();
    modalElement.querySelector(`[data-close-modal="${modalId}"]`).addEventListener('click', closeModal);
    return closeModal;
}
