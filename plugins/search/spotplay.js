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
    name: 'spotplay',
    alias: ['splay', 'sp'],
    category: 'search',
    description: 'Putar musik dari Spotify',
    usage: '.spotplay <query>',
    example: '.spotplay neffex grateful',
    cooldown: 20,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    if (!query)
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${m.prefix}spotplay <query>\``
        )

    m.react('🎧')

    let tempMp3

    try {
        const results = await axios.get(`https://api.emiliabot.my.id/search/spotify?query=${encodeURIComponent(query)}`)
        if (!results.status) return m.reply('❌ tidak ditemukan')

        const track = results.data[0]
        const spotifyUrl = track.link
        const dl = (await axios.get(`https://api.neoxr.eu/api/spotify?url=${encodeURIComponent(spotifyUrl)}&apikey=${config.APIkey?.neoxr}`)).data
        await sock.sendMessage(
            m.chat,
            {
                audio: { url: dl?.data?.url },
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${track?.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: track?.title,
                        body: track?.artist,
                        thumbnailUrl: track?.imageUrl,
                        mediaType: 2,
                        sourceUrl: spotifyUrl,
                        mediaUrl: spotifyUrl,
                    }
                }
            },
            { quoted: m }
        )
    } catch (e) {
        m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = { 
    config: pluginConfig, 
    handler 
}
