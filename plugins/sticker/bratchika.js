const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'bratchika',
    alias: ['chikabrat'],
    category: 'sticker',
    description: 'Membuat sticker brat',
    usage: '.chikabrat <text>',
    example: '.chikabrat Hai semua',
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
        return m.reply(`🖼️ *ʙʀᴀᴛ ᴄʜɪᴋᴀ sᴛɪᴄᴋᴇʀ*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}chikabrat Hai semua\``)
    }
    
    m.react('🖼️')
    
    try {
        const url = `https://kayzzidgf.my.id/api/maker/bratchika?apikey=FreeLimit&text=${encodeURIComponent(text)}`
        
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data)
        
        await sock.sendImageAsSticker(m.chat, buffer, m, {
            packname: config.bot?.name,
            author: m.pushName
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
