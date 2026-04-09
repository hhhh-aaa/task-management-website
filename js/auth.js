// ============================================================
// auth.js — Màn hình đăng nhập / đăng ký
// ============================================================

import { state } from './state.js';
import { authApi } from './api.js';

export function showAuthScreen() {
    document.getElementById('app-container').classList.add('hidden');

    const authDiv = document.createElement('div');
    authDiv.id = 'auth-screen';
    authDiv.className = 'min-h-screen flex items-center justify-center p-4';
    authDiv.style.background = 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%)';
    authDiv.innerHTML = `
        <div class="w-full max-w-md">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-indigo-600">Quản lý Công việc 4.0</h1>
                <p class="text-gray-500 mt-2">Đăng nhập để tiếp tục làm việc</p>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-8">
                <div class="flex mb-6 border-b border-gray-200">
                    <button id="tab-login"    class="flex-1 pb-3 font-semibold text-indigo-600 border-b-2 border-indigo-600 transition-colors">Đăng nhập</button>
                    <button id="tab-register" class="flex-1 pb-3 font-semibold text-gray-400 transition-colors">Đăng ký</button>
                </div>

                <!-- Form đăng nhập -->
                <div id="login-form">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Email</label>
                            <input id="login-email" type="email" autocomplete="email"
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="email@example.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Mật khẩu</label>
                            <input id="login-password" type="password" autocomplete="current-password"
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="••••••">
                        </div>
                        <p id="login-error" class="text-red-600 text-sm hidden"></p>
                        <button id="login-btn"
                            class="w-full py-2 px-4 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors">
                            Đăng nhập
                        </button>
                    </div>
                </div>

                <!-- Form đăng ký -->
                <div id="register-form" class="hidden">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Họ và tên</label>
                            <input id="reg-name" type="text"
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="Nguyễn Văn A">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Email</label>
                            <input id="reg-email" type="email"
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="email@example.com">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Mật khẩu <span class="text-gray-400 font-normal">(tối thiểu 6 ký tự)</span></label>
                            <input id="reg-password" type="password"
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="••••••">
                        </div>
                        <p id="register-error" class="text-red-600 text-sm hidden"></p>
                        <button id="register-btn"
                            class="w-full py-2 px-4 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors">
                            Tạo tài khoản
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.appendChild(authDiv);
    setupAuthEvents();
}

function setupAuthEvents() {
    // ——— Chuyển tab ———
    document.getElementById('tab-login').addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-register').addEventListener('click', () => switchTab('register'));

    // ——— Đăng nhập ———
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    ['login-email', 'login-password'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') handleLogin();
        });
    });

    // ——— Đăng ký ———
    document.getElementById('register-btn').addEventListener('click', handleRegister);
    ['reg-name', 'reg-email', 'reg-password'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') handleRegister();
        });
    });
}

function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('login-form').classList.toggle('hidden', !isLogin);
    document.getElementById('register-form').classList.toggle('hidden', isLogin);

    const loginTab    = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    loginTab.className    = `flex-1 pb-3 font-semibold transition-colors ${isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`;
    registerTab.className = `flex-1 pb-3 font-semibold transition-colors ${!isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`;
}

async function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');

    if (!email || !password) {
        showError(errorEl, 'Vui lòng nhập đầy đủ email và mật khẩu.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';
    errorEl.classList.add('hidden');

    try {
        const { user } = await authApi.login(email, password);
        applyUser(user);
        document.getElementById('auth-screen').remove();
        window.dispatchEvent(new CustomEvent('auth:success'));
    } catch (err) {
        showError(errorEl, err.message);
        btn.disabled = false;
        btn.textContent = 'Đăng nhập';
    }
}

async function handleRegister() {
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl  = document.getElementById('register-error');
    const btn      = document.getElementById('register-btn');

    if (!name || !email || !password) {
        showError(errorEl, 'Vui lòng nhập đầy đủ thông tin.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang tạo tài khoản...';
    errorEl.classList.add('hidden');

    try {
        const { user } = await authApi.register(name, email, password);
        applyUser(user);
        document.getElementById('auth-screen').remove();
        window.dispatchEvent(new CustomEvent('auth:success'));
    } catch (err) {
        showError(errorEl, err.message);
        btn.disabled = false;
        btn.textContent = 'Tạo tài khoản';
    }
}

function applyUser(user) {
    state.userProfile = { id: user.id, name: user.name, email: user.email, role: user.role };
}

function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
}
