const axios = require('axios')

const pluginConfig = {
    name: 'brat',
    alias: ['brattext'],
    category: 'sticker',
    description: 'Membuat sticker brat',
    usage: '.brat <text>',
    example: '.brat Hai semua',
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
        return m.reply(`🖼️ *ʙʀᴀᴛ sᴛɪᴄᴋᴇʀ*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}brat Hai semua\``)
    }
    
    m.react('🖼️')
    
    try {
        const url = `https://api.nexray.web.id/maker/brat?text=${encodeURIComponent(text)}`
        
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data)
        
        await sock.sendImageAsSticker(m.chat, buffer, m, {
            packname: 'Zenos-AI',
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
