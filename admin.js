// admin.js
class AdminManager {
    constructor() {
        this.auth = auth;
        this.init();
    }
    
    async init() {
        // Проверяем права администратора
        if (!this.auth.requireAuth() || !this.auth.hasRole('admin')) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        this.loadUsers();
        this.setupEventListeners();
    }
    
    async loadUsers() {
        try {
            const users = await this.fetchUsers();
            this.renderUsers(users);
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        }
    }
    
    async fetchUsers() {
        // Имитация API
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: 1, name: 'Админ', email: 'admin@test.com', role: 'admin', status: 'active' },
                    { id: 2, name: 'Менеджер', email: 'manager@test.com', role: 'manager', status: 'active' },
                    { id: 3, name: 'Пользователь', email: 'user@test.com', role: 'user', status: 'inactive' }
                ]);
            }, 500);
        });
    }
    
    renderUsers(users) {
        const container = document.getElementById('usersList');
        if (!container) return;
        
        container.innerHTML = users.map(user => `
            <div class="user-card">
                <div class="user-avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4a90e2&color=fff" alt="${user.name}">
                </div>
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <p>${user.email}</p>
                    <span class="role-badge ${user.role}">${this.getRoleName(user.role)}</span>
                </div>
                <div class="user-actions">
                    <button onclick="admin.editUser(${user.id})" class="btn btn-sm">✏️</button>
                    <button onclick="admin.deleteUser(${user.id})" class="btn btn-sm btn-danger">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    getRoleName(role) {
        const roles = {
            admin: 'Администратор',
            manager: 'Менеджер',
            user: 'Пользователь'
        };
        return roles[role] || role;
    }
    
    editUser(userId) {
        alert(`Редактирование пользователя ${userId}`);
    }
    
    deleteUser(userId) {
        if (confirm('Вы уверены, что хотите удалить пользователя?')) {
            alert(`Пользователь ${userId} удален`);
        }
    }
}

// Глобальная функция для вкладок
function showTab(tabName) {
    // Логика переключения вкладок
}

// Инициализация
const admin = new AdminManager();