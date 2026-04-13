const nanoBanana = require('../../src/scraper/nanobanana')
const { creartTxt2Img, creartImg2Img } = require('../../src/scraper/seaart')

const pluginConfig = {
    name: 'zenosbanana',
    alias: [],
    category: 'ai',
    description: 'Edit gambar dengan AI menggunakan prompt',
    usage: '.zenosbanana <prompt>',
    example: '.zenosbanana make it anime style',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ')
    if (!prompt) {
        return m.reply(
            `🍌 *ZENOS BANANA SUPER*\n\n` +
            `> Edit gambar dengan AI\n\n` +
            `\`Contoh: ${m.prefix}zenosbanana make it anime style\`\n\n` +
            `> Reply atau kirim gambar dengan caption`
        )
    }
    
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n> Reply atau kirim gambar dengan caption`)
    }
    
    m.react('🍌')
 
    try {
        let mediaBuffer
        if (m.isImage && m.download) {
            mediaBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download()
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengunduh gambar`)
        }
        
        const resultBuffer = await creartImg2Img(prompt, mediaBuffer)

        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(resultBuffer),
            caption: `🍌 *ZENOS BANANA*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ᴘʀᴏᴍᴘᴛ: \`${prompt}\`\n` +
                `┃ 🤖 ᴍᴏᴅᴇʟ: \`nano-banana\`\n` +
                `┃ 🎭 ᴍᴏᴅᴇ: \`Image to Image\`\n` +
                `╰┈┈⬡`
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
