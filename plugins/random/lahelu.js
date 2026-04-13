const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'lahelu',
    alias: ['randommeme'],
    category: 'random',
    description: 'Random gambar lahelu',
    usage: '.lahelu',
    example: '.lahelu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const api = 'https://api.cuki.biz.id/api/random/lahelu?apikey=cuki-x'
    const saluranId = config.saluran?.id || '120363407633768956@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Zenos-AI'
    
    await m.react('🎴')
    
    try {
        const res = (await axios.get(api)).data
        const random = res.data[Math.floor(Math.random() * res.data.length)]
        console.log(random.media)
        if(random.media.includes('.mp4')) {
            await sock.sendMessage(m.chat, {
                video: { url: random.media },
                caption: random.title,
                contextInfo: {
                    forwardingScore: 9,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            }, { quoted: m })
        } else {
            await sock.sendMessage(m.chat, {
                image: { url: random.media },
                caption: random.title,
                contextInfo: {
                    forwardingScore: 9,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            }, { quoted: m })
        }
        
        await m.react('✅')
    } catch (e) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
