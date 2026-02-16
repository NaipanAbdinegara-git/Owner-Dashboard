/**
 * NAIPAN DASHBOARD CORE ENGINE - V2.0
 * Updated: Feb 2026
 */

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

// --- 1. CLOCK SYSTEM ---
function startClock() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;

    setInterval(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockElement.innerText = `${hours}:${minutes}`;
        
        // Efek kedip pada titik dua
        clockElement.style.opacity = now.getSeconds() % 2 === 0 ? "1" : "0.7";
    }, 1000);
}

// --- 2. UI INITIALIZER ---
function initUI() {
    SERVICES.forEach(s => {
        const container = document.getElementById(`cluster-${s.cluster}`);
        if (!container) return;
        const el = document.createElement('div');
        el.className = "status-card p-4 rounded-2xl flex justify-between items-center";
        el.innerHTML = `
            <div class="overflow-hidden">
                <p class="text-sm font-bold text-slate-800 truncate">${s.name}</p>
                <p class="text-[10px] text-slate-400 font-medium truncate w-32">${s.url.replace('/proxy-eresh/ping','Eresh Engine')}</p>
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

// --- 3. MONITORING LOGIC ---
async function ping(service) {
    const dot = document.getElementById(`dot-${service.id}`);
    const statusText = document.getElementById(`status-${service.id}`);
    const latText = document.getElementById(`lat-${service.id}`);
    const start = Date.now();

    try {
        const options = { cache: 'no-store', timeout: 5000 };
        if (!service.isBot) options.mode = 'no-cors';

        const res = await fetch(service.url, options);
        const lat = Date.now() - start;
        if (latText) latText.innerText = lat + "ms";

        if (service.isBot) {
            const data = await res.json();
            document.getElementById('bot-control-card')?.classList.remove('hidden');
            const uptimeBadge = document.getElementById('bot-uptime-badge');
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
    }
}

// --- 4. SCANNING SYSTEM ---
async function triggerRescan() {
    const btn = document.getElementById('rescan-btn');
    const status = document.getElementById('global-status');
    btn?.classList.add('btn-scanning');
    
    for (const cId of ['ev', 'ch', 'infra']) {
        const clusterDiv = document.getElementById(`cluster-${cId}`);
        if (clusterDiv) clusterDiv.style.opacity = "0.5";
        await Promise.all(SERVICES.filter(s => s.cluster === cId).map(ping));
        await new Promise(r => setTimeout(r, 400));
        if (clusterDiv) clusterDiv.style.opacity = "1";
    }
    
    btn?.classList.remove('btn-scanning');
    if (status) {
        status.innerText = "SYSTEM OPTIMIZED";
        status.className = "text-sm font-bold text-green-600";
    }
}

// --- 5. AUTH & ACTION HANDLER ---
function requestAuth(action) {
    currentAction = action;
    document.getElementById('authModal').classList.remove('hidden');
    document.getElementById('auth-code').value = ""; // Reset input
    document.getElementById('auth-code').focus();
}

async function verifyAuth() {
    const input = document.getElementById('auth-code');
    const btn = document.querySelector('button[onclick="verifyAuth()"]');
    btn.disabled = true;

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
            if (currentAction === 'maintenance') executeMaintenance();
        } else { 
            alert("Kode Salah, Pan!"); 
        }
    } catch (err) { 
        alert("Sistem Verifikasi Error"); 
    } finally { 
        btn.disabled = false; 
    }
}

// --- 6. BOT COMMAND (MAINTENANCE TOGGLE) ---
async function executeMaintenance() {
    try {
        const res = await fetch('/proxy-eresh/toggle-mt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: "x4solid" })
        });

        const data = await res.json();

        if (data.success) {
            alert(`BOT ERESH: ${data.maintenance ? 'MASUK MODE HIBERNASI 💤' : 'SUDAH BANGUN/AKTIF 🚀'}`);
            triggerRescan();
        } else {
            alert("Gagal: " + (data.message || "Password salah atau rute error."));
        }
    } catch (e) {
        alert("Gagal koneksi ke Engine Bot. Pastikan VPS jalan!");
    }
}

// --- 7. CHRONICLES CRUD ---
async function openDbManager() {
    document.getElementById('dbModal').classList.remove('hidden');
    const container = document.getElementById('dbContent');
    container.innerHTML = "<div class='p-10 text-center animate-pulse text-slate-400'>Syncing Database...</div>";

    try {
        const res = await fetch(API_CHRONICLES);
        const data = await res.json();
        let html = `<table class="w-full text-left border-separate border-spacing-y-3">`;
        data.forEach(m => {
            html += `
            <tr class="bg-slate-50/50 rounded-2xl">
                <td class="p-4"><input type="text" id="t-${m.id}" value="${m.title}" class="bg-transparent font-bold w-full outline-none focus:text-blue-600"></td>
                <td class="p-4"><input type="text" id="s-${m.id}" value="${m.sender}" class="bg-transparent text-sm w-full outline-none"></td>
                <td class="p-4 text-right flex gap-2 justify-end">
                    <button onclick="saveMem('${m.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs transition">SAVE</button>
                    <button onclick="delMem('${m.id}')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs transition">DEL</button>
                </td>
            </tr>`;
        });
        container.innerHTML = html + `</table>`;
    } catch (e) { 
        container.innerHTML = "<div class='p-10 text-center text-red-500 font-bold'>FAILED TO FETCH DATA</div>"; 
    }
}

async function saveMem(id) {
    const title = document.getElementById(`t-${id}`).value;
    const sender = document.getElementById(`s-${id}`).value;
    try {
        const res = await fetch(`${API_CHRONICLES}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, sender })
        });
        if (res.ok) alert("Memory Updated! ✨");
    } catch (e) { alert("Save Failed."); }
}

async function delMem(id) {
    if (!confirm("Hapus memori ini secara permanen?")) return;
    try {
        const res = await fetch(`${API_CHRONICLES}/${id}`, { method: 'DELETE' });
        if (res.ok) openDbManager();
    } catch (e) { alert("Delete Failed."); }
}

// --- 8. UTILS ---
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// --- BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => { 
    initUI(); 
    triggerRescan(); 
    startClock(); 
});
