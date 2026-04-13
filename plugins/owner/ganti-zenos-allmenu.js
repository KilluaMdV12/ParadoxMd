const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ganti-zenos-allmenu.jpg',
    alias: ['gantiallemenu', 'setzenosallmenu'],
    category: 'owner',
    description: 'Ganti gambar zenos-allmenu.jpg (thumbnail allmenu)',
    usage: '.ganti-zenos-allmenu.jpg (reply/kirim gambar)',
    example: '.ganti-zenos-allmenu.jpg',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🖼️ *ɢᴀɴᴛɪ ᴏᴜʀɪɴ-ᴀʟʟᴍᴇɴᴜ.ᴊᴘɢ*\n\n> Kirim/reply gambar untuk mengganti\n> File: assets/images/zenos-allmenu.jpg`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ Gagal mendownload gambar`)
        }
        
        const targetPath = path.join(process.cwd(), 'assets', 'images', 'zenos-allmenu.jpg')
        
        const dir = path.dirname(targetPath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        
        fs.writeFileSync(targetPath, buffer)
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Gambar zenos-allmenu.jpg telah diganti`)
        
    } catch (error) {
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
