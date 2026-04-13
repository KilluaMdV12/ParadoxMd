const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'tembak',
    alias: ['nembak', 'propose'],
    category: 'fun',
    description: 'Menembak seseorang untuk pacaran',
    usage: '.tembak @tag',
    example: '.tembak @628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

if (!global.tembakSessions) global.tembakSessions = {}

const SESSION_TIMEOUT = 3600000
const romanticQuotes = [
    'Aku bukan pilot, tapi aku bisa buat hatimu terbang tinggi bersamaku 💕',
    'Kamu tau kenapa aku suka hujan? Karena hujan itu seperti kamu, sejuk di hati 🌧️',
    'Kamu adalah alasan kenapa aku senyum tanpa sebab 😊',
    'Kalau kamu bintang, aku mau jadi langit yang selalu nemenin kamu ✨',
    'Aku gak butuh GPS, karena hatiku udah nunjuk ke arahmu 💘',
    'Kamu tau bedanya kamu sama kopi? Kopi bikin melek, kamu bikin aku nggak bisa tidur mikirin kamu ☕',
    'Boleh pinjam hatimu? Janji bakal dijaga selamanya 💖',
    'Kalau cinta itu adalah lagu, kamu adalah melodi terindahnya 🎵',
    'Aku butuh 3 hal: Matahari, Bulan, dan Kamu. Matahari untuk siang, Bulan untuk malam, Kamu untuk selamanya 🌙',
    'Kamu adalah puzzle terakhir yang kubutuhkan untuk melengkapi hidupku 🧩'
]

let thumbFun = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'zenos-games.jpg')
    if (fs.existsSync(thumbPath)) thumbFun = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '💘 *ᴛᴇᴍʙᴀᴋ*', body = 'Confess your love!') {
    const saluranId = config.saluran?.id || '120363407633768956@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Zenos-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbFun) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbFun,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    
    let targetJid = null
    
    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        targetJid = m.mentionedJid[0]
    } else if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, '')
        if (num.length > 5 && num.length < 20) {
            targetJid = num + '@s.whatsapp.net'
        }
    }
    
    if (!targetJid) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}tembak @tag\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}tembak @628xxx\`\n` +
            `> Reply pesan + \`${m.prefix}tembak\``
        )
    }
    
    if (targetJid === m.sender) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa menembak diri sendiri!`)
    }
    
    if (targetJid === m.botNumber) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot tidak bisa pacaran!`)
    }
    
    let senderData = db.getUser(m.sender) || {}
    let targetData = db.getUser(targetJid) || {}
    
    if (!senderData.fun) senderData.fun = {}
    if (!targetData.fun) targetData.fun = {}
    
    if (senderData.fun.pasangan && senderData.fun.pasangan !== targetJid) {
        const partnerData = db.getUser(senderData.fun.pasangan)
        if (partnerData?.fun?.pasangan === m.sender) {
            return m.reply(
                `❌ *sᴜᴅᴀʜ ᴘᴜɴʏᴀ ᴘᴀsᴀɴɢᴀɴ*\n\n` +
                `> Pasanganmu: @${senderData.fun.pasangan.split('@')[0]}\n` +
                `> Putus dulu dengan \`${m.prefix}putus\``,
                { mentions: [senderData.fun.pasangan] }
            )
        }
    }
    
    if (targetData.fun.pasangan && targetData.fun.pasangan !== m.sender) {
        const targetPartner = db.getUser(targetData.fun.pasangan)
        if (targetPartner?.fun?.pasangan === targetJid) {
            return m.reply(
                `💔 *ᴅɪᴀ sᴜᴅᴀʜ ᴘᴀᴄᴀʀᴀɴ*\n\n` +
                `> Pasangannya: @${targetData.fun.pasangan.split('@')[0]}`,
                { mentions: [targetData.fun.pasangan] }
            )
        }
    }
    
    if (targetData.fun.pasangan === m.sender) {
        senderData.fun.pasangan = targetJid
        targetData.fun.pasangan = m.sender
        
        db.setUser(m.sender, senderData)
        db.setUser(targetJid, targetData)
        
        delete global.tembakSessions[`${m.chat}_${targetJid}`]
        
        await m.react('💕')
        return sock.sendMessage(m.chat, {
            text: `💕 *sᴇʟᴀᴍᴀᴛ!*\n\n` +
                `@${m.sender.split('@')[0]} & @${targetJid.split('@')[0]} resmi pacaran!\n\n` +
                `> Semoga langgeng ya! 💍`,
            mentions: [m.sender, targetJid],
            contextInfo: getContextInfo('💕 *ᴊᴀᴅɪᴀɴ*', 'Selamat!')
        }, { quoted: m })
    }
    
    senderData.fun.pasangan = targetJid
    if (!senderData.fun.tembakCount) senderData.fun.tembakCount = 0
    senderData.fun.tembakCount++
    db.setUser(m.sender, senderData)
    
    global.tembakSessions[`${m.chat}_${targetJid}`] = {
        shooter: m.sender,
        target: targetJid,
        chat: m.chat,
        timestamp: Date.now()
    }
    
    const randomQuote = romanticQuotes[Math.floor(Math.random() * romanticQuotes.length)]
    const pendingCount = Object.values(global.tembakSessions || {}).filter(s => s.shooter === m.sender).length
    
    await m.react('💘')
    const ctx = getContextInfo('💘 *ᴛᴇᴍʙᴀᴋ*', 'Terima atau tolak?')
    ctx.mentionedJid = [targetJid, m.sender]
    
    const sentMsg = await sock.sendMessage(m.chat, {
        text: `💘 *ᴅɪᴛᴇᴍʙᴀᴋ!*\n\n` +
            `@${targetJid.split('@')[0]} kamu ditembak oleh @${m.sender.split('@')[0]}!\n\n` +
            `╭┈┈⬡「 💌 *ᴘᴇsᴀɴ* 」\n` +
            `┃ _"${randomQuote}"_\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 💬 *ʀᴇsᴘᴏɴ* 」\n` +
            `┃ ✅ Ketik *Terima* (reply pesan ini)\n` +
            `┃ ❌ Ketik *Tolak* (reply pesan ini)\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> ⏱️ Berlaku *1 jam* dari sekarang\n` +
            `> Atau gunakan: \`${m.prefix}terima\` / \`${m.prefix}tolak\``,
        mentions: [targetJid, m.sender],
        contextInfo: ctx
    }, { quoted: m })
    
    if (sentMsg?.key?.id) {
        global.tembakSessions[`${m.chat}_${targetJid}`].messageId = sentMsg.key.id
    }
}

async function answerHandler(m, sock) {
    if (!m.body) return false
    
    const text = m.body.trim().toLowerCase()
    if (text !== 'terima' && text !== 'tolak') return false
    if (!m.quoted) return false
    
    const db = getDatabase()
    
    const allSessions = Object.entries(global.tembakSessions || {}).filter(
        ([key, val]) => val.target === m.sender && val.chat === m.chat
    )
    
    if (allSessions.length === 0) return false
    
    const validSession = allSessions.find(([key, val]) => {
        return Date.now() - val.timestamp < 3600000
    })
    
    if (!validSession) return false
    
    const [sessKey, sessData] = validSession
    
    if (text === 'terima') {
        let shooterData = db.getUser(sessData.shooter) || {}
        let targetData = db.getUser(m.sender) || {}
        
        if (!shooterData.fun) shooterData.fun = {}
        if (!targetData.fun) targetData.fun = {}
        
        shooterData.fun.pasangan = m.sender
        targetData.fun.pasangan = sessData.shooter
        
        db.setUser(sessData.shooter, shooterData)
        db.setUser(m.sender, targetData)
        
        delete global.tembakSessions[sessKey]
        
        await m.react('💕')
        await sock.sendMessage(m.chat, {
            text: `💕 *ᴅɪᴛᴇʀɪᴍᴀ!*\n\n` +
                `@${m.sender.split('@')[0]} & @${sessData.shooter.split('@')[0]} resmi pacaran!\n\n` +
                `> Semoga langgeng dan bahagia! 💍`,
            mentions: [m.sender, sessData.shooter],
            contextInfo: getContextInfo('💕 *ᴊᴀᴅɪᴀɴ*', 'Selamat!')
        }, { quoted: m })
        
        return true
    }
    
    if (text === 'tolak') {
        let shooterData = db.getUser(sessData.shooter) || {}
        let targetData = db.getUser(m.sender) || {}
        
        if (!shooterData.fun) shooterData.fun = {}
        if (!targetData.fun) targetData.fun = {}
        
        shooterData.fun.pasangan = ''
        targetData.fun.pasangan = ''
        
        db.setUser(sessData.shooter, shooterData)
        db.setUser(m.sender, targetData)
        
        delete global.tembakSessions[sessKey]
        
        await m.react('💔')
        await sock.sendMessage(m.chat, {
            text: `💔 *ᴅɪᴛᴏʟᴀᴋ!*\n\n` +
                `@${m.sender.split('@')[0]} menolak @${sessData.shooter.split('@')[0]}\n\n` +
                `> Sabar ya, masih banyak yang lain! 😢`,
            mentions: [m.sender, sessData.shooter],
            contextInfo: getContextInfo('💔 *ᴅɪᴛᴏʟᴀᴋ*', 'Move on!')
        }, { quoted: m })
        
        return true
    }
    
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
}
