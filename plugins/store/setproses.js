const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'setproses',
    alias: ['prosesconfig', 'configproses'],
    category: 'store',
    description: 'Set template untuk .proses',
    usage: '.setproses template <full text>',
    example: '.setproses template 「 *TRANSAKSI DIPROSES* 」\\n\\n👤 Buyer: @{buyer_number}',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const defaultTemplate = `「 *TRANSAKSI DIPROSES* 」

⌚️ JAM     : {jam}
✨ STATUS  : Diproses

*👤 Buyer:*
@{buyer_number} ({buyer})

Mohon tunggu ya, pesanan sedang diproses🙏`

async function handler(m, { sock }) {
    const db = getDatabase()
    const text = m.text?.trim() || ''
    const args = text.split(' ')
    const option = args[0]?.toLowerCase()
    
    const current = db.setting('prosesTemplate') || {}
    
    if (!option) {
        let info = `⚙️ *sᴇᴛ ᴘʀᴏsᴇs ᴛᴇᴍᴘʟᴀᴛᴇ*\n\n`
        info += `╭┈┈⬡「 📋 *ᴄᴜʀʀᴇɴᴛ sᴇᴛᴛɪɴɢs* 」\n`
        info += `┃ ▧ Template: ${current.template ? '✅ Custom' : '❌ Default'}\n`
        info += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        info += `*ᴜsᴀɢᴇ:*\n\n`
        info += `1️⃣ *Set Template:*\n`
        info += `\`${m.prefix}setproses template <text>\`\n\n`
        info += `2️⃣ *Contoh:*\n`
        info += `\`\`\`\n${m.prefix}setproses template 「 *TRANSAKSI DIPROSES* 」\n\n⌚️ JAM : {jam}\n✨ STATUS : Diproses\n\n👤 Buyer: @{buyer_number}\n\nMohon tunggu ya🙏\n\`\`\`\n\n`
        info += `*ᴘʟᴀᴄᴇʜᴏʟᴅᴇʀs:*\n`
        info += `> {buyer} = Nama buyer\n`
        info += `> {buyer_number} = Nomor buyer\n`
        info += `> {jam} / {time} = Jam (HH.MM.SS)\n`
        info += `> {date} = Tanggal (DD-MM-YYYY)\n\n`
        info += `3️⃣ *Reset ke Default:*\n`
        info += `\`${m.prefix}setproses reset\`\n\n`
        info += `4️⃣ *Preview Template:*\n`
        info += `\`${m.prefix}setproses preview\``
        
        return m.reply(info)
    }
    
    if (option === 'reset') {
        db.setting('prosesTemplate', {})
        await db.save()
        return m.reply(`✅ Template .proses direset ke default!`)
    }
    
    if (option === 'preview') {
        const template = current.template || defaultTemplate
        
        const now = new Date()
        const jam = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`
        const tanggal = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`
        
        const previewText = template
            .replace(/{buyer}/gi, 'Laww')
            .replace(/{buyer_number}/gi, '628123456789')
            .replace(/{jam}/gi, jam)
            .replace(/{time}/gi, jam)
            .replace(/{date}/gi, tanggal)
        
        return m.reply(`📋 *ᴘʀᴇᴠɪᴇᴡ ᴛᴇᴍᴘʟᴀᴛᴇ:*\n\n${previewText}`)
    }
    
    if (option === 'template') {
        const templateText = m.fullArgs.slice(9).trim()
        
        if (!templateText) {
            return m.reply(`❌ Template tidak boleh kosong!\n\n> Gunakan \`${m.prefix}setproses\` untuk melihat contoh`)
        }
        
        current.template = templateText
        db.setting('prosesTemplate', current)
        await db.save()
        
        return m.reply(`✅ *ᴛᴇᴍᴘʟᴀᴛᴇ ᴅɪsɪᴍᴘᴀɴ!*\n\n> Gunakan \`${m.prefix}setproses preview\` untuk melihat hasil`)
    }
    
    return m.reply(`❌ Option tidak valid!\n\n> Gunakan: \`template\`, \`preview\`, atau \`reset\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
