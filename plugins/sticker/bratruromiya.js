const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'bratruromiya',
    alias: ['ruromiyabrat'],
    category: 'sticker',
    description: 'Membuat sticker brat',
    usage: '.ruromiyabrat <text>',
    example: '.ruromiyabrat Hai semua',
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
        return m.reply(`🖼️ *ʙʀᴀᴛ ʀᴜʀᴏᴍɪʏᴀ sᴛɪᴄᴋᴇʀ*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}ruromiyabrat Hai semua\``)
    }
    
    m.react('🖼️')
    
    try {
        const url = `https://kayzzidgf.my.id/api/maker/bratruromiya?apikey=FreeLimit&text=${encodeURIComponent(text)}`
        
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
