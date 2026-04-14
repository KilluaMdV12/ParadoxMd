/**
 * Untuk gambar/audio/video, ada di folder 'assets'
 * 
 * Credits & Thanks to
 * Developer = Laww
 * Lead owner = Laww
 * Owner = Keisya
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEK
 * 
 * Saluran Resmi Zenos:
 * https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t 
 */

const config = {

    info: {
        website: '-',
        grupwa: 'https://chat.whatsapp.com/C8pzXYhMJMyKbHMdehT9Yt'
    },

    owner: {
        name: 'Minzy',                    // -
        number: ["6287763584278","6285862197236"]          // Format: 628xxx (tanpa + atau 0)
    },

    session: {
        pairingNumber: '6287763584278',   // Nomor WA yang akan di-pair
        usePairingCode: true              // true = Pairing Code, false = QR Code
    },

    bot: {
        name: 'ParadoxMd',                 // Nama bot
        version: '2.1.0',                 // Versi bot
        developer: 'Minzy'          // Nama developer
    },

    mode: 'public',

    command: {
        prefix: '.'                      // Prefix utama (.menu, .help, dll)
    },

    vercel: {
        // ambil token vercel: https://vercel.com/account/tokens
        token: ''                        // Vercel Token untuk fitur deploy ( Kalau .deploy mau work, ini wajib di isi )
    },

    store: {
        payment: [
            { name: 'Dana', number: '', holder: '-' },
            { name: 'OVO', number: '', holder: '-' },
            { name: 'GoPay', number: '', holder: '-' },
            { name: 'ShopeePay', number: '', holder: '-' }
        ],
        qris: ''
    },

    donasi: {
        payment: [
            { name: 'Dana', number: '', holder: '-' },
            { name: 'GoPay', number: '', holder: '-' },
            { name: 'OVO', number: '', holder: '-' }
        ],
        links: [
            { name: 'Saweria', url: 'saweria.co/username' },
            { name: 'Trakteer', url: 'trakteer.id/username' }
        ],
        benefits: [
            'Mendukung development',
            'Server lebih stabil',
            'Fitur baru lebih cepat',
            'Priority support'
        ],
        qris: '-'
    },

    energi: {
        enabled: false, // Jika true, maka sistem energi/limit akan bekerja
        default: 99999,
        premium: 99999999,
        owner: -1
    },

    sticker: {
        packname: 'ParadoxMd',             // Nama pack sticker
        author: 'Minzy'                     // Author sticker
    },

    saluran: {
        id: '-', // ID saluran (contoh: 120363xxx@newsletter)                          // ID saluran (contoh: 120363xxx@newsletter)
        name: '-',       // Nama saluran
        link: '-'                          // Link saluran
    },

    groupProtection: {
        antilink: '⚠ *Antilink* — @%user% mengirim link.\nPesan dihapus.',
        antilinkKick: '⚠ *Antilink* — @%user% di-kick karena mengirim link.',
        antilinkGc: '⚠ *Antilink WA* — @%user% mengirim link WA.\nPesan dihapus.',
        antilinkGcKick: '⚠ *Antilink WA* — @%user% di-kick karena mengirim link WA.',
        antilinkAll: '⚠ *Antilink* — @%user% mengirim link.\nPesan dihapus.',
        antilinkAllKick: '⚠ *Antilink* — @%user% di-kick karena mengirim link.',
        antitagsw: '⚠ *AntiTagSW* — Tag status dari @%user% dihapus.',
        antiviewonce: '👁️ *ViewOnce* — Dari @%user%',
        antiremove: '🗑️ *AntiDelete* — @%user% menghapus pesan:',
        antihidetag: '⚠ *AntiHidetag* — Hidetag dari @%user% dihapus.',
        antitoxicWarn: '⚠ @%user% berkata kasar.\nPeringatan ke %warn% dari %max%, pelanggaran berikutnya bisa di-%method%.',
        antitoxicAction: '🚫 @%user% di-%method% karena toxic. (%warn%/%max%)',
        antidocument: '⚠ *AntiDocument* — Dokumen dari @%user% dihapus.',
        antisticker: '⚠ *AntiSticker* — Sticker dari @%user% dihapus.',
        antimedia: '⚠ *AntiMedia* — Media dari @%user% dihapus.',
        antibot: '🤖 *AntiBot* — @%user% terdeteksi sebagai bot dan di-kick.',
        notAdmin: '⚠ Bot bukan admin, tidak bisa menghapus pesan.'
    },

    features: {
        antiSpam: true,
        antiSpamInterval: 3000,
        antiCall: true, // Jika true, bot akan menolak panggilan masuk
        blockIfCall: true, // Jika true, bot akan memblokir nomor yang menelpon bot
        autoTyping: true,
        autoRead: false,
        logMessage: true,
        dailyLimitReset: true,
        smartTriggers: false
    },

    registration: {
        enabled: false, // Jika true, user harus mendaftar sebelum menggunakan bot
        rewards: {
            koin: 30000,
            energi: 300,
            exp: 300000
        }
    },

    welcome: { defaultEnabled: false },
    goodbye: { defaultEnabled: false },

    premiumUsers: [],
    partnerUsers: [],
    bannedUsers: [],


    ui: {
        menuVariant: 3
    },

    messages: {
        wait: '⏳ *Proses...* Mohon tunggu sebentar ya.',
        success: '✅ *Berhasil!* Permintaan kamu sudah selesai.',
        error: '❌ *Error!* Ada masalah pada sistem, coba lagi nanti.',

        ownerOnly: '*Akses Ditolak!* Fitur ini khusus untuk Owner bot.',
        premiumOnly: '💎 *Premium Only!* Fitur ini khusus member Premium. Ketik *.benefitpremium* untuk info upgrade.',

        groupOnly: '👥 *Group Only!* Fitur ini hanya bisa digunakan di dalam grup.',
        privateOnly: '  *Private Only!* Fitur ini hanya bisa digunakan di chat pribadi bot.',

        adminOnly: ' ️ *Admin Only!* Kamu harus jadi Admin grup untuk pakai fitur ini.',
        botAdminOnly: '🤖 *Bot Bukan Admin!* Jadikan bot sebagai Admin grup dulu biar bisa kerja.',

        cooldown: '⏳ *Tunggu Dulu!* Kamu masih dalam cooldown. Tunggu %time% detik lagi ya.',
        energiExceeded: '⚡ *Energi Habis!* Energi kamu sudah habis. Tunggu reset besok atau beli Premium.',

        banned: '🚫 *Kamu Dibanned!* Kamu tidak bisa menggunakan bot ini karena telah melanggar aturan.',

        rejectCall: '🚫 JANGAN TELPON NOMOR INI WEH',
    },

    database: { path: './database/main' },
    backup: { enabled: false, intervalHours: 24, retainDays: 7 },
    scheduler: { resetHour: 0, resetMinute: 0 },

    // Dev mode settings (auto-enabled jika NODE_ENV=development)
    dev: {
        enabled: process.env.NODE_ENV === 'development',
        watchPlugins: true,    // Hot reload plugins (SAFE)
        watchSrc: false,       // DISABLED - src reload causes connection conflict 440
        debugLog: false        // Show stack traces
    },

    // bisa dikosongin
    pterodactyl: {
        server1: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server2: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server3: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server4: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server5: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        }
    },

    digitalocean: {
        token: '',
        region: 'sgp1',
        sellers: [],
        ownerPanels: []
    },

    // NOTE: ini di versi free gak ada yak, adanya cuma di sc pt doang
    //  daftar di: https://pakasir.com/
    pakasir: {
        enabled: true,
        slug: '',
        apiKey: '',
        defaultMethod: 'qris',
        sandbox: false,
        pollingInterval: 5000
    },

    // NOTE: ini di versi free gak ada yak, adanya cuma di sc pt doang
    // Ambil apikey di: https://ditznesia.id -> Daftar -> Masuk ke Profile -> AMbile Apikey
    jasaotp: {
        apiKey: '',
        markup: 2000,
        timeout: 300
    },

    //  APIkey
    APIkey: {
        lolhuman: 'APIKey-Milik-Bot-ZenosMD(Laww,LawwN,Keisya,Danzz)',
        neoxr: 'Milik-Bot-ZenosMD',
        google: 'AIzaSyAS-KiW0SrwiYKwexeBcGPijBVHFg2R_vo',
        groq: '' // API Key Groq untuk fitur transkrip (gratis di console.groq.com)
    }
};


// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - Jangan diubah nanti elol!
// ═══════════════════════════════════════════════════════════════════════════

function isOwner(number) {
    if (!number) return false;
    const cleanNumber = number.replace(/[^0-9]/g, '');
    if (!cleanNumber) return false;

    // Check config first (static)
    if (config.owner?.number?.includes(cleanNumber)) return true;

    // Auto-Owner: Always treat the pairing number as an owner!
    if (config.session?.pairingNumber) {
        const cleanPairing = config.session.pairingNumber.replace(/[^0-9]/g, '');
        if (cleanNumber === cleanPairing) return true;
    }

    try {
        const { getDatabase } = require('./src/lib/database');
        const db = getDatabase();
        if (!db) return false;

        if (db && db.data && Array.isArray(db.data.owner)) {
            if (db.data.owner.includes(cleanNumber)) return true
        }
        if (db) {
            const definedOwner = db.setting('ownerNumbers')
            if (Array.isArray(definedOwner) && definedOwner.includes(cleanNumber)) return true
        }

        return false
    } catch {
        return false
    }
}

function isPremium(number) {
    if (!number) return false
    if (isOwner(number)) return true

    const cleanNumber = number.replace(/[^0-9]/g, '')
    const premiumList = config.premiumUsers || []

    const inConfig = premiumList.some(premium => {
        if (!premium) return false
        const cleanPremium = premium.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
    })

    if (inConfig) return true

    try {
        const ownerPremiumDb = require('./src/lib/ownerPremiumDb')
        if (ownerPremiumDb.isPremium(cleanNumber)) return true
    } catch { }

    try {
        const { getDatabase } = require('./src/lib/database')
        const db = getDatabase()
        if (db && db.data && Array.isArray(db.data.premium)) {
            const now = Date.now()
            const found = db.data.premium.find(p => {
                if (typeof p === 'string') return p === cleanNumber
                if (p.id) return p.id === cleanNumber
                return false
            })

            if (found) {
                if (typeof found === 'string') return true
                if (found.expired && found.expired < now) return false
                return true
            }
        }
        if (db) {
            const savedPremium = db.setting('premiumUsers') || []
            const inDb = savedPremium.some(premium => {
                if (!premium) return false
                const cleanPremium = premium.replace(/[^0-9]/g, '')
                return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
            })
            if (inDb) return true
        }
    } catch { }

    return false
}

function isPartner(number) {
    if (!number) return false
    if (isOwner(number)) return true

    const cleanNumber = number.replace(/[^0-9]/g, '')
    const partnerList = config.partnerUsers || []

    const inConfig = partnerList.some(partner => {
        if (!partner) return false
        const cleanPartner = partner.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPartner || cleanNumber.endsWith(cleanPartner) || cleanPartner.endsWith(cleanNumber)
    })

    if (inConfig) return true

    try {
        const ownerPremiumDb = require('./src/lib/ownerPremiumDb')
        if (ownerPremiumDb.isPartner(cleanNumber)) return true
    } catch { }

    return false
}

function isBanned(number) {
    if (!number) return false
    if (isOwner(number)) return false

    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.bannedUsers.some(banned => {
        const cleanBanned = banned.replace(/[^0-9]/g, '')
        return cleanNumber === cleanBanned || cleanNumber.endsWith(cleanBanned) || cleanBanned.endsWith(cleanNumber)
    })
}

function setBotNumber(number) {
    if (number) config.bot.number = number.replace(/[^0-9]/g, '')
}

function isSelf(number) {
    if (!number || !config.bot.number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const botNumber = config.bot.number.replace(/[^0-9]/g, '')
    return cleanNumber.includes(botNumber) || botNumber.includes(cleanNumber)
}

function getConfig() { return config }

module.exports = {
    ...config,
    config,
    getConfig,
    isOwner,
    isPartner,
    isPremium,
    isBanned,
    setBotNumber,
    isSelf
}
