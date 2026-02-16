/**
 * NAIPAN DASHBOARD CORE ENGINE
 * Integrasi: Chronicles API & Eresh Bot Engine
 */

// 1. CONFIGURATION & SERVICES
const SERVICES = [
    { id: 'ev-hub', name: "EduVault Main", url: "https://notfun.my.id", cluster: "ev" },
    { id: 'ev-api', name: "GAS Proxy API", url: "https://notfun.my.id/api/proxy-gas", cluster: "ev" },
    { id: 'ev-mon', name: "Stats Monitor", url: "https://notfun.my.id/monitor.html", cluster: "ev" },
    { id: 'ch-web', name: "Chronicles Portal", url: "https://chroniclesmemories.vercel.app", cluster: "ch" },
    { id: 'ch-api', name: "HidenCloud API", url: "/proxy-hidencloud/memories", cluster: "ch" }, 
    { id: 'main-web', name: "Naipan Portfolio", url: "https://naipan.my.id", cluster: "infra" },
    { id: 'bot-srv', name: "Eresh Bot Engine", url: "/proxy-eresh/ping", cluster: "infra", isBot: true }
];

const API_CHRONICLES = "/proxy-hidencloud/memories";
let currentAction = null;

// 2. CORE UI FUNCTIONS
function initUI() {
    SERVICES.forEach(s => {
        const container = document.getElementById(`cluster-${s.cluster}`);
        if (!container) return;

        const el = document.createElement('div');
        el.className = "status-card p-4 rounded-2xl flex justify-between items-center";
        el.innerHTML = `
            <div class="overflow-hidden">
                <p class="text-sm font-bold text-slate-800 truncate">${s.name}</p>
                <p class="text-[10px] text-slate-400 font-medium truncate w-32">${s.url.replace('http://','').replace('https://','')}</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="text-right">
                    <p id="status-${s.id}" class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Checking</p>
                    <p id="lat-${s.id}" class="text-[9px] font-bold text-slate-300">-</p>
                </div>
                <span id="dot-${s.id}" class="dot dot-checking"></span>
            </div>`;
        container.appendChild(el);
    });
}

// 3. PING & MONITORING LOGIC
async function ping(service) {
    const dot = document.getElementById(`dot-${service.id}`);
    const statusText = document.getElementById(`status-${service.id}`);
    const latText = document.getElementById(`lat-${service.id}`);
    const start = Date.now();

    try {
        // Jika bot, kita butuh datanya. Jika web biasa, mode no-cors sudah cukup.
        const options = service.isBot ? { cache: 'no-store' } : { mode: 'no-cors', cache: 'no-store' };
        const res = await fetch(service.url, options);
        const lat = Date.now() - start;
        
        if (latText) latText.innerText = lat + "ms";

        if (service.isBot) {
            const data = await res.json();
            const botCard = document.getElementById('bot-control-card');
            const uptimeBadge = document.getElementById('bot-uptime-badge');
            
            if (botCard) botCard.classList.remove('hidden');
            if (uptimeBadge) uptimeBadge.innerText = `UPTIME: ${data.uptime}s`;
            
            dot.className = data.maintenance ? "dot dot-maintenance" : "dot dot-online";
            statusText.innerText = data.maintenance ? "Maintenance" : "Online";
        } else {
            dot.className = "dot dot-online";
            statusText.innerText = "Active";
        }
    } catch (e) {
        if (dot) dot.className = "dot dot-offline";
        if (statusText) statusText.innerText = "Down";
        if (latText) latText.innerText = "ERR";
    }
}

async function triggerRescan() {
    const btn = document.getElementById('rescan-btn');
    const text = document.getElementById('rescan-text');
    const status = document.getElementById('global-status');

    if (btn) btn.classList.add('btn-scanning');
    if (text) text.innerText = "Scanning Assets...";
    if (status) {
        status.innerText = "SCANNING...";
        status.className = "text-sm font-bold text-amber-500 animate-pulse";
    }

    for (const cId of ['ev', 'ch', 'infra']) {
        const clusterDiv = document.getElementById(`cluster-${cId}`);
        if (clusterDiv) clusterDiv.style.opacity = "0.5";
        await Promise.all(SERVICES.filter(s => s.cluster === cId).map(ping));
        await new Promise(r => setTimeout(r, 400));
        if (clusterDiv) clusterDiv.style.opacity = "1";
    }

    if (btn) btn.classList.remove('btn-scanning');
    if (text) text.innerText = "Re-Scan Systems";
    if (status) {
        status.innerText = "SYSTEM OPTIMIZED";
        status.className = "text-sm font-bold text-green-600";
    }
}

// 4. AUTHENTICATION (Verifikasi ke /api/verify)
function requestAuth(action) {
    currentAction = action;
    const errorMsg = document.getElementById('auth-error-msg');
    const input = document.getElementById('auth-code');
    
    if (errorMsg) errorMsg.innerHTML = "";
    if (input) {
        input.classList.remove('shake-error');
        input.value = "";
    }
    document.getElementById('authModal').classList.remove('hidden');
    document.getElementById('auth-code').focus();
}

async function verifyAuth() {
    const input = document.getElementById('auth-code');
    const errorMsg = document.getElementById('auth-error-msg');
    const btnVerif = document.querySelector('button[onclick="verifyAuth()"]');

    if (btnVerif) {
        btnVerif.innerText = "CHECKING...";
        btnVerif.disabled = true;
    }

    try {
        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: input.value })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            closeModal('authModal');
            if (currentAction === 'database') openDbManager();
            if (currentAction === 'maintenance') toggleBotMaintenance();
        } else {
            throw new Error("Wrong Code");
        }
    } catch (err) {
        input.classList.add('shake-error');
        errorMsg.innerHTML = `<p class="text-red-500 text-[10px] font-bold mt-2">Invalid Authorization Code</p>`;
        setTimeout(() => input.classList.remove('shake-error'), 500);
        input.value = "";
    } finally {
        if (btnVerif) {
            btnVerif.innerText = "VERIFIKASI";
            btnVerif.disabled = false;
        }
    }
}

// 5. BOT MAINTENANCE COMMAND
async function toggleBotMaintenance() {
    try {
        const res = await fetch('/proxy-eresh/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        alert(`Eresh Bot: ${data.maintenance ? 'Hibernasi Aktif 🛠️' : 'Bot Kembali Online 🚀'}`);
        triggerRescan();
    } catch (err) {
        alert("Gagal mengirim perintah ke Engine Bot.");
    }
}

// 6. CHRONICLES DATABASE MANAGER (CRUD)
async function openDbManager() {
    document.getElementById('dbModal').classList.remove('hidden');
    const container = document.getElementById('dbContent');
    container.innerHTML = `<p class="text-center p-10 text-slate-400 animate-pulse font-bold">Syncing with HidenCloud...</p>`;
    
    try {
        const res = await fetch(API_CHRONICLES);
        const data = await res.json();
        let html = `<table class="w-full text-left border-separate border-spacing-y-3">`;
        data.forEach(m => {
            html += `
            <tr class="bg-slate-50/50 rounded-2xl overflow-hidden">
                <td class="p-5 rounded-l-2xl">
                    <input type="text" id="t-${m.id}" value="${m.title}" class="bg-transparent font-bold text-slate-800 outline-none w-full border-b border-transparent focus:border-purple-300">
                    <p class="text-[9px] font-bold text-purple-500 uppercase">${m.category}</p>
                </td>
                <td class="p-5">
                    <input type="text" id="s-${m.id}" value="${m.sender}" class="bg-transparent text-slate-500 text-sm outline-none w-full border-b border-transparent focus:border-purple-300">
                </td>
                <td class="p-5 text-right rounded-r-2xl space-x-2">
                    <button onclick="saveMem('${m.id}')" class="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-bold hover:bg-green-600 transition">SAVE</button>
                    <button onclick="delMem('${m.id}')" class="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-bold hover:bg-red-600 transition">DEL</button>
                </td>
            </tr>`;
        });
        container.innerHTML = html + `</table>`;
    } catch (e) {
        container.innerHTML = `<p class="text-center p-10 text-red-500 font-bold">Failed to sync database.</p>`;
    }
}

async function saveMem(id) {
    const title = document.getElementById(`t-${id}`).value;
    const sender = document.getElementById(`s-${id}`).value;

    try {
        const res = await fetch(`/proxy-hidencloud/memories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, sender })
        });
        if (res.ok) {
            alert("Updated! ✨");
            openDbManager();
        }
    } catch (err) { alert("Gagal update."); }
}

async function delMem(id) {
    if (!confirm("Hapus permanen arsip ini?")) return;
    try {
        const res = await fetch(`/proxy-hidencloud/memories/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Arsip Dihapus! 🗑️");
            openDbManager();
        }
    } catch (err) { alert("Gagal menghapus."); }
}

// 7. HELPERS & INITIALIZATION
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Clock Task
setInterval(() => {
    const n = new Date();
    const clock = document.getElementById('clock');
    if (clock) clock.innerText = n.getHours().toString().padStart(2,'0') + ":" + n.getMinutes().toString().padStart(2,'0');
}, 1000);

// Boot
document.addEventListener('DOMContentLoaded', () => { 
    initUI(); 
    triggerRescan(); 
});
