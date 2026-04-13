const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'bratcewek',
    alias: ['cewekbrat', 'bratperempuan', 'bratgirl'],
    category: 'sticker',
    description: 'Membuat sticker brat',
    usage: '.bratcewek <text>',
    example: '.bratcewek Hai semua',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`🖼️ *ʙʀᴀᴛ cᴇᴡᴇᴋ sᴛɪᴄᴋᴇʀ*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}bratcewek Hai semua\``)
    }
    
    m.react('🖼️')
    
    try {
        const url = `https://api.deline.web.id/maker/cewekbrat?text=${encodeURIComponent(text)}`
        
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data)
        
        await sock.sendImageAsSticker(m.chat, buffer, m, {
            packname: config.bot?.name,
            author: m.pushName || 'User'
        })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
