const yts = require("yt-search")
const axios = require("axios")
const config = require("../../config")

const pluginConfig = {
    name: "play",
    alias: ["playaudio"],
    category: "search",
    description: "Putar musik dari YouTube (Siputzx API)",
    usage: ".play <query>",
    example: ".play komang",
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

class Youtube {
  constructor(url) {
    this.base = "https://embed.dlsrv.online/api";
    this.id = null;
    this.headers = {
      "Content-Type": "application/json",
      origin: "https://embed.dlsrv.online",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      referer: `https://embed.dlsrv.online/v2/full?videoId=${this.id}`,
    };
    this.setId(url);
  }

  setId(url) {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/]+)/;
    const match = url.match(regex);
    this.id = match ? match[1] : null;
    this.headers.referer = `https://embed.dlsrv.online/v2/full?videoId=${this.id}`;
  }

  async info() {
    try {
      let { data } = await axios.post(
        `${this.base}/info`,
        { videoId: this.id },
        { headers: this.headers }
      );
      return data;
    } catch (e) {
      return "error: " + e.message;
    }
  }

  async download(format, quality) {
    if (!format || !quality) return "format and quality parameter is required";
    try {
      let { data } = await axios.post(
        `${this.base}/download/${format}`,
        { videoId: this.id, quality, format },
        { headers: this.headers }
      );
      return data;
    } catch (e) {
      return "error: " + e.message;
    }
  }
}


async function handler(m, { sock, text }) {
    const query = m.text?.trim()
    if (!query) return m.reply(`🎵 *ᴘʟᴀʏ*\n\n> Contoh:\n\`${m.prefix}play komang\``)

    m.react("🎧")

    try {
        const search = await yts(query)
        if (!search.videos.length) throw "Video tidak ditemukan"
        
        const video = search.videos[0]
        const ytdl = new Youtube(video.url)

        let info = await ytdl.info()
        if (typeof info === 'string' && info.startsWith('error')) {
            return m.reply('Gagal mendapatkan info video: ' + info)
        }

        let downloadResult = await ytdl.download('mp3', '320')
        if (typeof downloadResult === 'string' && downloadResult.startsWith('error')) {
            return m.reply('Gagal download audio: ' + downloadResult)
        }

        let audioUrl
        if (typeof downloadResult === 'string') {
            audioUrl = downloadResult
        } else if (downloadResult.url) {
            audioUrl = downloadResult.url
        } else if (downloadResult.download_url) {
            audioUrl = downloadResult.download_url
        } else {
            console.log('Respons download tidak dikenal:', downloadResult)
            return m.reply('Gagal mendapatkan URL audio. Cek console.')
        }

        await sock.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: video.title + '.mp3',
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: video.title,
                    body: `👁 Views: ${formatViews(video.views)} | ${video.ago}`,
                    mediaType: 2,
                    mediaUrl: video.url,
                    sourceUrl: video.url,
                    thumbnailUrl: video.thumbnail,
                    showAdAttribution: false,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

        m.react("✅")

    } catch (err) {
        console.error('[Play]', err)
        m.react("❌")
        m.reply(`❌ *Error*: ${err.message || err}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}

function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M'
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K'
    } else {
        return views
    }
}