class DashboardManager {
    // constructor() {
    //     this.auth = auth;
    //     this.apiUrl = 'https://api.mockapi.io/v1';
    //     this.init();
    // }
    constructor() {
        // Проверяем наличие auth
        if (typeof auth === 'undefined') {
            console.error('Auth module not loaded');
            this.showAuthError();
            return;
        }
        
        this.auth = auth;
        this.apiUrl = 'https://api.mockapi.io/v1';
        
        // Проверяем авторизацию
        if (!this.auth.isAuthenticated) {
            console.warn('User not authenticated');
            window.location.href = 'auth.html';
            return;
        }
        
        this.init();
    }
    showAuthError() {
        const errorHtml = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #f44336;">Ошибка авторизации</h2>
                <p>Не удалось загрузить модуль авторизации</p>
                <button onclick="window.location.href='auth.html'" class="btn btn-primary">
                    Перейти на страницу входа
                </button>
            </div>
        `;
        
        document.querySelector('.content-area').innerHTML = errorHtml;
    }

    async init() {
        // Проверяем авторизацию
        if (!this.auth.requireAuth()) return;
        
        this.setupUI();
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupServiceWorker();
        this.checkForUpdates();
    }
    
    setupUI() {
        // Заполняем информацию о пользователе
        document.getElementById('userName').textContent = 
            this.auth.currentUser?.name || 'Пользователь';
        document.getElementById('userEmail').textContent = 
            this.auth.currentUser?.email || 'user@example.com';
        document.getElementById('userRole').textContent = 
            this.getRoleName(this.auth.currentUser?.role);
        document.getElementById('userAvatar').src = 
            this.auth.currentUser?.avatar || 'icons/default-avatar.png';
        
        // Показываем/скрываем админ-меню
        const adminMenuItem = document.getElementById('adminMenuItem');
        if (this.auth.hasRole('admin')) {
            adminMenuItem.style.display = 'block';
        }
        
        // Обновляем статус соединения
        this.updateConnectionStatus();
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());
    }
    
    getRoleName(role) {
        const roles = {
            admin: 'Администратор',
            manager: 'Менеджер',
            user: 'Пользователь'
        };
        return roles[role] || role;
    }
    
    updateConnectionStatus() {
        const statusElement = document.getElementById('dashboardConnectionStatus');
        if (statusElement) {
            statusElement.textContent = navigator.onLine ? '● Онлайн' : '● Оффлайн';
            statusElement.className = navigator.onLine ? 'status-online' : 'status-offline';
        }
    }
    
    setupEventListeners() {
        // Кнопка синхронизации
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncData();
        });
        
        // Уведомления
        document.getElementById('notificationsBtn').addEventListener('click', () => {
            this.toggleNotifications();
        });
        
        // Обработчик установки PWA
        this.setupInstallPrompt();
    }
    
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            const installBtn = document.getElementById('installBtn');
            installBtn.classList.remove('hidden');
            
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('Пользователь установил PWA');
                    installBtn.classList.add('hidden');
                }
                
                deferredPrompt = null;
            });
        });
    }
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker зарегистрирован');
                    
                    // Периодическая синхронизация
                    if ('periodicSync' in registration) {
                        registration.periodicSync.register('sync-data', {
                            minInterval: 24 * 60 * 60 * 1000 // 24 часа
                        });
                    }
                })
                .catch(error => {
                    console.error('Ошибка Service Worker:', error);
                });
            
            // Фоновая синхронизация
            navigator.serviceWorker.ready.then(registration => {
                if ('sync' in registration) {
                    document.getElementById('syncBtn').addEventListener('click', () => {
                        registration.sync.register('sync-data');
                        this.showNotification('Синхронизация начата', 'info');
                    });
                }
            });
        }
    }
    
    async loadDashboardData() {
        try {
            // Загружаем данные с API
            const [projects, tasks, clients, activities] = await Promise.all([
                this.fetchProjects(),
                this.fetchTasks(),
                this.fetchClients(),
                this.fetchActivities()
            ]);
            
            // Обновляем статистику
            document.getElementById('projectsCount').textContent = projects.length;
            document.getElementById('tasksCount').textContent = tasks.length;
            document.getElementById('clientsCount').textContent = clients.length;
            
            // Отображаем активности
            this.renderActivities(activities);
            
            // Сохраняем в IndexedDB для оффлайн доступа
            await this.saveToIndexedDB({ projects, tasks, clients, activities });
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            
            // Пробуем загрузить из IndexedDB
            await this.loadFromIndexedDB();
        }
    }
    
    async fetchProjects() {
        // Имитация API запроса
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: 1, name: 'Проект A', status: 'active', progress: 75 },
                    { id: 2, name: 'Проект B', status: 'active', progress: 40 },
                    { id: 3, name: 'Проект C', status: 'completed', progress: 100 }
                ]);
            }, 500);
        });
    }
    
    async fetchTasks() {
        // Имитация API запроса
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: 1, title: 'Задача 1', priority: 'high', completed: false },
                    { id: 2, title: 'Задача 2', priority: 'medium', completed: true },
                    { id: 3, title: 'Задача 3', priority: 'low', completed: false }
                ]);
            }, 500);
        });
    }
    
    async fetchClients() {
        // Имитация API запроса
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: 1, name: 'Клиент A', email: 'client@a.com', status: 'active' },
                    { id: 2, name: 'Клиент B', email: 'client@b.com', status: 'active' }
                ]);
            }, 500);
        });
    }
    
    async fetchActivities() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: 1, action: 'Создан новый проект', user: 'Иван Иванов', time: '10 минут назад' },
                    { id: 2, action: 'Задача завершена', user: 'Петр Петров', time: '1 час назад' },
                    { id: 3, action: 'Добавлен новый клиент', user: 'Сидор Сидоров', time: '2 часа назад' }
                ]);
            }, 500);
        });
    }
    
    renderActivities(activities) {
        const container = document.getElementById('activitiesList');
        if (!container) return;
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">📝</div>
                <div class="activity-content">
                    <p class="activity-action">${activity.action}</p>
                    <p class="activity-meta">${activity.user} • ${activity.time}</p>
                </div>
            </div>
        `).join('');
    }
    
    async saveToIndexedDB(data) {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) return resolve();
            
            const request = indexedDB.open('PWA_CRM_DB', 2);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                if (!db.objectStoreNames.contains('dashboard')) {
                    db.createObjectStore('dashboard');
                }
                
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(['dashboard'], 'readwrite');
                const store = transaction.objectStore('dashboard');
                
                store.put(data, 'dashboard_data');
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) return resolve();
            
            const request = indexedDB.open('PWA_CRM_DB', 2);
            
            request.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(['dashboard'], 'readonly');
                const store = transaction.objectStore('dashboard');
                const getRequest = store.get('dashboard_data');
                
                getRequest.onsuccess = () => {
                    const data = getRequest.result;
                    if (data) {
                        this.renderActivities(data.activities || []);
                        resolve(data);
                    } else {
                        reject(new Error('Нет данных в IndexedDB'));
                    }
                };
                
                getRequest.onerror = () => reject(getRequest.error);
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async syncData() {
        if (!navigator.onLine) {
            this.showNotification('Нет интернет соединения', 'error');
            return;
        }
        
        this.showNotification('Синхронизация...', 'info');
        
        try {
            // Здесь будет реальная синхронизация с сервером
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await this.loadDashboardData();
            this.showNotification('Данные синхронизированы', 'success');
            
        } catch (error) {
            this.showNotification('Ошибка синхронизации', 'error');
        }
    }
    
    async checkForUpdates() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Новый Service Worker установлен, предлагаем обновить
                        this.showUpdateNotification();
                    }
                });
            });
        }
    }
    
    showUpdateNotification() {
        if (confirm('Доступна новая версия приложения. Обновить?')) {
            window.location.reload();
        }
    }
    
    toggleNotifications() {
        const popup = document.getElementById('notificationsPopup');
        popup.classList.toggle('hidden');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Быстрые действия
    createNewProject() {
        this.showNotification('Функция в разработке', 'info');
    }
    
    createNewTask() {
        this.showNotification('Функция в разработке', 'info');
    }
    
    addNewClient() {
        this.showNotification('Функция в разработке', 'info');
    }
    
    generateReport() {
        this.showNotification('Функция в разработке', 'info');
    }
}

// Глобальные функции
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('collapsed');
}

// Инициализация Dashboard
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});

// Инициализируем после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли доступ к auth
    if (typeof auth !== 'undefined' && auth.isAuthenticated) {
        window.dashboardManager = new DashboardManager();
    } else {
        // Показываем сообщение об ошибке
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="section" style="text-align: center;">
                    <h2>Требуется авторизация</h2>
                    <p>Для доступа к дашборду необходимо войти в систему</p>
                    <button onclick="window.location.href='auth.html'" class="btn btn-primary">
                        Войти в систему
                    </button>
                </div>
            `;
        }
    }
});