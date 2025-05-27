const clases = [
    { clase: 'A', rango: [1, 126], mascara: '255.0.0.0', cidr: '/8', ips: 256 * 256 * 256, conf: 256 * 256 * 256 - 2,nroIpDistintas: 127 },
    { clase: 'B', rango: [128, 191], mascara: '255.255.0.0', cidr: '/16', ips: 256 * 256, conf: 256 * 256 - 2,nroIpDistintas: 64*256  },
    { clase: 'C', rango: [192, 223], mascara: '255.255.255.0', cidr: '/24', ips: 256, conf: 254, nroIpDistintas: 32*256*256  },
    { clase: 'D', rango: [224, 239], mascara: 'Multicast', cidr: '', ips: '-', conf: '-' },
    { clase: 'E', rango: [240, 255], mascara: 'Reservada', cidr: '', ips: '-', conf: '-' }
];

function analizarIP(ip) {
    const octetos = ip.split('.').map(Number);
    if (octetos.length !== 4 || octetos.some(o => o < 0 || o > 255)) return null;
    const clase = clases.find(c => octetos[0] >= c.rango[0] && octetos[0] <= c.rango[1]);
    if (!clase) return null;

    let datos = {
        clase: clase.clase,
        mascara: clase.mascara + (clase.cidr ? ' ' + clase.cidr : ''),
        nroIPs: clase.ips,
        nroIPsConf: clase.conf,
        ipHost: ip,
        idRed: '',
        idHost: '',
        ipRed: '',
        broadcast: '',
        nroIpDistintas: clase.nroIpDistintas,
    };

    if (clase.clase === 'A') {
        datos.ipRed = `${octetos[0]}.0.0.0`;
        datos.broadcast = `${octetos[0]}.255.255.255`;
        datos.idRed = `${octetos[0]}`;
        datos.idHost = `${octetos[1]}.${octetos[2]}.${octetos[3]}`;
    } else if (clase.clase === 'B') {
        datos.ipRed = `${octetos[0]}.${octetos[1]}.0.0`;
        datos.broadcast = `${octetos[0]}.${octetos[1]}.255.255`;
        datos.idRed = `${octetos[0]}.${octetos[1]}`;
        datos.idHost = `${octetos[2]}.${octetos[3]}`;
    } else if (clase.clase === 'C') {
        datos.ipRed = `${octetos[0]}.${octetos[1]}.${octetos[2]}.0`;
        datos.broadcast = `${octetos[0]}.${octetos[1]}.${octetos[2]}.255`;
        datos.idRed = `${octetos[0]}.${octetos[1]}.${octetos[2]}`;
        datos.idHost = `${octetos[3]}`;
    } else {
        datos.ipRed = '-';
        datos.broadcast = '-';
        datos.idRed = '-';
        datos.idHost = '-';
    }
    return datos;
}

function horaActual() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Manejo de cache en localStorage
function getCache() {
    return JSON.parse(localStorage.getItem('ipCache') || '[]');
}
function setCache(arr) {
    localStorage.setItem('ipCache', JSON.stringify(arr));
}

function agregarCache(ip) {
    let cache = getCache();
    // Buscar si ya existe la IP en cache
    const idx = cache.findIndex(item => item.ip === ip);
    if (idx !== -1) {
        cache.splice(idx, 1);
    }
    cache.unshift({ ip, hora: horaActual() });

    cache = cache.slice(0, 10);
    setCache(cache);
}

function renderRecientes() {
    const recientes = getCache();
    const ul = document.getElementById('recientes');
    ul.innerHTML = '';
    if (recientes.length === 0) {
        ul.innerHTML = `<li class="text-gray-400 text-sm">Sin consultas recientes</li>`;
        return;
    }
    recientes.forEach((item, idx) => {
        ul.innerHTML += `
        <li class="border-b border-gray-800">
            <button class="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-[#232946]/90 text-white transition text-left cursor-pointer"
                data-ip="${item.ip}">
                <span>${item.ip}</span>
                <span class="text-xs text-gray-400">${item.hora}</span>
            </button>
        </li>

        `;
    });
}

// Mostrar detalles de IP en #resultados y poner la IP en el input
function mostrarDetalles(ip) {
    const datos = analizarIP(ip);
    const resultados = document.getElementById('resultados');
    document.getElementById('ipInput').value = ip;
    if (datos) {
        resultados.innerHTML = `
            <div class="p-5 bg-[#28293b]/10 rounded-md shadow-lg border border-gray-800 ">
                <h2 class="font-bold text-lg mb-2">Clase <span class="text-2xl text-blue-500"> ${datos.clase}</span></h2>
                <div><b>IP de red:</b> ${datos.ipRed}</div>
                <div><b>IP de host:</b> ${datos.ipHost}</div>
                <div><b>ID de red:</b> ${datos.idRed}</div>
                <div><b>ID de host:</b> ${datos.idHost}</div>
                <div><b>Broadcast:</b> ${datos.broadcast}</div>
                <div><b>Nro de IPs:</b> ${datos.nroIPs}</div>
                <div><b>Nro de IPs configurables:</b> ${datos.nroIPsConf}</div>
                <div><b>Máscara:</b> ${datos.mascara}</div>
                     <div><b>Ips distintas:</b> ${datos.nroIpDistintas}</div>
            </div>
        `;
    } else {
        resultados.innerHTML = `<div class="p-4 rounded bg-red-800/80">IP inválida o fuera de rango.</div>`;
    }
}

document.getElementById('ipForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const ip = document.getElementById('ipInput').value.trim();
    const datos = analizarIP(ip);
    mostrarDetalles(ip);
    if (datos) {
        agregarCache(ip);
        renderRecientes();
    }
});
// Evento click en consultas recientes
document.getElementById('recientes').addEventListener('click', function (e) {
    if (e.target.closest('button[data-ip]')) {
        const ip = e.target.closest('button[data-ip]').getAttribute('data-ip');
        mostrarDetalles(ip);
    }
});

renderRecientes();