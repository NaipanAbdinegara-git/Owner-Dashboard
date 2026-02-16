// SERVICES DATA
const SERVICES = [
    { id: 'ev-hub', name: "EduVault Main", url: "https://notfun.my.id", cluster: "ev" },
    { id: 'ev-api', name: "GAS Proxy API", url: "https://notfun.my.id/api/proxy-gas", cluster: "ev" },
    { id: 'ev-mon', name: "Stats Monitor", url: "https://notfun.my.id/monitor.html", cluster: "ev" },
    { id: 'ch-web', name: "Chronicles Portal", url: "https://chroniclesmemories.vercel.app", cluster: "ch" },
    // GANTI URL DI BAWAH INI PAKAI PROXY
    { id: 'ch-api', name: "HidenCloud API", url: "/proxy-hidencloud/memories", cluster: "ch" }, 
    { id: 'main-web', name: "Naipan Portfolio", url: "https://naipan.my.id", cluster: "infra" },
    // GANTI URL DI BAWAH INI PAKAI PROXY
    { id: 'bot-srv', name: "Eresh Bot Engine", url: "/proxy-eresh/ping", cluster: "infra", isBot: true }
];

const API_CHRONICLES = "/proxy-hidencloud/memories";
let currentAction = null;

// UI RENDERER
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

// PING LOGIC
async function ping(service) {
    const dot = document.getElementById(`dot-${service.id}`);
    const statusText = document.getElementById(`status-${service.id}`);
    const latText = document.getElementById(`lat-${service.id}`);
    const start = Date.now();
    try {
        const options = service.isBot ? { cache: 'no-store' } : { mode: 'no-cors', cache: 'no-store' };
        const res = await fetch(service.url, options);
        const lat = Date.now() - start;
        latText.innerText = lat + "ms";

        if (service.isBot) {
            const data = await res.json();
            document.getElementById('bot-control-card').classList.remove('hidden');
            document.getElementById('bot-uptime-badge').innerText = `UPTIME: ${data.uptime}s`;
            dot.className = data.maintenance ? "dot dot-maintenance" : "dot dot-online";
            statusText.innerText = data.maintenance ? "Maintenance" : "Online";
        } else {
            dot.className = "dot dot-online";
            statusText.innerText = "Active";
        }
    } catch (e) {
        dot.className = "dot dot-offline";
        statusText.innerText = "Down";
        latText.innerText = "ERR";
    }
}

// RESCAN LOGIC
async function triggerRescan() {
    const btn = document.getElementById('rescan-btn');
    const text = document.getElementById('rescan-text');
    const status = document.getElementById('global-status');

    btn.classList.add('btn-scanning');
    text.innerText = "Scanning Assets...";
    status.innerText = "SCANNING...";
    status.className = "text-sm font-bold text-amber-500 animate-pulse";

    for (const cId of ['ev', 'ch', 'infra']) {
        const clusterDiv = document.getElementById(`cluster-${cId}`);
        clusterDiv.style.opacity = "0.5";
        await Promise.all(SERVICES.filter(s => s.cluster === cId).map(ping));
        await new Promise(r => setTimeout(r, 400));
        clusterDiv.style.opacity = "1";
    }

    btn.classList.remove('btn-scanning');
    text.innerText = "Re-Scan Systems";
    status.innerText = "SYSTEM OPTIMIZED";
    status.className = "text-sm font-bold text-green-600";
}

// AUTH LOGIC (THE UPGRADED PART)
function requestAuth(action) {
    currentAction = action;
    document.getElementById('auth-error-msg').innerHTML = "";
    document.getElementById('auth-code').classList.remove('shake-error');
    document.getElementById('authModal').classList.remove('hidden');
    document.getElementById('auth-code').focus();
}

async function verifyAuth() {
    const input = document.getElementById('auth-code');
    const errorMsg = document.getElementById('auth-error-msg');
    const btnVerif = document.querySelector('button[onclick="verifyAuth()"]');

    btnVerif.innerText = "CHECKING...";
    btnVerif.disabled = true;

    try {
        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: input.value })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            closeModal('authModal');
            input.value = "";
            errorMsg.innerHTML = "";
            if (currentAction === 'database') openDbManager();
            if (currentAction === 'maintenance') alert("Maintenance Command Executed.");
        } else {
            throw new Error("Unauthorized");
        }
    } catch (err) {
        input.classList.add('shake-error');
        errorMsg.innerHTML = `<p class="text-error">Invalid Authorization Code</p>`;
        setTimeout(() => input.classList.remove('shake-error'), 500);
        input.value = "";
        input.focus();
    } finally {
        btnVerif.innerText = "VERIFIKASI";
        btnVerif.disabled = false;
    }
}

// DATABASE MANAGER
async function openDbManager() {
    document.getElementById('dbModal').classList.remove('hidden');
    const container = document.getElementById('dbContent');
    container.innerHTML = `<p class="text-center p-10 text-slate-400">Syncing with HidenCloud...</p>`;
    
    try {
        const res = await fetch(API_CHRONICLES);
        const data = await res.json();
        let html = `<table class="w-full text-left border-separate border-spacing-y-3">`;
        data.forEach(m => {
            html += `
            <tr class="bg-slate-50/50 rounded-2xl overflow-hidden">
                <td class="p-5 rounded-l-2xl">
                    <input type="text" id="t-${m.id}" value="${m.title}" class="bg-transparent font-bold text-slate-800 outline-none w-full">
                    <p class="text-[9px] font-bold text-purple-500 uppercase">${m.category}</p>
                </td>
                <td class="p-5">
                    <input type="text" id="s-${m.id}" value="${m.sender}" class="bg-transparent text-slate-500 text-sm outline-none w-full">
                </td>
                <td class="p-5 text-right rounded-r-2xl space-x-2">
                    <button onclick="saveMem('${m.id}')" class="shine-btn px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-bold">SAVE</button>
                    <button onclick="delMem('${m.id}')" class="shine-btn px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-bold">DEL</button>
                </td>
            </tr>`;
        });
        container.innerHTML = html + `</table>`;
    } catch (e) {
        container.innerHTML = `<p class="text-center p-10 text-red-500 font-bold">Failed to sync database.</p>`;
    }
}

// UTILS
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

setInterval(() => {
    const n = new Date();
    const clock = document.getElementById('clock');
    if (clock) clock.innerText = n.getHours().toString().padStart(2,'0') + ":" + n.getMinutes().toString().padStart(2,'0');
}, 1000);

document.addEventListener('DOMContentLoaded', () => { 
    initUI(); 
    triggerRescan(); 

});
