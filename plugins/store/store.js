const { getDatabase } = require('../../src/lib/database')
const { generateWAMessageFromContent, proto } = require("ourin")
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'store',
    alias: ['toko', 'shop', 'katalog'],
    category: 'store',
    description: 'Lihat katalog produk store',
    usage: '.store',
    example: '.store',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, config }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    
    if (groupData.botMode !== 'store') {
        return m.reply(
            `⚠️ *Mode Store Tidak Aktif*\n\n` +
            `Admin aktifkan:\n` +
            `\`${m.prefix}botmode store\``
        )
    }
    
    if (!groupData.storeConfig) {
        groupData.storeConfig = { products: [] }
        db.setGroup(m.chat, groupData)
    }
    
    const products = groupData.storeConfig.products || []
    const storeName = groupData.storeName || '𝙊𝙐𝙍𝙄𝙉 𝙎𝙏𝙊𝙍𝙀'
    
    if (products.length === 0) {
        return m.reply(
            `📦 *${storeName}*\n\n` +
            `Belum ada produk.\n\n` +
            `*Admin:*\n` +
            `\`${m.prefix}addproduct\``
        )
    }
    
    let txt = `╔══════════════════════════╗\n`
    txt += `      🛒 *${storeName}*\n`
    txt += `╚══════════════════════════╝\n\n`
    txt += `> *${products.length} Produk Tersedia*\n\n`
    
    txt += `┌─────────────────────────┐\n`
    products.forEach((p, i) => {
        const stock = p.stock === -1 ? '∞' : (p.stockItems?.length || p.stock || 0)
        txt += `│ *${i+1}.* ${p.name}\n`
        txt += `│    💰 Rp ${formatPrice(p.price)}\n`
        txt += `│    📦 Stok: ${stock}\n`
        if (p.description) txt += `│    📝 ${p.description.substring(0, 30)}${p.description.length > 30 ? '...' : ''}\n`
        if (i < products.length - 1) txt += `│\n`
    })
    txt += `└─────────────────────────┘\n\n`
    
    txt += `*━━━━ ᴄᴀʀᴀ ᴏʀᴅᴇʀ ━━━━*\n`
    txt += `> Klik tombol di bawah atau ketik:\n`
    txt += `> \`${m.prefix}order [nomor]\`\n`
    txt += `> Contoh: \`${m.prefix}order 1\``
    
    const storeImage = path.join(process.cwd(), 'assets', 'images', 'zenos-store.jpg')
    let imageBuffer = null
    if (fs.existsSync(storeImage)) {
        imageBuffer = fs.readFileSync(storeImage)
    }
    
    const productRows = products.map((p, i) => ({
        title: `${i + 1}. ${p.name}`,
        description: `💰 Rp ${formatPrice(p.price)} | 📦 ${p.stockItems?.length || p.stock || 0}`,
        id: `${m.prefix}order ${i + 1}`
    }))
    
    try {
        const { prepareWAMessageMedia } = require("ourin")
        
        let headerMedia = null
        if (imageBuffer) {
            try {
                headerMedia = await prepareWAMessageMedia({
                    image: imageBuffer
                }, {
                    upload: sock.waUploadToServer
                })
            } catch (e) {}
        }
        
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '🛒 ᴘɪʟɪʜ ᴘʀᴏᴅᴜᴋ',
                    sections: [{
                        title: 'ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ',
                        rows: productRows
                    }]
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '💳 ʙᴇʟɪ ᴅᴇɴɢᴀɴ sᴀʟᴅᴏ',
                    id: `${m.prefix}beliproduk`
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '📊 ᴄᴇᴋ sᴛᴏᴋ',
                    id: `${m.prefix}products`
                })
            }
        ]
        
        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: txt
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `© ${storeName} | ${config?.bot?.name || 'Zenos-AI'}`
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: storeName,
                            subtitle: `${products.length} Produk`,
                            hasMediaAttachment: !!headerMedia,
                            ...(headerMedia || {})
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: interactiveButtons
                        }),
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config?.saluran?.id || '120363407633768956@newsletter',
                                newsletterName: storeName,
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m })
        
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        
    } catch (btnError) {
        console.error('[Store] Interactive button error:', btnError.message)
        
        if (imageBuffer) {
            await sock.sendMessage(m.chat, {
                image: imageBuffer,
                caption: txt,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config?.saluran?.id || '120363407633768956@newsletter',
                        newsletterName: storeName,
                        serverMessageId: 127
                    }
                }
            }, { quoted: m })
        } else {
            await m.reply(txt)
        }
    }
}

function formatPrice(num) {
    if (num >= 1000000) return (num/1000000).toFixed(1).replace('.0','') + 'jt'
    if (num >= 1000) return (num/1000).toFixed(0) + 'rb'
    return num.toLocaleString('id-ID')
}

module.exports = {
    config: pluginConfig,
    handler
}
