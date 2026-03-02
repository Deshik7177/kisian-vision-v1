document.addEventListener('DOMContentLoaded', () => {
    const i18n = window.AppI18n;
    const statusBtn = document.getElementById('connection-status-btn');
    if (!statusBtn) {
        return;
    }

    const THEME_KEY = 'kv360-theme';

    const getPreferredTheme = () => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') {
            return saved;
        }
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const setTheme = (theme) => {
        const normalized = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', normalized);
        localStorage.setItem(THEME_KEY, normalized);

        const btn = document.getElementById('theme-toggle-btn');
        if (btn) {
            btn.textContent = normalized === 'dark' ? '☀ Light' : '🌙 Dark';
            btn.setAttribute('aria-label', normalized === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
            btn.setAttribute('title', normalized === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    };

    const ensureThemeToggle = () => {
        const nav = document.querySelector('.top-nav');
        if (!nav || document.getElementById('theme-toggle-btn')) {
            return;
        }

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'theme-toggle-btn';
        toggleBtn.type = 'button';
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            setTheme(current === 'dark' ? 'light' : 'dark');
        });

        nav.insertBefore(toggleBtn, statusBtn);
        setTheme(getPreferredTheme());
    };

    const ensureGlobalLanguagePicker = () => {
        const nav = document.querySelector('.top-nav');
        if (!nav || document.getElementById('global-language-select')) {
            return;
        }

        const wrap = document.createElement('label');
        wrap.className = 'language-picker global-language-picker';
        wrap.setAttribute('for', 'global-language-select');

        const label = document.createElement('span');
        label.textContent = i18n ? i18n.t('lang.label', 'Language') : 'Language';
        label.setAttribute('data-i18n', 'lang.label');

        const select = document.createElement('select');
        select.id = 'global-language-select';
        select.innerHTML = `
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="te">Telugu</option>
        `;
        select.value = i18n ? i18n.getLanguage() : 'en';

        select.addEventListener('change', () => {
            const value = select.value;
            if (i18n) {
                i18n.setLanguage(value);
                i18n.applyPageTranslations();
            }

            const pageLang = document.getElementById('language-select');
            if (pageLang && pageLang.value !== value) {
                pageLang.value = value;
                pageLang.dispatchEvent(new Event('change'));
            }
        });

        wrap.appendChild(label);
        wrap.appendChild(select);
        nav.insertBefore(wrap, statusBtn);

        const pageLang = document.getElementById('language-select');
        if (pageLang) {
            pageLang.value = select.value;
            pageLang.addEventListener('change', () => {
                if (i18n) {
                    const updated = i18n.setLanguage(pageLang.value);
                    const globalSel = document.getElementById('global-language-select');
                    if (globalSel) {
                        globalSel.value = updated;
                    }
                    i18n.applyPageTranslations();
                }
            });
        }
    };


    const setState = (text, stateClass) => {
        statusBtn.textContent = text;
        statusBtn.classList.remove('conn-ok', 'conn-warn', 'conn-bad');
        statusBtn.classList.add(stateClass);
    };

    const checkConnection = async () => {
        if (!navigator.onLine) {
            setState(i18n ? i18n.t('conn.offline', 'Offline (No Internet)') : 'Offline (No Internet)', 'conn-bad');
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        try {
            const response = await fetch('/health', {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
                setState(i18n ? i18n.t('conn.unreachable', 'Backend Unreachable') : 'Backend Unreachable', 'conn-bad');
                return;
            }

            const payload = await response.json();
            const mode = payload.mode || 'LOCAL_ONLY';

            if (mode === 'ONLINE_ENHANCED') {
                setState(i18n ? i18n.t('conn.online', 'Connected (Online)') : 'Connected (Online)', 'conn-ok');
            } else {
                setState(i18n ? i18n.t('conn.local', 'Connected (Local Mode)') : 'Connected (Local Mode)', 'conn-warn');
            }
        } catch (error) {
            clearTimeout(timeout);
            setState(i18n ? i18n.t('conn.unreachable', 'Backend Unreachable') : 'Backend Unreachable', 'conn-bad');
        }
    };

    ensureThemeToggle();
    ensureGlobalLanguagePicker();
    if (i18n) {
        i18n.applyPageTranslations();
        document.addEventListener('app-language-changed', () => {
            i18n.applyPageTranslations();
            checkConnection();
        });
    }

    statusBtn.addEventListener('click', checkConnection);

    checkConnection();
    setInterval(checkConnection, 10000);
});
