class AuthManager {
    constructor() {
        // this.baseUrl = 'https://api.mockapi.io/v1'; // Mock API
        this.tokenKey = 'pwa_crm_token';
        this.userKey = 'pwa_crm_user';
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // this.init();
        this.checkAuth();
    }
    
    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupPasswordToggle();
    }
    
    checkAuth() {
        const token = localStorage.getItem(this.tokenKey);
        const user = localStorage.getItem(this.userKey);
        
        if (token && user) {
            this.isAuthenticated = true;
            this.currentUser = JSON.parse(user);
            
            // Перенаправляем в dashboard если уже авторизован
            if (!window.location.pathname.includes('dashboard')) {
                window.location.href = 'dashboard.html';
            }
        }
        
        this.updateUI();
    }
    
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        const forgotPassword = document.getElementById('forgotPassword');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }
    }
    
    setupPasswordToggle() {
        const showPassword = document.getElementById('showPassword');
        if (showPassword) {
            showPassword.addEventListener('change', (e) => {
                const passwordInput = document.getElementById('password');
                passwordInput.type = e.target.checked ? 'text' : 'password';
            });
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked;
        
        this.showLoading(true);
        
        try {
            // Здесь будет реальный запрос к API
            // Для демо используем моковые данные
            await this.mockLogin(email, password);
            
            // Сохраняем токен и пользователя
            const token = this.generateToken();
            const user = {
                id: '1',
                email: email,
                name: email.split('@')[0],
                role: email.includes('admin') ? 'admin' : 'manager',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=4a90e2&color=fff`
            };
            
            localStorage.setItem(this.tokenKey, token);
            localStorage.setItem(this.userKey, JSON.stringify(user));
            
            if (rememberMe) {
                localStorage.setItem('pwa_crm_remember', 'true');
            }
            
            this.isAuthenticated = true;
            this.currentUser = user;
            
            this.showNotification('Вход выполнен успешно!', 'success');
            
            // Перенаправляем на dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async mockLogin(email, password) {
        // Имитация запроса к API
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Моковые пользователи для демо
                const mockUsers = {
                    'admin@test.com': { password: 'admin123', role: 'admin' },
                    'manager@test.com': { password: 'manager123', role: 'manager' },
                    'user@test.com': { password: 'user123', role: 'user' }
                };
                
                if (mockUsers[email] && mockUsers[email].password === password) {
                    resolve({
                        token: 'mock-jwt-token',
                        user: {
                            email: email,
                            role: mockUsers[email].role
                        }
                    });
                } else {
                    reject(new Error('Неверный email или пароль'));
                }
            }, 1000);
        });
    }
    
    generateToken() {
        return 'mock-jwt-token-' + Date.now() + '-' + Math.random().toString(36).substr(2);
    }
    
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.isAuthenticated = false;
        this.currentUser = null;
        
        window.location.href = 'index.html';
    }
    
    async handleForgotPassword() {
        const email = prompt('Введите ваш email для восстановления пароля:');
        if (!email) return;
        
        if (!this.validateEmail(email)) {
            this.showNotification('Введите корректный email', 'error');
            return;
        }
        
        try {
            // Имитация отправки письма
            await new Promise(resolve => setTimeout(resolve, 1500));
            this.showNotification('Инструкции отправлены на ваш email', 'success');
        } catch (error) {
            this.showNotification('Ошибка при отправке письма', 'error');
        }
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showLoading(show) {
        const loginText = document.getElementById('loginText');
        const loginLoading = document.getElementById('loginLoading');
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        
        if (loginText && loginLoading && submitBtn) {
            if (show) {
                loginText.classList.add('hidden');
                loginLoading.classList.remove('hidden');
                submitBtn.disabled = true;
            } else {
                loginText.classList.remove('hidden');
                loginLoading.classList.add('hidden');
                submitBtn.disabled = false;
            }
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    updateUI() {
        const connectionStatus = document.getElementById('connectionStatus');
        const appStatus = document.getElementById('appStatus');
        
        if (connectionStatus) {
            connectionStatus.textContent = navigator.onLine ? 
                '● Онлайн' : '● Оффлайн';
            connectionStatus.className = navigator.onLine ? 
                'status-online' : 'status-offline';
        }
        
        if (appStatus) {
            appStatus.textContent = this.isAuthenticated ? 
                `Авторизован как ${this.currentUser?.email}` : 
                'Не авторизован';
        }
    }
    
    // Middleware для проверки авторизации
    requireAuth() {
        if (!this.isAuthenticated) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
    
    // Проверка ролей
    hasRole(role) {
        if (!this.currentUser) return false;
        return this.currentUser.role === role;
    }
    
    // Проверка разрешений
    can(permission) {
        const permissions = {
            admin: ['view_dashboard', 'view_admin', 'manage_users', 'manage_data'],
            manager: ['view_dashboard', 'manage_data'],
            user: ['view_dashboard']
        };
        
        return permissions[this.currentUser?.role]?.includes(permission) || false;
    }
}

// Инициализация AuthManager
const auth = new AuthManager();

// Если используется модульная система
if (typeof module !== 'undefined' && module.exports) {
    module.exports = auth;
}

// Делаем доступным глобально
window.auth = auth;