class RegisterManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupPasswordStrength();
    }
    
    setupEventListeners() {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        const passwordInput = document.getElementById('regPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.updatePasswordStrength());
        }
    }
    
    setupPasswordStrength() {
        this.passwordStrength = {
            weak: { text: 'Слабый', class: 'weak', width: '25%' },
            medium: { text: 'Средний', class: 'medium', width: '50%' },
            strong: { text: 'Сильный', class: 'strong', width: '75%' },
            veryStrong: { text: 'Очень сильный', class: 'very-strong', width: '100%' }
        };
    }
    
    updatePasswordStrength() {
        const password = document.getElementById('regPassword').value;
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        
        let strength = this.calculatePasswordStrength(password);
        
        strengthBar.style.width = strength.width;
        strengthBar.className = `strength-bar ${strength.class}`;
        strengthText.textContent = strength.text;
        strengthText.className = `strength-text ${strength.class}`;
    }
    
    calculatePasswordStrength(password) {
        if (password.length === 0) return this.passwordStrength.weak;
        
        let score = 0;
        
        // Длина
        if (password.length > 8) score++;
        if (password.length > 12) score++;
        
        // Разнообразие символов
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score >= 6) return this.passwordStrength.veryStrong;
        if (score >= 4) return this.passwordStrength.strong;
        if (score >= 2) return this.passwordStrength.medium;
        return this.passwordStrength.weak;
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;
        const terms = document.getElementById('terms').checked;
        
        // Валидация
        if (!this.validateEmail(email)) {
            this.showNotification('Введите корректный email', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        if (!terms) {
            this.showNotification('Необходимо принять условия использования', 'error');
            return;
        }
        
        try {
            // Имитация регистрации
            await this.mockRegister({ fullName, email, password, role });
            this.showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    async mockRegister(userData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Проверяем, не зарегистрирован ли уже email
                const existingUsers = JSON.parse(localStorage.getItem('pwa_crm_users') || '[]');
                
                if (existingUsers.some(u => u.email === userData.email)) {
                    reject(new Error('Пользователь с таким email уже существует'));
                    return;
                }
                
                // Сохраняем пользователя
                existingUsers.push({
                    ...userData,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    verified: false
                });
                
                localStorage.setItem('pwa_crm_users', JSON.stringify(existingUsers));
                resolve({ success: true });
            }, 1500);
        });
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
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
            notification.remove();
        }, 3000);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
});