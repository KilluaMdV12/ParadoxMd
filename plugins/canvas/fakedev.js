const axios = require('axios')
const config = require('../../config')
const { uploadToTmpFiles } = require('../../src/lib/laww')

const pluginConfig = {
    name: 'devmaker',
    alias: ['fakedev'],
    category: 'canvas',
    description: 'Membuat gambar chat iPhone style',
    usage: '.devmaker <text>',
    example: '.devmaker Hai cantik',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text
    if (!text) {
        return m.reply(`📱 *FAKE DEV*\n\n> Masukkan teks untuk chat\n\n\`Contoh: ${m.prefix}devmaker Hai cantik\``)
    }

     const isImage = m.isImage || (m.quoted && m.quoted.isImage)
        
        if (!isImage) {
            m.react('❌')
            return m.reply(
                `📷 *ꜰᴀᴋᴇ ᴅᴇᴠ*\n\n` +
                `Tolong Reply gambar!\n\n` +
                `> Format: \`${m.prefix}devmaker <text>\`\n` +
                `> Contoh: \`${m.prefix}devmaker Misaki\``
            )
        }
        
        let imageBuffer
        if (m.isImage && m.download) {
            imageBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            imageBuffer = await m.quoted.download()
        }
        
        if (!imageBuffer) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa download gambar`)
        }
    
    m.react('📱')
    
    try {
        const gmbr = await uploadToTmpFiles(imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        })
        await sock.sendMessage(m.chat, {
            image: { url: `https://kayzzidgf.my.id/api/maker/fakedev3?text=${encodeURIComponent(text)}&image=${encodeURIComponent(gmbr.directUrl)}&verified=true&apikey=FreeLimit` },
            caption: `📱 *FAKE DEV*\n\n${text}`
        }, { quoted: m })
        
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
