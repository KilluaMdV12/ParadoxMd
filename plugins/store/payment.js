const config = require('../../config')
const fetch = require('node-fetch')

// ─── Plugin: .payment ─────────────────────────────────────────────────────────
const pluginConfig = {
    name: 'payment',
    alias: ['bayar', 'pay', 'rekening', 'rek'],
    category: 'store',
    description: 'Tampilkan semua metode pembayaran beserta QRIS',
    usage: '.payment',
    example: '.payment',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const payments = config.store?.payment || []
    const qrisUrl  = config.store?.qris   || ''

    // Jika tidak ada payment & tidak ada QRIS
    if (payments.length === 0 && !qrisUrl) {
        return m.reply(
            `💳 *ᴍᴇᴛᴏᴅᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\n` +
            `> Belum ada metode pembayaran yang dikonfigurasi\n\n` +
            `> Owner dapat menambahkan di \`config.js\`:\n` +
            `\`\`\`\nstore: {\n  payment: [\n    { name: 'Dana', number: '08xxx', holder: 'Nama' }\n  ],\n  qris: 'https://link/qris.jpg'\n}\n\`\`\``
        )
    }

    // ── Bangun teks pembayaran ──────────────────────────────────────────────
    let txt = `💳 *ᴍᴇᴛᴏᴅᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\n`

    if (payments.length > 0) {
        txt += `╭─「 💰 *ʀᴇᴋᴇɴɪɴɢ* 」\n`
        for (const pay of payments) {
            txt += `┃\n`
            txt += `┃ 🏦 *${pay.name}*\n`
            txt += `┃ └ 📱 ${pay.number}\n`
            txt += `┃ └ 👤 a/n ${pay.holder}\n`
        }
        txt += `┃\n`
        txt += `╰───────────────\n\n`
    }

    if (qrisUrl) {
        txt += `╭─「 📷 *Qʀɪs* 」\n`
        txt += `┃ Scan QR di bawah ini\n`
        txt += `╰───────────────\n\n`
    }

    txt += `> Setelah transfer, kirim bukti pembayaran\n`
    txt += `> Konfirmasi ke owner untuk proses order`

    m.react('💳')

    // Copy buttons untuk setiap rekening
    const copyButtons = payments.map(pay => ({
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
            display_text: `📋 Copy No. ${pay.name}`,
            copy_code: pay.number
        })
    }))

    // Kirim dengan gambar QRIS jika tersedia
    if (qrisUrl) {
        try {
            const response   = await fetch(qrisUrl)
            const qrisBuffer = Buffer.from(await response.arrayBuffer())

            await sock.sendMessage(m.chat, {
                image: qrisBuffer,
                caption: txt,
                footer: config.bot?.name || 'Zenos Store',
                interactiveButtons: copyButtons.length ? copyButtons : undefined
            }, { quoted: m })
        } catch {
            await sock.sendMessage(m.chat, {
                text: txt,
                footer: config.bot?.name || 'Zenos Store',
                interactiveButtons: copyButtons.length ? copyButtons : undefined
            }, { quoted: m })
        }
    } else {
        await sock.sendMessage(m.chat, {
            text: txt,
            footer: config.bot?.name || 'Zenos Store',
            interactiveButtons: copyButtons.length ? copyButtons : undefined
        }, { quoted: m })
    }
}

module.exports = { config: pluginConfig, handler }
