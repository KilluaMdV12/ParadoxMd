const config = require('../../config');
const fs = require('fs').promises;
const path = require('path');

const FLUSH_INTERVAL_MS = 5000;

const defaultUsers = {};
const defaultGroups = {};
const defaultSettings = { selfMode: false };
const defaultStats = {};
const defaultSewa = { enabled: false, groups: {} };

class Database {
    constructor() {
        this.stores = {};
        this.dirty = { users: false, groups: false, settings: false, stats: false, sewa: false, premium: false, owner: false, partner: false };
        this.db = { data: { users: {}, groups: {}, settings: {}, stats: {}, sewa: { enabled: false, groups: {} } } };
        this.ready = false;
        this.flushTimer = null;
        this.dbPath = path.join(process.cwd(), 'database.json');
    }

    async init() {
        try {
            const fileMap = {
                users: defaultUsers,
                groups: defaultGroups,
                settings: defaultSettings,
                stats: defaultStats,
                sewa: defaultSewa,
                premium: [],
                owner: [],
                partner: []
            };

            let existingData = {};
            try {
                const content = await fs.readFile(this.dbPath, 'utf8');
                existingData = JSON.parse(content);
            } catch (e) {
                // File doesn't exist or is invalid
            }

            for (const [key, defaults] of Object.entries(fileMap)) {
                let data = existingData[key];
                if (data === undefined) {
                    data = defaults;
                } else {
                    if (Array.isArray(defaults)) {
                        if (!Array.isArray(data)) data = defaults;
                    } else {
                        data = { ...defaults, ...data };
                    }
                }

                this.stores[key] = {
                    data,
                    write: async () => {
                        this.markDirty(key);
                    }
                };
            }

            this.db.data = {
                users: this.stores.users.data,
                groups: this.stores.groups.data,
                settings: this.stores.settings.data,
                stats: this.stores.stats.data,
                sewa: this.stores.sewa.data,
                premium: this.stores.premium.data,
                owner: this.stores.owner.data,
                partner: this.stores.partner.data,
            };

            this.db.write = () => this.flushAll();
            this.db.read = () => this.readAll();

            this.startFlushTimer();
            this.registerShutdownHooks();

            // Energy sync logic
            const currentDefault = config.energi?.default ?? 25;
            const currentPremium = config.energi?.premium ?? 100;
            const lastDefault = this.db.data.settings._lastEnergiDefault;
            const lastPremium = this.db.data.settings._lastEnergiPremium;

            if (lastDefault !== currentDefault || lastPremium !== currentPremium) {
                const users = this.db.data.users;
                let synced = 0;
                for (const jid in users) {
                    const u = users[jid];
                    if (u.energi === -1) continue;
                    if (u.isPremium) {
                        u.energi = currentPremium;
                    } else {
                        u.energi = currentDefault;
                    }
                    synced++;
                }
                this.db.data.settings._lastEnergiDefault = currentDefault;
                this.db.data.settings._lastEnergiPremium = currentPremium;
                this.markDirty('users');
                this.markDirty('settings');
                if (synced > 0) {
                    console.log(`[Database] Energi sync: ${synced} user di-update (default: ${currentDefault}, premium: ${currentPremium})`)
                }
            }

            this.ready = true;
            console.log('[Database] Local JSON database siap (debounced write setiap 5s)');
            return this;
        } catch (error) {
            console.error('[Database] Gagal inisialisasi:', error.message);
            this.ready = true;
            return this;
        }
    }

    startFlushTimer() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this.flushTimer = setInterval(() => this.flushDirty(), FLUSH_INTERVAL_MS);
        if (this.flushTimer.unref) this.flushTimer.unref();
    }

    registerShutdownHooks() {
        const flush = async () => {
            try { await this.flushAll(); } catch {}
        };
        process.on('exit', flush);
        process.on('beforeExit', flush);
    }

    markDirty(key) {
        this.dirty[key] = true;
    }

    async flushDirty() {
        if (Object.values(this.dirty).some(v => v)) {
            await this.flushAll();
        }
    }

    async flushAll() {
        try {
            const data = {};
            for (const [key, store] of Object.entries(this.stores)) {
                data[key] = store.data;
            }
            await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
            for (const key of Object.keys(this.dirty)) this.dirty[key] = false;
        } catch (e) {
            console.error(`[Database] Failed to flush to local file:`, e.message);
        }
    }


    readAll() {
        // Obsolete in Turso KV setup as it stays purely online
    }

    async save() {
        try {
            await this.flushAll();
            return true;
        } catch (error) {
            console.error('[Database] Gagal menyimpan:', error.message);
            return false;
        }
    }

    getUser(jid) {
        if (!jid) return null;
        const cleanJid = jid.replace(/@.+/g, '');
        return this.db.data.users[cleanJid] || null;
    }

    setUser(jid, data = {}) {
        if (!jid) return null;
        const cleanJid = jid.replace(/@.+/g, '');
        const existing = this.db.data.users[cleanJid] || {};

        const existingBalance = existing.balance !== undefined ? existing.balance : 0;
        if (existing.balance !== undefined) delete existing.balance;
        const existingLimit = existing.limit !== undefined ? existing.limit : (config.energi?.default || 25);
        if (existing.limit !== undefined) delete existing.limit;

        this.db.data.users[cleanJid] = {
            ...existing,
            jid: cleanJid,
            name: data.name || existing.name || 'Unknown',
            number: cleanJid,
            energi: data.energi ?? existing.energi ?? existingLimit,
            isPremium: data.isPremium ?? existing.isPremium ?? false,
            isBanned: data.isBanned ?? existing.isBanned ?? false,
            exp: data.exp ?? existing.exp ?? 0,
            level: data.level ?? existing.level ?? 1,
            koin: data.koin ?? existing.koin ?? existingBalance,
            unlockedFeatures: data.unlockedFeatures ?? existing.unlockedFeatures ?? [],
            registeredAt: existing.registeredAt || new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            cooldowns: data.cooldowns ?? existing.cooldowns ?? {},
            clanId: data.clanId ?? existing.clanId ?? null,
            isRegistered: data.isRegistered ?? existing.isRegistered ?? false,
            regName: data.regName ?? existing.regName ?? null,
            regAge: data.regAge ?? existing.regAge ?? null,
            regGender: data.regGender ?? existing.regGender ?? null,
            rpg: { ...(existing.rpg || {}), ...(data.rpg || {}) },
            inventory: { ...(existing.inventory || {}), ...(data.inventory || {}) },
            ...data,
            access: data.access || existing.access || [],
        };

        this.markDirty('users');
        return this.db.data.users[cleanJid];
    }

    deleteUser(jid) {
        if (!jid) return false;
        const cleanJid = jid.replace(/@.+/g, '');
        if (this.db.data.users[cleanJid]) {
            delete this.db.data.users[cleanJid];
            this.markDirty('users');
            return true;
        }
        return false;
    }

    getAllUsers() {
        return this.db.data.users || {};
    }

    getUserCount() {
        return Object.keys(this.db.data.users || {}).length;
    }

    updateEnergi(jid, amount) {
        const user = this.getUser(jid) || this.setUser(jid);
        if (user.energi === -1) return -1;
        user.energi = Math.max(0, (user.energi || 0) + amount);
        this.setUser(jid, user);
        return user.energi;
    }

    updateKoin(jid, amount) {
        const user = this.getUser(jid) || this.setUser(jid);
        const MAX_KOIN = 9000000000000;
        user.koin = Math.max(0, Math.min(MAX_KOIN, (user.koin || 0) + amount));
        this.setUser(jid, user);
        return user.koin;
    }

    updateExp(jid, amount) {
        const user = this.getUser(jid) || this.setUser(jid);
        const MAX_EXP = 9000000000;
        user.exp = Math.max(0, Math.min(MAX_EXP, (user.exp || 0) + amount));
        this.setUser(jid, user);
        return user.exp;
    }

    getTopUsers(field, limit = 10) {
        const users = Object.values(this.db.data.users || {});
        return users
            .filter(u => (u[field] || 0) > 0)
            .sort((a, b) => (b[field] || 0) - (a[field] || 0))
            .slice(0, limit);
    }

    checkCooldown(jid, command, seconds) {
        let user = this.getUser(jid);
        if (!user) {
            this.setUser(jid);
            user = this.getUser(jid);
        }
        if (!user) return false;
        if (!user.cooldowns || typeof user.cooldowns !== 'object') {
            user.cooldowns = {};
            this.setUser(jid, { cooldowns: {} });
        }
        const now = Date.now();
        const cooldownEnd = user.cooldowns[command] || 0;
        if (now < cooldownEnd) {
            return Math.ceil((cooldownEnd - now) / 1000);
        }
        return false;
    }

    setCooldown(jid, command, seconds) {
        let user = this.getUser(jid);
        if (!user) user = this.setUser(jid, { cooldowns: {} });
        if (!user) return;
        if (!user.cooldowns || typeof user.cooldowns !== 'object') user.cooldowns = {};
        user.cooldowns[command] = Date.now() + (seconds * 1000);
        this.setUser(jid, { cooldowns: user.cooldowns });
    }

    getGroup(jid) {
        if (!jid) return null;
        return this.db.data.groups[jid] || null;
    }

    setGroup(jid, data = {}) {
        if (!jid) return null;
        const existing = this.db.data.groups[jid] || {};

        let cfg;
        try { cfg = require('../../config'); } catch { cfg = {}; }
        const welcomeDefault = cfg.welcome?.defaultEnabled ?? false;
        const goodbyeDefault = cfg.goodbye?.defaultEnabled ?? false;

        this.db.data.groups[jid] = {
            ...existing,
            jid,
            name: data.name || existing.name || 'Unknown Group',
            welcome: data.welcome ?? existing.welcome ?? welcomeDefault,
            leave: data.leave ?? existing.leave ?? goodbyeDefault,
            goodbye: data.goodbye ?? existing.goodbye ?? goodbyeDefault,
            antilink: data.antilink ?? existing.antilink ?? false,
            antitoxic: data.antitoxic ?? existing.antitoxic ?? false,
            mute: data.mute ?? existing.mute ?? false,
            warnings: data.warnings ?? existing.warnings ?? [],
            welcomeMsg: data.welcomeMsg ?? existing.welcomeMsg,
            goodbyeMsg: data.goodbyeMsg ?? existing.goodbyeMsg,
            intro: data.intro ?? existing.intro,
            chat: existing.chat ?? {},
            ...data,
        };

        this.markDirty('groups');
        return this.db.data.groups[jid];
    }

    getAllGroups() {
        return this.db.data.groups || {};
    }

    setting(key, value = undefined) {
        if (value !== undefined) {
            this.db.data.settings[key] = value;
            this.markDirty('settings');
        }
        return this.db.data.settings[key];
    }

    getSettings() {
        return this.db.data.settings || {};
    }

    incrementStat(key, increment = 1) {
        if (!this.db.data.stats[key]) this.db.data.stats[key] = 0;
        this.db.data.stats[key] += increment;
        this.markDirty('stats');
        return this.db.data.stats[key];
    }

    getStats(key) {
        if (key) return this.db.data.stats[key] || 0;
        return this.db.data.stats || {};
    }

    resetAllEnergi(defaultEnergi = 25, premiumEnergi = -1) {
        let count = 0;
        for (const jid of Object.keys(this.db.data.users)) {
            const user = this.db.data.users[jid];
            user.energi = user.isPremium ? premiumEnergi : defaultEnergi;
            count++;
        }
        this.markDirty('users');
        return count;
    }

    backup() {
        this.flushAll();
        return "Backup auto ditangani oleh Turso";
    }
    get users() { return this.db.data.users }
    get groups() { return this.db.data.groups }
    get settings() { return this.db.data.settings }
    get stats() { return this.db.data.stats }
    get sewa() { return this.db.data.sewa }
    get premium() { return this.db.data.premium }
    get owner() { return this.db.data.owner }
    get partner() { return this.db.data.partner }

    get data() {
        return this.db.data;
    }

    set data(val) {
        this.db.data = val;
    }
}

let dbInstance = null;

async function initDatabase() {
    if (!dbInstance) {
        dbInstance = new Database();
        await dbInstance.init();
    }
    return dbInstance;
}

function getDatabase() {
    if (!dbInstance) {
        throw new Error('Database belum diinisialisasi. Panggil initDatabase terlebih dahulu.');
    }
    return dbInstance;
}

module.exports = {
    Database,
    initDatabase,
    getDatabase
};
