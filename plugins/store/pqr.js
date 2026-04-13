const config = require('../../config')
const fetch = require('node-fetch')

// ─── Plugin: .pqr / .pqris ────────────────────────────────────────────────────
const pluginConfig = {
    name: 'pqr',
    alias: ['pqris', 'qris', 'scanqr'],
    category: 'store',
    description: 'Tampilkan gambar QRIS pembayaran',
    usage: '.pqr',
    example: '.pqr',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const qrisUrl = config.store?.qris || ''

    if (!qrisUrl) {
        return m.reply(
            `📷 *Qʀɪs ʙᴇʟᴜᴍ ᴅɪᴋᴏɴꜰɪɢᴜʀᴀꜱɪ*\n\n` +
            `> Owner belum mengatur link QRIS.\n` +
            `> Tambahkan di \`config.js\`:\n` +
            `\`\`\`\nstore: {\n  qris: 'https://link/qris.jpg'\n}\n\`\`\``
        )
    }

    m.react('📷')

    try {
        const response   = await fetch(qrisUrl)
        const qrisBuffer = Buffer.from(await response.arrayBuffer())

        await sock.sendMessage(m.chat, {
            image: qrisBuffer,
            caption: `📷 *Sᴄᴀɴ Qʀɪs Bᴇʀɪᴋᴜᴛ*\n\n` +
                     `> Scan QR code di atas untuk pembayaran\n` +
                     `> Setelah bayar, kirim bukti ke owner`,
            footer: config.bot?.name || 'Zenos Store'
        }, { quoted: m })
    } catch {
        return m.reply(`❌ Gagal mengambil gambar QRIS, coba lagi nanti.`)
    }
}

module.exports = { config: pluginConfig, handler }
