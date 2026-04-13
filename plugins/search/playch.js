const axios = require('axios')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const { exec } = require('child_process')
const { promisify } = require('util')
const { zencf } = require('zencf')
const config = require('../../config')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')
const cheerio = require('cheerio')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'playch',
    alias: ['pch'],
    category: 'search',
    description: 'Putar musik dari Spotify',
    usage: '.playch <query>',
    example: '.playch neffex grateful',
    cooldown: 20,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text
    if (!query)
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${m?.prefix}playch <query>\``
        )
    m.react('🎧')
    let tempMp3
    try {
        const { data } = await axios.get(`https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`)
        const dl = await axios.get(data.result.dlink, { responseType: 'arraybuffer' })
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        tempMp3 = path.join(tempDir, `spot_${Date.now()}.mp3`)
        let input = path.join(tempMp3);
        let output = path.join(tempDir, `out_${Date.now()}.ogg`);
        fs.writeFileSync(input, Buffer.from(dl.data));
        await execAsync(`ffmpeg -y -i "${input}" -c:a libopus -b:a 64k "${output}"`)
        let ogg = fs.readFileSync(output);
        await sock.sendMessage(
            config?.saluran?.id,
            {
                audio: ogg,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 99,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: config?.saluran?.name || config?.bot?.name || "Zenos-AI",
                        newsletterId: config?.saluran?.id || "120363407633768956@newsletter"
                    },
                    externalAdReply: {
                        title: data.result.title,
                        body: `Quality: ${data.result.pick?.quality}`,
                        thumbnailUrl: data.result.thumbnail,
                        mediaType: 1,
                        sourceUrl: config?.info?.website || null,
                        renderLargerThumbnail: false
                    }
                }
            }
        )
            setTimeout(() => {
                try {
                    fs.unlinkSync(tempMp3)
                } catch (error) {
                    
                }
                try {
                    fs.unlinkSync(output)
                } catch (error) {
                    
                }
            }, 30000)
        await m.react('✅')
        await m.reply(`✅ *SUCCESS*
          
Berhasil mengirimkan lagu ke saluran *${config?.saluran?.id}*

🍀 *NOTE*
> Ini belum stabil banget yak, jadi kemungkinan belum bisa di play.`)
    } catch (e) {
        m.reply(`🍀 *HARAP ULANGI LAGI*`)
    }
}

module.exports = { 
    config: pluginConfig, 
    handler 
}
