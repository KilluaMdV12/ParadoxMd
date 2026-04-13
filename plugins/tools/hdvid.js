const videoenhancer = require('../../src/scraper/hdvid')
const sharp = require('sharp')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'hdvid',
    alias: ['hdvideo', 'enhancevid', 'hdv'],
    category: 'tools',
    description: 'Meningkatkan kualitas video menjadi HD dengan AI',
    usage: '.hdvid (reply video)',
    example: '.hdvid',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 120,
    energi: 3,
    isEnabled: true
}

async function handler(m, { sock }) {
   const isVideo = m.isVideo || (m.quoted && m.quoted.type === 'videoMessage')
    
    if (!isVideo) {
        return m.reply(
            `📹 *ʜᴅ ᴠɪᴅᴇᴏ ᴇɴʜᴀɴᴄᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ Reply video dengan \`${m.prefix}hdvid\`\n` +
            `┃ ◦ Kirim video dengan caption \`${m.prefix}hdvid\`\n` +
            `╰┈┈⬡\n\n` +
            `> ⚠️ Proses membutuhkan waktu 30-60 detik\n` +
            `> 💎 Fitur premium`
        )
    }
    
    m.react('📹')
    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs ᴠɪᴅᴇᴏ...*\n\n> Estimasi waktu: 30-60 detik\n> Mohon tunggu...`)
    
    let inputPath = null
    
    try {
        const videoBuffer = await m?.quoted?.download() || await m.download()
        
        if (!videoBuffer || videoBuffer.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengunduh video!`)
        }
        
        if (videoBuffer.length > 50 * 1024 * 1024) {
            m.react('❌')
            return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Video terlalu besar! Maksimal 50MB.`)
        }
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
        
        const timestamp = Date.now()
        inputPath = path.join(tempDir, `input_hd_${timestamp}.mp4`)
        
        fs.writeFileSync(inputPath, videoBuffer)
        
        const result = await videoenhancer(inputPath, '4k')
        
        if (!result || !result.output_url) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal memproses video. Coba lagi nanti.`)
        }
        
        await sock.sendMessage(m.chat, {
            video: { url: result.output_url },
            caption: `✅ *ʜᴅ ᴠɪᴅᴇᴏ ᴇɴʜᴀɴᴄᴇᴅ*\n\n` +
            `> ${timestamp}`,
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    } finally {
        if (inputPath && fs.existsSync(inputPath)) {
            setTimeout(() => fs.unlinkSync(inputPath), 5000)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
