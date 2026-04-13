const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'script',
    alias: ['sc', 'sourcecode', 'source'],
    category: 'main',
    description: 'Dapatkan source code bot',
    usage: '.script',
    example: '.script',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const botName = config.bot?.name || 'Zenos-AI'
        const footer = config.settings?.footer || `© ${botName} 2026`
        const saluranId = config.saluran?.id || '120363407633768956@newsletter'
        const saluranName = config.saluran?.name || botName
        const saluranUrl = config.saluran?.url || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t'
        const scriptUrl = config.script?.url || 'https://github.com/zenos-team/zenos-md'
        const scriptPrice = config.script?.price || 0
        
        const thumbPath = path.join(process.cwd(), 'assets', 'images', 'zenos-allmenu.jpg')
        let thumbBuffer = null
        if (fs.existsSync(thumbPath)) {
            thumbBuffer = fs.readFileSync(thumbPath)
        }

        await sock.sendMessage(m.chat, {
            productMessage: {
                title: `${botName} Script`,
                description: `Source code WhatsApp Bot ${botName}\n\nFitur:\n• Multi-device support\n• 500+ Commands\n• Anti-spam & Anti-link\n• Game & RPG System\n• Panel Management\n• Auto-update`,
                thumbnail: thumbBuffer ? { url: thumbPath } : undefined,
                productId: 'SCRIPT001',
                retailerId: botName,
                url: scriptUrl,
                body: `Dapatkan script ${botName} sekarang!`,
                footer: footer,
                priceAmount1000: scriptPrice * 1000,
                currencyCode: 'IDR',
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📦 GitHub',
                            url: scriptUrl
                        })
                    },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '📢 Saluran',
                            url: saluranUrl
                        })
                    }
                ]
            },
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })

    } catch (error) {
        console.error('[Script] Error:', error.message)
        
        const botName = config.bot?.name || 'Zenos-AI'
        const scriptUrl = config.script?.url || 'https://github.com/zenos-team/zenos-md'
        const saluranUrl = config.saluran?.url || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t'
        
        await m.reply(
            `📦 *${botName} sᴄʀɪᴘᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 ɴᴀᴍᴀ: ${botName}\n` +
            `┃ 💰 ʜᴀʀɢᴀ: ${config.script?.price ? `Rp ${config.script.price.toLocaleString('id-ID')}` : 'FREE'}\n` +
            `┃ 🔗 ɢɪᴛʜᴜʙ: ${scriptUrl}\n` +
            `┃ 📢 sᴀʟᴜʀᴀɴ: ${saluranUrl}\n` +
            `╰┈┈⬡\n\n` +
            `> Hubungi owner untuk info lebih lanjut`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
