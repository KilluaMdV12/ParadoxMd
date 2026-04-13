const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Impor konfigurasi awal secara global agar bisa diupdate realtime
global.config = require('./config');
// Import fungsi isOwner & contact store dari config
const { updateContacts } = require('./config');
// Impor message handler awal
let { messageHandler, groupParticipantsHandler } = require('./main');


/**
 * AUTO RELOAD / HOT RELOAD
 * Memantau perubahan file dan melakukan update otomatis tanpa restart bot
 */
fs.watch(__dirname, (eventType, filename) => {
    if (filename && filename.endsWith('.js')) {
        const filePath = path.join(__dirname, filename);
        
        // Hapus cache require agar file direload ulang
        delete require.cache[require.resolve(filePath)];
        
        try {
            if (filename === 'config.js') {
                global.config = require('./config');
                console.log(`[WATCHER] config.js (Global) berhasil diupdate!`);
            } else if (filename === 'main.js') {
                const main = require('./main');
                messageHandler = main.messageHandler;
                groupParticipantsHandler = main.groupParticipantsHandler;
                console.log(`[WATCHER] main.js berhasil diupdate!`);
            } else {
                console.log(`[WATCHER] File ${filename} berubah, cache dibersihkan.`);
            }
        } catch (err) {
            console.error(`[WATCHER ERROR] Gagal mereload ${filename}:`, err.message);
        }
    }
});

const logger = pino({ level: 'silent' });
const sessionPath = path.join(__dirname, 'session');

let isReconnecting = false; // Guard biar nggak spawn banyak instance

async function startBot() {
    if (isReconnecting) {
        console.log('[SISTEM] Reconnect sudah dijadwalkan, skip...');
        return;
    }

    isReconnecting = true;
    console.log(`[SISTEM] Memulai inisialisasi bot ${global.config.botName} by ${global.config.ownerName}...`);
    
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        browser: ['Ubuntu', 'Chrome', '20.0.0']
    });

    isReconnecting = false; // Reset setelah socket berhasil dibuat

    // Handle Minta Pairing Code
    if (!config.qrMode && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const number = config.pairingNumber.replace(/[^0-9]/g, '');
                let code = await sock.requestPairingCode(number);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n================================`);
                console.log(`[PAIRING CODE] MASUKKAN KODE INI: ${code}`);
                console.log(`================================\n`);
            } catch (err) {
                console.error('[EROR.PAIRING] Gagal meminta kode pairing:', err);
            }
        }, 3000);
    }

    // Save credentials saat ada update dari WA
    sock.ev.on('creds.update', saveCreds);

    // Simpan mapping contacts (LID -> nomor telepon) agar isOwner bisa resolve @lid
    sock.ev.on('contacts.update', (contacts) => updateContacts(contacts));
    sock.ev.on('contacts.upsert', (contacts) => updateContacts(contacts));

    // Handle koneksi
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && config.qrMode) {
            require('qrcode').toString(qr, { type: 'utf8', scale: 1, errorCorrectionLevel: 'L' })
                .then(qrStr => {
                    console.log('\n[QR] Silahkan scan QR Code berikut:\n');
                    console.log(qrStr);
                })
                .catch(() => {
                    console.log('\n[QR] Gagal render QR, coba restart bot.');
                });
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const isLoggedOut = reason === DisconnectReason.loggedOut || reason === 401;
            const isReplaced = reason === 440; // connectionReplaced
            
            if (isLoggedOut) {
                console.log('[KONEKSI] Session tidak valid / perangkat dikeluarkan.');
                console.log('[KONEKSI] Menghapus session lama secara otomatis...');
                try {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                    console.log('[KONEKSI] Session berhasil dihapus! Memuat ulang dalam 3 detik...');
                } catch (e) {
                    console.error('[KONEKSI] Gagal menghapus session:', e.message);
                }
                setTimeout(startBot, 3000);
            } else if (isReplaced) {
                console.log('[KONEKSI] Sesi digantikan oleh perangkat lain (440). Reconnect dalam 10 detik...');
                setTimeout(startBot, 10000);
            } else {
                console.log(`[KONEKSI] Koneksi terputus (Status: ${reason}). Reconnect dalam 5 detik...`);
                setTimeout(startBot, 5000);
            }
        } else if (connection === 'open') {
            console.log('[KONEKSI] Berhasil terhubung ke WhatsApp!');
        }
    });

    // Handle pesan masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const msg = messages[0];
        if (!msg.message) return;

        try {
            await messageHandler(sock, msg);
        } catch (error) {
            console.error('[EROR.HANDLER]', error);
        }
    });

    // Handle Member Grup Masuk/Keluar
    sock.ev.on('group-participants.update', async (update) => {
        try {
            await groupParticipantsHandler(sock, update);
        } catch (error) {
            console.error('[EROR.GROUP.PARTICIPANTS]', error);
        }
    });
}

startBot().catch(console.error);
