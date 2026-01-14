class PWAApp {
    constructor() {
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.installPromptShown = false;
        
        this.init();
    }
    
    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupNetworkListeners();
        this.checkDisplayMode();
        this.setupGlobalEventListeners();
        
        console.log('PWA App инициализирован');
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('ServiceWorker зарегистрирован:', registration);
                        
                        // Проверяем обновления
                        registration.onupdatefound = () => {
                            const installingWorker = registration.installing;
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        // Новый контент доступен
                                        this.showUpdateNotification();
                                    } else {
                                        // Контент закэширован для оффлайн использования
                                        console.log('Контент кэширован для оффлайн использования');
                                    }
                                }
                            };
                        };
                    })
                    .catch(error => {
                        console.error('Ошибка регистрации ServiceWorker:', error);
                    });
            });
        }
    }
    
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('beforeinstallprompt сработал');
            
            // Предотвращаем автоматический показ prompt
            e.preventDefault();
            
            // Сохраняем событие для использования позже
            this.deferredPrompt = e;
            
            // Показываем кнопку установки на всех страницах
            this.showInstallButton();
            
            // Показываем баннер установки (один раз)
            if (!this.installPromptShown) {
                this.showInstallBanner();
                this.installPromptShown = true;
            }
            
            // Обновляем статус установки
            this.updateInstallStatus('Доступна установка');
        });
        
        // Событие после установки
        window.addEventListener('appinstalled', () => {
            console.log('PWA установлено на устройство');
            this.updateInstallStatus('Установлено');
            this.hideInstallButton();
            
            // Отправляем аналитику
            this.sendAnalytics('app_installed');
        });
    }
    
    showInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.classList.remove('hidden');
            installBtn.addEventListener('click', () => this.showInstallPrompt());
        }
    }
    
    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.classList.add('hidden');
        }
    }
    
    async showInstallPrompt() {
        if (!this.deferredPrompt) {
            console.log('Установка уже выполнена или недоступна');
            return;
        }
        
        console.log('Показываем установочный prompt');
        
        // Показываем prompt
        this.deferredPrompt.prompt();
        
        // Ждем результата выбора пользователя
        const choiceResult = await this.deferredPrompt.userChoice;
        
        console.log(`Пользователь ${choiceResult.outcome} установку`);
        
        if (choiceResult.outcome === 'accepted') {
            console.log('Пользователь принял установку');
            this.showNotification('Приложение будет установлено на ваше устройство', 'success');
        } else {
            console.log('Пользователь отклонил установку');
            this.showNotification('Вы можете установить приложение позже через меню', 'info');
        }
        
        // Очищаем deferredPrompt
        this.deferredPrompt = null;
    }
    
    showInstallBanner() {
        // Проверяем, не показывали ли уже баннер
        if (localStorage.getItem('pwa_install_banner_shown')) {
            return;
        }
        
        // Проверяем, установлено ли уже приложение
        if (this.isInStandaloneMode()) {
            return;
        }
        
        // Создаем баннер установки
        const banner = document.createElement('div');
        banner.className = 'install-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <div class="banner-icon">📱</div>
                <div class="banner-text">
                    <h4>Установить PWA CRM</h4>
                    <p>Для быстрого доступа и оффлайн-работы</p>
                </div>
                <div class="banner-actions">
                    <button class="btn btn-sm btn-primary install-now">Установить</button>
                    <button class="btn btn-sm btn-outline install-later">Позже</button>
                </div>
                <button class="btn-close">×</button>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Добавляем стили если их еще нет
        if (!document.querySelector('#install-banner-styles')) {
            const style = document.createElement('style');
            style.id = 'install-banner-styles';
            style.textContent = `
                .install-banner {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                    padding: 15px;
                    z-index: 9999;
                    animation: slideUp 0.4s ease;
                    border: 1px solid #e0e0e0;
                }
                
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .banner-content {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .banner-icon {
                    font-size: 32px;
                    flex-shrink: 0;
                }
                
                .banner-text {
                    flex: 1;
                }
                
                .banner-text h4 {
                    margin: 0 0 5px 0;
                    color: #333;
                }
                
                .banner-text p {
                    margin: 0;
                    color: #666;
                    font-size: 14px;
                }
                
                .banner-actions {
                    display: flex;
                    gap: 10px;
                    flex-shrink: 0;
                }
                
                .btn-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #999;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                
                .btn-close:hover {
                    background: #f5f5f5;
                    color: #333;
                }
                
                @media (max-width: 768px) {
                    .install-banner {
                        left: 10px;
                        right: 10px;
                        bottom: 10px;
                    }
                    
                    .banner-content {
                        flex-wrap: wrap;
                    }
                    
                    .banner-actions {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Обработчики событий
        banner.querySelector('.install-now').addEventListener('click', () => {
            this.showInstallPrompt();
            this.closeBanner(banner);
        });
        
        banner.querySelector('.install-later').addEventListener('click', () => {
            this.closeBanner(banner);
        });
        
        banner.querySelector('.btn-close').addEventListener('click', () => {
            this.closeBanner(banner);
        });
        
        // Автоматическое закрытие через 15 секунд
        setTimeout(() => {
            if (document.body.contains(banner)) {
                this.closeBanner(banner);
            }
        }, 15000);
    }
    
    closeBanner(banner) {
        banner.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(banner)) {
                banner.remove();
            }
        }, 300);
        
        // Сохраняем в localStorage, что показывали баннер
        localStorage.setItem('pwa_install_banner_shown', 'true');
        
        // Добавляем стиль для закрытия
        if (!document.querySelector('#slide-down-animation')) {
            const style = document.createElement('style');
            style.id = 'slide-down-animation';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            this.showNotification('Соединение восстановлено', 'success');
            
            // Синхронизируем данные при восстановлении соединения
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
            this.showNotification('Вы в оффлайн-режиме', 'warning');
        });
        
        // Инициализируем статус
        this.updateConnectionStatus();
    }
    
    updateConnectionStatus() {
        const statusElements = document.querySelectorAll('.connection-status, #connectionStatus');
        statusElements.forEach(element => {
            if (this.isOnline) {
                element.textContent = '● Онлайн';
                element.className = element.className.replace(/(^|\s)status-offline(\s|$)/, ' status-online ');
            } else {
                element.textContent = '● Оффлайн';
                element.className = element.className.replace(/(^|\s)status-online(\s|$)/, ' status-offline ');
            }
        });
    }
    
    updateInstallStatus(status) {
        const statusElement = document.getElementById('installStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    checkDisplayMode() {
        if (this.isInStandaloneMode()) {
            console.log('Запущено как установленное приложение');
            document.documentElement.classList.add('standalone-mode');
            
            // Можно добавить специфичные действия для standalone режима
            if (typeof auth !== 'undefined' && auth.currentUser) {
                this.sendAnalytics('app_launched_standalone', {
                    user: auth.currentUser.email,
                    role: auth.currentUser.role
                });
            }
        } else {
            console.log('Запущено в браузере');
            document.documentElement.classList.add('browser-mode');
        }
    }
    
    isInStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }
    
    async syncOfflineData() {
        // Проверяем наличие данных для синхронизации
        const pendingActions = JSON.parse(localStorage.getItem('pwa_pending_actions') || '[]');
        
        if (pendingActions.length > 0) {
            this.showNotification(`Синхронизация ${pendingActions.length} действий...`, 'info');
            
            try {
                // Здесь будет реальная синхронизация с сервером
                // Для демо просто очищаем pending actions
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                localStorage.removeItem('pwa_pending_actions');
                this.showNotification('Данные синхронизированы', 'success');
                
            } catch (error) {
                console.error('Ошибка синхронизации:', error);
                this.showNotification('Ошибка синхронизации', 'error');
            }
        }
    }
    
    showUpdateNotification() {
        // Создаем уведомление об обновлении
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <p>Доступна новая версия приложения!</p>
                <div class="update-actions">
                    <button class="btn btn-sm btn-primary update-now">Обновить</button>
                    <button class="btn btn-sm btn-outline update-later">Позже</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Стили для уведомления об обновлении
        if (!document.querySelector('#update-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'update-notification-styles';
            style.textContent = `
                .update-notification {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 25px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    z-index: 10000;
                    animation: slideDownUpdate 0.3s ease;
                }
                
                @keyframes slideDownUpdate {
                    from {
                        transform: translate(-50%, -100%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                }
                
                .update-content {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                
                .update-content p {
                    margin: 0;
                    font-weight: 600;
                }
                
                .update-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .update-actions .btn {
                    padding: 8px 16px;
                    font-size: 14px;
                }
                
                @media (max-width: 768px) {
                    .update-notification {
                        left: 20px;
                        right: 20px;
                        transform: none;
                    }
                    
                    .update-content {
                        flex-direction: column;
                        gap: 10px;
                        text-align: center;
                    }
                    
                    .update-actions {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Обработчики событий
        notification.querySelector('.update-now').addEventListener('click', () => {
            window.location.reload();
        });
        
        notification.querySelector('.update-later').addEventListener('click', () => {
            notification.style.animation = 'slideUpUpdate 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        });
        
        // Добавляем анимацию закрытия
        if (!document.querySelector('#slide-up-animation')) {
            const style = document.createElement('style');
            style.id = 'slide-up-animation';
            style.textContent = `
                @keyframes slideUpUpdate {
                    from {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                    to {
                        transform: translate(-50%, -100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showNotification(message, type = 'info') {
        // Универсальная функция для показа уведомлений
        const notification = document.createElement('div');
        notification.className = `global-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Стили для глобальных уведомлений
        if (!document.querySelector('#global-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'global-notification-styles';
            style.textContent = `
                .global-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 25px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    z-index: 9998;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .global-notification.success {
                    background: #4CAF50;
                }
                
                .global-notification.error {
                    background: #f44336;
                }
                
                .global-notification.info {
                    background: #2196F3;
                }
                
                .global-notification.warning {
                    background: #ff9800;
                }
                
                @media (max-width: 768px) {
                    .global-notification {
                        left: 20px;
                        right: 20px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
        
        // Анимация выхода
        if (!document.querySelector('#slide-out-animation')) {
            const style = document.createElement('style');
            style.id = 'slide-out-animation';
            style.textContent = `
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupGlobalEventListeners() {
        // Глобальный обработчик для всех форм
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.method === 'post' && !this.isOnline) {
                e.preventDefault();
                
                // Сохраняем данные формы для оффлайн отправки
                const formData = new FormData(form);
                const action = {
                    type: 'form_submit',
                    formId: form.id || 'unnamed_form',
                    data: Object.fromEntries(formData),
                    timestamp: new Date().toISOString()
                };
                
                this.savePendingAction(action);
                this.showNotification('Данные сохранены для отправки при восстановлении связи', 'info');
                
                // Очищаем форму
                form.reset();
            }
        });
        
        // Перехват ссылок для плавных переходов в PWA
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                this.navigateTo(link.href);
            }
        });
    }
    
    savePendingAction(action) {
        const pendingActions = JSON.parse(localStorage.getItem('pwa_pending_actions') || '[]');
        pendingActions.push(action);
        localStorage.setItem('pwa_pending_actions', JSON.stringify(pendingActions));
    }
    
    navigateTo(url) {
        // Плавный переход между страницами в PWA
        document.body.style.opacity = '0.7';
        document.body.style.transition = 'opacity 0.3s';
        
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    }
    
    sendAnalytics(eventName, data = {}) {
        // Отправка аналитики (упрощенная версия)
        const analyticsData = {
            event: eventName,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            displayMode: this.isInStandaloneMode() ? 'standalone' : 'browser',
            online: this.isOnline,
            ...data
        };
        
        console.log('Analytics:', analyticsData);
        
        // В реальном приложении здесь будет отправка на сервер
        localStorage.setItem(`analytics_${Date.now()}`, JSON.stringify(analyticsData));
        
        // Очищаем старые аналитические данные (больше 100 записей)
        this.cleanupAnalytics();
    }
    
    cleanupAnalytics() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('analytics_'));
        if (keys.length > 100) {
            keys.sort().slice(0, keys.length - 100).forEach(key => {
                localStorage.removeItem(key);
            });
        }
    }
    
    // Полезные утилиты
    static formatDate(date) {
        return new Date(date).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    static async getStorageInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: PWAApp.formatBytes(estimate.usage),
                quota: PWAApp.formatBytes(estimate.quota),
                percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2) + '%'
            };
        }
        return null;
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.pwaApp = new PWAApp();
    
    // Добавляем класс для анимаций при загрузке
    document.body.classList.add('loaded');
    
    // Скрываем preloader если есть
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 300);
        }, 500);
    }
});

// Экспортируем класс для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAApp;
}