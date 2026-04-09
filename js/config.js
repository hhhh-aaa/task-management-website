// ============================================================
// config.js — Hằng số toàn ứng dụng (không thay đổi runtime)
// ============================================================

export const PRIORITIES = {
    'Cao': 'bg-red-100 text-red-800',
    'Trung bình': 'bg-yellow-100 text-yellow-800',
    'Thấp': 'bg-blue-100 text-blue-800'
};

export const DEFAULT_CATEGORIES = ['Chung', 'Công việc', 'Cá nhân', 'Học tập', 'Dự án'];

export const STATUSES = ['Cần làm', 'Đang làm', 'Hoàn thành', 'Tạm dừng'];

export const STATUS_COLORS = {
    'Cần làm': 'bg-red-200 text-red-800',
    'Đang làm': 'bg-orange-200 text-orange-800',
    'Hoàn thành': 'bg-green-200 text-green-800',
    'Tạm dừng': 'bg-gray-200 text-gray-800'
};

export const STATUS_CHART_COLORS = {
    'Cần làm': '#fca5a5',
    'Đang làm': '#fdba74',
    'Hoàn thành': '#86efac',
    'Tạm dừng': '#d1d5db'
};

export const PRIORITY_COLORS = {
    'Cao': '#ef4444',
    'Trung bình': '#f59e0b',
    'Thấp': '#3b82f6'
};

export const CATEGORY_COLORS = ['#6366f1', '#38bdf8', '#34d399', '#facc15', '#a855f7', '#ec4899'];

export const KANBAN_COLUMN_COLORS = {
    'Cần làm': 'bg-red-50/70 border border-red-200/80',
    'Đang làm': 'bg-orange-50/70 border border-orange-200/80',
    'Hoàn thành': 'bg-green-50/70 border border-green-200/80',
    'Tạm dừng': 'bg-gray-100/80 border border-gray-200/80'
};
