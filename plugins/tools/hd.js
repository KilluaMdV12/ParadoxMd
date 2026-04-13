const config = require('../../config')
const { uploadToTmpFiles } = require('../../src/lib/laww')
const { default: axios } = require('axios')

const pluginConfig = {
    name: 'remini',
    alias: ['hd', 'enhance', 'upscale'],
    category: 'tools',
    description: 'Enhance/upscale gambar menjadi HD (V4)',
    usage: '.remini (reply gambar)',
    example: '.remini',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')

    if (!isImage) {
        return m.reply(`✨ *ʀᴇᴍɪɴɪ ᴇɴʜᴀɴᴄᴇ*\n\n> Kirim/reply gambar untuk di-enhance\n\n\`${m.prefix}remini\``)
    }

    m.react('⏳')

    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }

        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ Gagal mendownload gambar`)
        }
        const gmbr = await uploadToTmpFiles(buffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        })
        console.log(gmbr.directUrl)
        const res = await axios.get(`https://api-faa.my.id/faa/hdv4?image=${encodeURIComponent(gmbr.directUrl)}`)
        const data = res.data.result
        m.react('✅')

        const saluranId = config.saluran?.id || '120363407633768956@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Zenos-AI'

        await sock.sendMessage(m.chat, {
            image: { url: data.image_upscaled },
            caption: `*DONE*`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
            }
        }, { quoted: m })

    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
