// ============================================================
// filters.js — Lọc dữ liệu và render bộ lọc trên UI
// ============================================================

import { state } from './state.js';
import { PRIORITIES } from './config.js';

export function getFilteredTasksFromCache() {
    return state.tasksCache.filter(task => {
        const priorityMatch = state.currentFilters.priority === 'all' || task.priority === state.currentFilters.priority;
        const categoryMatch = state.currentFilters.category === 'all' || task.category === state.currentFilters.category;

        let personMatch = true;
        if (state.currentFilters.person === 'unassigned') {
            personMatch = !task.assigned_to_email;
        } else if (state.currentFilters.person !== 'all') {
            personMatch = task.assigned_to_email === state.currentFilters.person;
        }

        const searchMatch = state.searchTerm === '' ||
            (task.content && task.content.toLowerCase().includes(state.searchTerm.toLowerCase()));

        return priorityMatch && categoryMatch && personMatch && searchMatch;
    });
}

export function renderFilters() {
    const priorityFilter = document.getElementById('priority-filter');
    priorityFilter.innerHTML = `<option value="all">Tất cả</option>` +
        Object.keys(PRIORITIES).map(p =>
            `<option value="${p}" ${state.currentFilters.priority === p ? 'selected' : ''}>${p}</option>`
        ).join('');

    const uniqueCategories = [...new Set(state.tasksCache.map(t => t.category).filter(Boolean))];
    state.categories = [...new Set([...state.categories, ...uniqueCategories])];

    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.innerHTML = `<option value="all">Tất cả</option>` +
        state.categories.map(c =>
            `<option value="${c}" ${state.currentFilters.category === c ? 'selected' : ''}>${c}</option>`
        ).join('');

    const personFilter = document.getElementById('person-filter');
    const allUsers = [state.userProfile, ...state.teamMembers];
    personFilter.innerHTML = `<option value="all">Tất cả</option>` +
        `<option value="unassigned">Chưa giao</option>` +
        allUsers.map(u =>
            `<option value="${u.email}" ${state.currentFilters.person === u.email ? 'selected' : ''}>${u.name}</option>`
        ).join('');
}
