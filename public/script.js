/**
 * NAIPAN DASHBOARD CORE ENGINE - FINAL REWRITE
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

// UI INITIALIZER
function initUI() {
    SERVICES.forEach(s => {
        const container = document.getElementById(`cluster-${s.cluster}`);
        if (!container) return;
        const el = document.createElement('div');
        el.className = "status-card p-4 rounded-2xl flex justify-between items-center";
        el.innerHTML = `
            <div class="overflow-hidden">
                <p class="text-sm font-bold text-slate-800 truncate">${s.name}</p>
                <p class="text-[10px] text-slate-400 font-medium truncate w-32">${s.url.replace('/proxy-eresh/ping','IP:20034')}</p>
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

// MONITORING LOGIC
async function ping(service) {
    const dot = document.getElementById(`dot-${service.id}`);
    const statusText = document.getElementById(`status-${service.id}`);
    const latText = document.getElementById(`lat-${service.id}`);
    const start = Date.now();

    try {
        const options = service.isBot ? { cache: 'no-store' } : { mode: 'no-cors', cache: 'no-store' };
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

// SCANNING SYSTEM
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

// AUTH & ACTION HANDLER
function requestAuth(action) {
    currentAction = action;
    document.getElementById('authModal').classList.remove('hidden');
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
        } else { alert("Kode Salah!"); }
    } catch (err) { alert("Sistem Error"); }
    finally { btn.disabled = false; }
}

// BOT COMMAND
async function executeMaintenance() {
    try {
        const res = await fetch('/proxy-eresh/toggle-mt', { // Ganti ke toggle-mt
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: "x4solid" }) // Kirim password sesuai index.js lo
        });

        const data = await res.json();

        if (data.success) {
            alert(`BOT STATUS: ${data.maintenance ? 'HIBERNASI 🛠️' : 'AKTIF 🚀'}`);
            triggerRescan();
        } else {
            alert("Gagal: " + (data.message || "Unknown Error"));
        }
    } catch (e) {
        alert("Gagal koneksi ke Engine Bot: " + e.message);
    }
}

// CHRONICLES CRUD
async function openDbManager() {
    document.getElementById('dbModal').classList.remove('hidden');
    const container = document.getElementById('dbContent');
    container.innerHTML = "Loading...";

    try {
        const res = await fetch(API_CHRONICLES);
        const data = await res.json();
        let html = `<table class="w-full text-left border-separate border-spacing-y-3">`;
        data.forEach(m => {
            html += `
            <tr class="bg-slate-50/50 rounded-2xl">
                <td class="p-4"><input type="text" id="t-${m.id}" value="${m.title}" class="bg-transparent font-bold w-full"></td>
                <td class="p-4"><input type="text" id="s-${m.id}" value="${m.sender}" class="bg-transparent text-sm w-full"></td>
                <td class="p-4 text-right">
                    <button onclick="saveMem('${m.id}')" class="bg-green-500 text-white p-2 rounded-lg text-xs">SAVE</button>
                    <button onclick="delMem('${m.id}')" class="bg-red-500 text-white p-2 rounded-lg text-xs">DEL</button>
                </td>
            </tr>`;
        });
        container.innerHTML = html + `</table>`;
    } catch (e) { container.innerHTML = "Sync Failed."; }
}

async function saveMem(id) {
    const title = document.getElementById(`t-${id}`).value;
    const sender = document.getElementById(`s-${id}`).value;
    const res = await fetch(`${API_CHRONICLES}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sender })
    });
    if (res.ok) alert("Saved!");
}

async function delMem(id) {
    if (!confirm("Hapus?")) return;
    const res = await fetch(`${API_CHRONICLES}/${id}`, { method: 'DELETE' });
    if (res.ok) openDbManager();
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.addEventListener('DOMContentLoaded', () => { initUI(); triggerRescan(); });


