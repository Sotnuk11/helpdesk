'use strict';

const dict = {
    uk: {
        title_login: "HelpDesk", subtitle_login: "Secure Authentication Gateway",
        email_ph: "name@company.com", pass_ph: "••••••••", btn_login: "Ініціалізувати вхід",
        btn_register: "Створити акаунт", no_access: "Немає доступу?", has_access: "Вже є доступ?",
        nav_new_ticket: "Нова заявка", nav_admin: "Консоль Адміна", btn_logout: "Вийти",
        card_create_title: "Створити заявку", card_create_sub: "Опишіть інцидент для служби підтримки",
        ph_subject: "Тема інциденту", pri_low: "Низький (Low)", pri_med: "Середній (Medium)", pri_high: "Критичний (High)",
        ph_desc: "Технічні деталі та логи...", btn_send: "Відправити у систему",
        admin_title: "Глобальний моніторинг", admin_sub: "Активні тікети в системі",
        th_id: "ID", th_init: "Ініціатор", th_inc: "Інцидент", th_pri: "Рівень", th_stat: "Статус", th_act: "Дії",
        modal_title: "Деталі інциденту #", modal_init: "Ініціатор:", modal_date: "Створено:",
        modal_desc: "Повний опис інциденту:", modal_reply: "Звіт Адміністратора (Рішення):", modal_change: "Оновити статус:",
        btn_save: "Зберегти зміни", status_open: "Відкрито (Open)", status_prog: "В роботі (In Progress)", status_res: "Вирішено (Resolved)",
        js_scan: "Сканування бази даних...", js_clean: "Аномалій не виявлено. Система чиста.", js_analyze: "Аналіз",
        js_open: "Відкрито", js_prog: "В роботі", js_res: "Вирішено",
        stat_tot: "Всього тікетів", stat_act: "Активні", stat_res: "Вирішені"
    },
    en: {
        title_login: "HelpDesk", subtitle_login: "Secure Authentication Gateway",
        email_ph: "name@company.com", pass_ph: "••••••••", btn_login: "Initialize Login",
        btn_register: "Create Account", no_access: "No access?", has_access: "Already have access?",
        nav_new_ticket: "New Ticket", nav_admin: "Admin Console", btn_logout: "Logout",
        card_create_title: "Create Ticket", card_create_sub: "Describe the incident for support",
        ph_subject: "Incident Subject", pri_low: "Low", pri_med: "Medium", pri_high: "High",
        ph_desc: "Technical details and logs...", btn_send: "Transmit to System",
        admin_title: "Global Monitoring", admin_sub: "Active system tickets",
        th_id: "ID", th_init: "Initiator", th_inc: "Incident", th_pri: "Level", th_stat: "Status", th_act: "Actions",
        modal_title: "Incident Details #", modal_init: "Initiator:", modal_date: "Created at:",
        modal_desc: "Full Incident Description:", modal_reply: "Admin Report (Resolution):", modal_change: "Update Status:",
        btn_save: "Save Changes", status_open: "Open", status_prog: "In Progress", status_res: "Resolved",
        js_scan: "Scanning database...", js_clean: "No anomalies detected. System is clean.", js_analyze: "Analyze",
        js_open: "Open", js_prog: "In Progress", js_res: "Resolved",
        stat_tot: "Total Tickets", stat_act: "Active", stat_res: "Resolved"
    },
    pl: {
        title_login: "HelpDesk", subtitle_login: "Brama Bezpiecznego Uwierzytelniania",
        email_ph: "nazwa@firma.com", pass_ph: "••••••••", btn_login: "Zainicjuj Logowanie",
        btn_register: "Utwórz Konto", no_access: "Brak dostępu?", has_access: "Masz już dostęp?",
        nav_new_ticket: "Nowe Zgłoszenie", nav_admin: "Konsola Administratora", btn_logout: "Wyloguj",
        card_create_title: "Utwórz Zgłoszenie", card_create_sub: "Opisz incydent dla wsparcia",
        ph_subject: "Temat incydentu", pri_low: "Niski (Low)", pri_med: "Średni (Medium)", pri_high: "Krytyczny (High)",
        ph_desc: "Szczegóły techniczne i logi...", btn_send: "Wyślij do systemu",
        admin_title: "Globalne Monitorowanie", admin_sub: "Aktywne zgłoszenia",
        th_id: "ID", th_init: "Inicjator", th_inc: "Incydent", th_pri: "Poziom", th_stat: "Status", th_act: "Akcje",
        modal_title: "Szczegóły Incydentu #", modal_init: "Inicjator:", modal_date: "Utworzono:",
        modal_desc: "Pełny opis incydentu:", modal_reply: "Raport Administratora:", modal_change: "Aktualizuj status:",
        btn_save: "Zapisz Zmiany", status_open: "Otwarte (Open)", status_prog: "W toku (In Progress)", status_res: "Rozwiązane (Resolved)",
        js_scan: "Skanowanie bazy danych...", js_clean: "Nie wykryto anomalii. System czysty.", js_analyze: "Analiza",
        js_open: "Otwarte", js_prog: "W toku", js_res: "Rozwiązane",
        stat_tot: "Wszystkie", stat_act: "Aktywne", stat_res: "Rozwiązane"
    }
};

let currentLang = localStorage.getItem('nexus_lang') || 'uk';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('nexus_lang', lang);
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[lang][key]) {
            if (['INPUT', 'TEXTAREA'].includes(el.tagName)) el.placeholder = dict[lang][key];
            else el.textContent = dict[lang][key];
        }
    });
    if (document.getElementById('adminSection').style.display === 'block') window.loadAdminTickets();
}

// Броньована функція встановлення значень
function safeSet(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) el.value = val;
    else el.textContent = val;
}

document.addEventListener('DOMContentLoaded', () => {
    
    setLanguage(currentLang);
    document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', (e) => setLanguage(e.target.dataset.lang)));

    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height, particles, animationFrameId, isTabActive = true;

    document.addEventListener("visibilitychange", () => {
        isTabActive = !document.hidden;
        if (isTabActive) drawParticles(); else cancelAnimationFrame(animationFrameId);
    });

    function initCanvas() {
        width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight;
        particles = Array.from({ length: Math.floor((width * height) / 12000) }, () => ({
            x: Math.random() * width, y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, radius: Math.random() * 1.5 + 0.5
        }));
    }

    function drawParticles() {
        if (!isTabActive) return;
        ctx.clearRect(0, 0, width, height); ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
            for (let j = i + 1; j < particles.length; j++) {
                let dist = Math.hypot(p.x - particles[j].x, p.y - particles[j].y);
                if (dist < 120) {
                    ctx.beginPath(); ctx.strokeStyle = `rgba(0, 240, 255, ${0.2 - dist/600})`;
                    ctx.lineWidth = 0.5; ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
                }
            }
        });
        animationFrameId = requestAnimationFrame(drawParticles);
    }
    window.addEventListener('resize', initCanvas); initCanvas(); drawParticles();

    let isLogin = true;
    let userToken = sessionStorage.getItem('jwt_token') || ''; 
    let userRole = sessionStorage.getItem('user_role') || '';

    const authSection = document.getElementById('authSection'), appSection = document.getElementById('appSection');
    const ticketSection = document.getElementById('ticketSection'), adminSection = document.getElementById('adminSection');
    const navAdmin = document.getElementById('nav-admin');
    
    if (userToken && userRole) {
        try {
            const payload = JSON.parse(atob(userToken.split('.')[1]));
            if (payload.role !== userRole) { sessionStorage.clear(); window.location.reload(); } else showApp(userRole, payload);
        } catch (e) { sessionStorage.clear(); }
    }

    function showApp(role, payload) {
        authSection.style.display = 'none'; appSection.style.display = 'flex';
        safeSet('currentUserDisplay', `ID: ${payload.id}`);
        if (role === 'admin') {
            navAdmin.style.display = 'flex'; activateNav('nav-admin', adminSection, [ticketSection]); window.loadAdminTickets();
        } else { navAdmin.style.display = 'none'; activateNav('nav-user', ticketSection, [adminSection]); }
    }

    function activateNav(navId, sectionToShow, sectionsToHide) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(navId).classList.add('active');
        sectionToShow.style.display = 'block'; sectionsToHide.forEach(s => s.style.display = 'none');
    }

    const performLogout = () => { sessionStorage.clear(); window.location.reload(); };
    document.getElementById('logoutBtn').addEventListener('click', performLogout);
    document.getElementById('nav-user').addEventListener('click', () => activateNav('nav-user', ticketSection, [adminSection]));
    navAdmin.addEventListener('click', () => { activateNav('nav-admin', adminSection, [ticketSection]); window.loadAdminTickets(); });
    document.getElementById('refreshBtn').addEventListener('click', () => window.loadAdminTickets());

    const toggleBtn = document.getElementById('toggle-btn');
    toggleBtn.addEventListener('click', () => {
        isLogin = !isLogin;
        document.getElementById('auth-title').textContent = dict[currentLang][isLogin ? 'title_login' : 'btn_register'];
        document.getElementById('submitBtnText').textContent = dict[currentLang][isLogin ? 'btn_login' : 'btn_register'];
        document.getElementById('toggle-text').textContent = dict[currentLang][isLogin ? 'no_access' : 'has_access'];
        toggleBtn.textContent = dict[currentLang][isLogin ? 'btn_register' : 'btn_login'];
        hideMessage(document.getElementById('message'));
    });

    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault(); const msgDiv = document.getElementById('message');
        try {
            const response = await fetch(isLogin ? '/login' : '/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ email: document.getElementById('email').value.trim(), password: document.getElementById('password').value })
            });
            const data = await response.json();
            if (response.ok) {
                if (isLogin) { sessionStorage.setItem('jwt_token', data.token); sessionStorage.setItem('user_role', data.role); window.location.reload(); } 
                else { showMessage(msgDiv, 'OK', 'success'); setTimeout(() => toggleBtn.click(), 1000); }
            } else showMessage(msgDiv, 'Error', 'error');
        } catch (err) { showMessage(msgDiv, 'Network Error', 'error'); }
    });

    document.getElementById('ticketForm').addEventListener('submit', async (e) => {
        e.preventDefault(); const msgDiv = document.getElementById('ticketMessage');
        try {
            const response = await fetch('/tickets', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
                body: JSON.stringify({ title: document.getElementById('title').value, description: document.getElementById('description').value, priority: document.getElementById('priority').value })
            });
            if (response.ok) { showMessage(msgDiv, 'OK', 'success'); e.target.reset(); } 
            else { if (response.status === 401 || response.status === 403) performLogout(); showMessage(msgDiv, 'Error', 'error'); }
        } catch (err) { showMessage(msgDiv, 'Error', 'error'); }
    });

    let currentTickets = [];

    function renderDashboardStats() {
        let statsContainer = document.getElementById('dashboard-stats');
        if (!statsContainer) {
            statsContainer = document.createElement('div');
            statsContainer.id = 'dashboard-stats';
            const tableContainer = document.querySelector('.table-container');
            if(tableContainer) tableContainer.parentNode.insertBefore(statsContainer, tableContainer);
        }
        const total = currentTickets.length;
        const active = currentTickets.filter(t => t.status !== 'Resolved').length;
        const resolved = total - active;

        statsContainer.innerHTML = `
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <div class="glass-panel" style="padding: 1rem; flex: 1; text-align: center; min-width: 120px;">
                    <h3 style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem; font-family: var(--font-mono);">${dict[currentLang].stat_tot}</h3>
                    <p style="font-size: 1.8rem; font-weight: bold; color: var(--text-main);">${total}</p>
                </div>
                <div class="glass-panel" style="padding: 1rem; flex: 1; text-align: center; min-width: 120px;">
                    <h3 style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem; font-family: var(--font-mono);">${dict[currentLang].stat_act}</h3>
                    <p style="font-size: 1.8rem; font-weight: bold; color: var(--warning);">${active}</p>
                </div>
                <div class="glass-panel" style="padding: 1rem; flex: 1; text-align: center; min-width: 120px;">
                    <h3 style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem; font-family: var(--font-mono);">${dict[currentLang].stat_res}</h3>
                    <p style="font-size: 1.8rem; font-weight: bold; color: var(--success);">${resolved}</p>
                </div>
            </div>
        `;
    }

    window.loadAdminTickets = async function() {
        const tbody = document.getElementById('adminTicketsBody');
        if(!tbody) return;
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${dict[currentLang].js_scan}</td></tr>`;
        
        try {
            const response = await fetch('/admin/tickets', { method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` }});
            if (!response.ok) { if (response.status === 401 || response.status === 403) performLogout(); throw new Error(); }
            
            currentTickets = await response.json();
            tbody.innerHTML = '';
            renderDashboardStats(); 
            
            if (currentTickets.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${dict[currentLang].js_clean}</td></tr>`;
                return;
            }

            const statusKey = (st) => (st === 'Resolved' ? 'js_res' : st === 'In Progress' ? 'js_prog' : 'js_open');
            const cell = (child) => { const td = document.createElement('td'); if (child) td.appendChild(child); return td; };
            const span = (text, cls, style) => {
                const el = document.createElement('span');
                el.textContent = text;
                if (cls) el.className = cls;
                if (style) el.style.cssText = style;
                return el;
            };

            currentTickets.forEach(t => {
                const statusColor = t.status === 'Resolved' ? 'var(--success)' : t.status === 'In Progress' ? 'var(--primary)' : 'var(--warning)';
                const priority = ['low', 'medium', 'high'].includes(String(t.priority).toLowerCase()) ? String(t.priority).toLowerCase() : 'low';

                const title = span(t.title, 'truncate-text', 'font-weight: 600');
                title.title = t.title; // property assignment, not HTML: safe for any characters

                const analyze = document.createElement('button');
                analyze.className = 'btn-primary analyze-btn';
                analyze.dataset.id = String(t.id);
                analyze.style.cssText = 'padding: 0.4rem; font-size: 0.75rem;';
                analyze.textContent = dict[currentLang].js_analyze;

                const tr = document.createElement('tr');
                tr.append(
                    cell(span(`#${t.id}`, null, 'font-family: var(--font-mono)')),
                    cell(span(t.email || 'Deleted User', 'truncate-text')),
                    cell(title),
                    cell(span(t.priority, `badge badge-${priority}`)),
                    cell(span(`[ ${dict[currentLang][statusKey(t.status)]} ]`, null, `color: ${statusColor}; white-space: nowrap;`)),
                    cell(analyze),
                );
                tbody.appendChild(tr);
            });
        } catch (err) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--danger)">Connection Error</td></tr>`; }
    };

    document.getElementById('adminTicketsBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.analyze-btn');
        if (btn) openTicketDetails(parseInt(btn.dataset.id));
    });

    window.openTicketDetails = function(ticketId) {
        const ticket = currentTickets.find(t => t.id === ticketId);
        if (!ticket) return;

        safeSet('modalId', ticket.id);
        safeSet('modalUser', ticket.email || 'Deleted User');
        safeSet('modalDate', ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '--/--/----');
        safeSet('modalCurrentStatus', dict[currentLang][ticket.status === 'Resolved' ? 'js_res' : ticket.status === 'In Progress' ? 'js_prog' : 'js_open']);
        safeSet('modalDescription', ticket.description || '');
        safeSet('modalStatusSelect', ticket.status || 'Open');
        safeSet('modalAdminReply', ticket.admin_reply || '');
        
        hideMessage(document.getElementById('modalAlert'));
        const modal = document.getElementById('ticketModal');
        if (modal) modal.style.display = 'flex';
    };

    document.getElementById('closeModalBtn')?.addEventListener('click', () => document.getElementById('ticketModal').style.display = 'none');

    document.getElementById('updateStatusBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('updateStatusBtn');
        const alertBox = document.getElementById('modalAlert');
        const ticketId = document.getElementById('modalId').textContent;
        
        const newStatus = document.getElementById('modalStatusSelect')?.value || 'Open';
        const adminReply = document.getElementById('modalAdminReply')?.value || '';

        btn.disabled = true;
        try {
            const response = await fetch(`/admin/tickets/${ticketId}/status`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, 
                body: JSON.stringify({ status: newStatus, admin_reply: adminReply })
            });
            if (response.ok) {
                showMessage(alertBox, 'OK', 'success');
                setTimeout(() => { document.getElementById('ticketModal').style.display = 'none'; window.loadAdminTickets(); }, 1000);
            } else showMessage(alertBox, 'Error', 'error');
        } catch (err) { showMessage(alertBox, 'Error', 'error'); } 
        finally { btn.disabled = false; }
    });

    function showMessage(el, text, type) { if(el) { el.textContent = text; el.className = `alert ${type}`; el.style.display = 'block'; } }
    function hideMessage(el) { if(el) el.style.display = 'none'; }
});