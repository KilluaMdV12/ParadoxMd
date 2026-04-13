const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'sewabot',
    alias: ['sewa'],
    category: 'owner',
    description: 'Toggle sistem sewa bot',
    usage: '.sewabot <on/off>',
    example: '.sewabot on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const pendingConfirmations = new Map()

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.text?.trim()?.toLowerCase()
    
    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }
    
    const currentStatus = db.db.data.sewa.enabled
    const sewaGroups = Object.keys(db.db.data.sewa.groups || {})
    
    if (!args) {
        return m.reply(
            `🔧 *sᴇᴡᴀʙᴏᴛ sʏsᴛᴇᴍ*\n\n` +
            `> Status: *${currentStatus ? 'AKTIF' : 'NONAKTIF'}*\n` +
            `> Grup terdaftar: *${sewaGroups.length}*\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> \`${m.prefix}sewabot on\` - Aktifkan\n` +
            `> \`${m.prefix}sewabot off\` - Nonaktifkan`
        )
    }
    
    if (args === 'off') {
        db.db.data.sewa.enabled = false
        db.db.write()
        m.react('✅')
        return m.reply(`✅ *sᴇᴡᴀʙᴏᴛ ɴᴏɴᴀᴋᴛɪꜰ*\n\n> Bot tidak akan meninggalkan grup apapun`)
    }
    
    if (args === 'on') {
        const pending = pendingConfirmations.get(m.sender)
        if (pending && pending.type === 'sewabot_on' && Date.now() - pending.timestamp < 60000) {
            return m.reply(`⏳ *ᴍᴇɴᴜɴɢɢᴜ ᴋᴏɴꜰɪʀᴍᴀsɪ*\n\n> Ketik \`${m.prefix}sewabot confirm\` untuk lanjut\n> Ketik \`${m.prefix}sewabot cancel\` untuk batal`)
        }
        
        pendingConfirmations.set(m.sender, {
            type: 'sewabot_on',
            timestamp: Date.now(),
            chat: m.chat
        })
        
        setTimeout(() => {
            if (pendingConfirmations.get(m.sender)?.type === 'sewabot_on') {
                pendingConfirmations.delete(m.sender)
            }
        }, 60000)
        
        return m.reply(
            `⚠️ *ᴡᴀʀɴɪɴɢ - sᴇᴡᴀʙᴏᴛ*\n\n` +
            `Jika sistem sewa diaktifkan:\n` +
            `┃ ✅ Ter-whitelist: \`${sewaGroups.length}\` grup\n` +
            `┃ ❌ Grup lain akan ditinggalkan!\n\n` +
            `> ⚠️ BOT AKAN MENINGGALKAN SEMUA GRUP YANG TIDAK TER-WHITELIST!\n\n` +
            `*Untuk konfirmasi:*\n` +
            `> \`${m.prefix}sewabot confirm\` - Lanjutkan\n` +
            `> \`${m.prefix}sewabot cancel\` - Batalkan\n\n` +
            `💡 _Whitelist grup penting dulu dengan:_\n` +
            `\`${m.prefix}addsewa <link grup> <durasi>\``
        )
    }
    
    if (args === 'confirm' || args === 'yes' || args === 'y') {
        const pending = pendingConfirmations.get(m.sender)
        if (!pending || pending.type !== 'sewabot_on') {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ada permintaan aktivasi sewabot yang pending\n> Ketik \`${m.prefix}sewabot on\` dulu`)
        }
        
        pendingConfirmations.delete(m.sender)
        
        db.db.data.sewa.enabled = true
        db.db.write()
        
        m.react('⏳')
        await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Sistem sewa diaktifkan.\n> Memproses auto-leave grup non-whitelist...`)
        
        try {
            global.isFetchingGroups = true
            const allGroups = await sock.groupFetchAllParticipating()
            global.isFetchingGroups = false
            const allGroupIds = Object.keys(allGroups)
            const unlistedGroups = allGroupIds.filter(id => !sewaGroups.includes(id))
            
            let leftCount = 0
            let failedCount = 0
            
            for (const groupId of unlistedGroups) {
                try {
                    await sock.sendMessage(groupId, {
                        text: `⛔ *sᴇᴡᴀʙᴏᴛ*\n\n> Grup ini tidak terdaftar dalam sistem sewa.\n> Bot akan meninggalkan grup ini.\n\n_Hubungi owner untuk sewa bot._`
                    })
                    await new Promise(r => setTimeout(r, 2000))
                    await sock.groupLeave(groupId)
                    leftCount++
                    await new Promise(r => setTimeout(r, 3000))
                } catch (e) {
                    failedCount++
                }
            }
            
            m.react('✅')
            return m.reply(
                `✅ *sᴇᴡᴀʙᴏᴛ ᴀᴋᴛɪꜰ*\n\n` +
                `> Sistem sewa aktif\n` +
                `> Grup ter-whitelist: \`${sewaGroups.length}\`\n` +
                `> Keluar dari: \`${leftCount}\` grup\n` +
                `> Gagal: \`${failedCount}\` grup`
            )
        } catch (e) {
            m.react('✅')
            return m.reply(
                `✅ *sᴇᴡᴀʙᴏᴛ ᴀᴋᴛɪꜰ*\n\n` +
                `> Sistem sewa aktif\n` +
                `> Grup ter-whitelist: \`${sewaGroups.length}\`\n` +
                `> ⚠️ Gagal auto-leave: ${e.message}\n` +
                `> Gunakan \`${m.prefix}sewabot leave\` untuk retry`
            )
        }
    }
    
    if (args === 'leave') {
        if (!currentStatus) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Aktifkan sewabot dulu dengan \`${m.prefix}sewabot on\``)
        }
        
        m.react('⏳')
        await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Mengambil daftar grup...`)
        
        global.sewaLeaving = true
        
        try {
            global.isFetchingGroups = true
            const allGroups = await sock.groupFetchAllParticipating()
            global.isFetchingGroups = false
            const allGroupIds = Object.keys(allGroups)
            const unlistedGroups = allGroupIds.filter(id => !sewaGroups.includes(id))
            
            if (unlistedGroups.length === 0) {
                delete global.sewaLeaving
                m.react('✅')
                return m.reply(`✅ *sᴇʟᴇsᴀɪ*\n\n> Tidak ada grup yang perlu ditinggalkan`)
            }
            
            await m.reply(`📊 *ɪɴꜰᴏ*\n\n> Total grup: \`${allGroupIds.length}\`\n> Ter-whitelist: \`${sewaGroups.length}\`\n> Akan keluar dari: \`${unlistedGroups.length}\` grup\n\n> Memproses...`)
            
            let leftCount = 0
            let failedCount = 0
            
            for (const groupId of unlistedGroups) {
                try {
                    await sock.sendMessage(groupId, {
                        text: `👋 *sᴇᴡᴀʙᴏᴛ*\n\n> Grup ini tidak terdaftar dalam sistem sewa.\n> Bot akan meninggalkan grup ini.\n\n_Hubungi owner untuk sewa bot._`
                    })
                    await new Promise(r => setTimeout(r, 3000))
                    await sock.groupLeave(groupId)
                    leftCount++
                    await new Promise(r => setTimeout(r, 5000))
                } catch (e) {
                    failedCount++
                }
            }
            
            delete global.sewaLeaving
            m.react('✅')
            return m.reply(
                `✅ *sᴇʟᴇsᴀɪ*\n\n` +
                `> Berhasil keluar: \`${leftCount}\` grup\n` +
                `> Gagal: \`${failedCount}\` grup`
            )
        } catch (e) {
            delete global.sewaLeaving
            m.react('❌')
            return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${e.message}`)
        }
    }
    
    if (args === 'cancel' || args === 'no' || args === 'n') {
        const pending = pendingConfirmations.get(m.sender)
        if (!pending || pending.type !== 'sewabot_on') {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ada permintaan yang pending`)
        }
        
        pendingConfirmations.delete(m.sender)
        m.react('❌')
        return m.reply(`❌ *ᴅɪʙᴀᴛᴀʟᴋᴀɴ*\n\n> Aktivasi sewabot dibatalkan.\n> Whitelist grup penting dulu dengan \`${m.prefix}addsewa\``)
    }
    
    return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Pilihan tidak valid.\n\n*ᴏᴘsɪ:*\n> \`on\` - Aktifkan\n> \`off\` - Nonaktifkan\n> \`confirm\` - Konfirmasi\n> \`leave\` - Tinggalkan grup non-whitelist\n> \`cancel\` - Batalkan`)
}

module.exports = {
    config: pluginConfig,
    handler,
    pendingConfirmations
}
