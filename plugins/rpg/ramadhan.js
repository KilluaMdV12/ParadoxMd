const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const config = require('../../config')
const moment = require('moment-timezone')

const TZ = 'Asia/Jakarta'

const pluginConfig = {
  name: 'ramadhan',
  alias: [
    'ramadan',
    'puasa',
    'sahur',
    'bukapuasa',
    'buka',
    'ngabuburit',
    'tadarusan',
    'teraweh',
    'perangsarung',
    'belitakjil',
    'petasan',
    'mokel',
    'bangunin',
    'bukber',
    'kelilingsahur',
    'patrol',
    'sedekah',
    'thr',
    'wartakjil',
    'bukawarung',
    'tod',
    // fitur baru
    'pakai'
  ],
  category: 'rpg',
  description: 'Fitur RPG Spesial Ramadhan (lebih seru & manusiawi)',
  usage:
    '.ramadhan | .ramadhan status | .ramadhan quest | .ramadhan claim | .ramadhan lbpahala | .sahur | .bukapuasa | .ngabuburit | .tadarusan | .teraweh | .belitakjil | .pakai <item> | .wartakjil',
  example: '.ramadhan status',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true
}

const TIMES = {
  SAHUR: { start: '02:00', end: '04:30' },
  BUKA: { start: '17:30', end: '18:30' },
  NGABUBURIT: { start: '15:00', end: '17:30' },
  WARTAKJIL: { start: '16:00', end: '18:00' },
  TERAWEH: { start: '19:00', end: '22:00' }
}

const ITEMS = {
  takjil_gratis: {
    price: 0,
    consumable: true,
    desc: 'Takjil random dari masjid (Energy +5)',
    apply: (user) => {
      user.energi = (user.energi || 0) + 5
      return 'Energi kamu naik +5. Alhamdulillah dapat gratisan 🤲'
    }
  },
  es_buah: {
    price: 5000,
    consumable: true,
    desc: 'Seger pol! (Energy +20, Mood +5)',
    apply: (user, stats) => {
      user.energi = (user.energi || 0) + 20
      stats.mood = (stats.mood || 0) + 5
      return 'Es buah masuk! Energi +20, Mood +5 😋'
    }
  },
  gorengan: {
    price: 2000,
    consumable: true,
    desc: 'Gorengan anget (Energy +10)',
    apply: (user) => {
      user.energi = (user.energi || 0) + 10
      return 'Kriuk-kriuk… Energi +10 🤤'
    }
  },
  kolak: {
    price: 7000,
    consumable: true,
    desc: 'Kolak manis (Energy +15)',
    apply: (user) => {
      user.energi = (user.energi || 0) + 15
      return 'Kolak hangat bikin hati tenang. Energi +15 🍯'
    }
  },
  es_kelapa: {
    price: 8000,
    consumable: true,
    desc: 'Es kelapa muda (Energy +18, Mood +3)',
    apply: (user, stats) => {
      user.energi = (user.energi || 0) + 18
      stats.mood = (stats.mood || 0) + 3
      return 'Sluurp… Es kelapa! Energi +18, Mood +3 🥥'
    }
  },
  susu_kurma: {
    price: 15000,
    consumable: true,
    desc: 'Recovery (Stamina terasa “full”, Energy +30, Dosa -20)',
    apply: (user, stats) => {
      user.energi = (user.energi || 0) + 30
      stats.dosa = Math.max(0, (stats.dosa || 0) - 20)
      return 'Susu kurma berkhasiat! Energi +30, Dosa -20 ✨'
    }
  },
  kurma_premium: {
    price: 15000,
    consumable: true,
    desc: 'Kurma Ajwa (Pahala +80, Energy +8)',
    apply: (user, stats) => {
      stats.pahala = (stats.pahala || 0) + 80
      user.energi = (user.energi || 0) + 8
      return 'Kurma Ajwa dimakan. Pahala +80, Energi +8 🌴'
    }
  },
  sarung: {
    price: 25000,
    consumable: false,
    desc: 'Unlock Perang Sarung (item permanen)'
  },
  petasan: {
    price: 10000,
    consumable: true,
    desc: 'Prank item (sekali pakai)'
  }
}

// Time helpers
const nowJkt = () => moment().tz(TZ)
const todayStr = () => nowJkt().format('YYYY-MM-DD')

function isBetweenTimeWindow(startHHmm, endHHmm) {
  const now = nowJkt()
  const baseDate = now.format('YYYY-MM-DD')
  const s = moment.tz(`${baseDate} ${startHHmm}`, 'YYYY-MM-DD HH:mm', TZ)
  const e = moment.tz(`${baseDate} ${endHHmm}`, 'YYYY-MM-DD HH:mm', TZ)

  if (e.isBefore(s)) {
    return now.isSameOrAfter(s) || now.isSameOrBefore(e)
  }
  return now.isBetween(s, e, null, '[)') 
}

function formatRp(n) {
  return (Number(n) || 0).toLocaleString('id-ID')
}

function getRamadhanStats(user) {
  if (!user.rpg) user.rpg = {}
  if (!user.rpg.ramadhan) {
    user.rpg.ramadhan = {
      pahala: 0,
      dosa: 0,
      puasaStreak: 0,
      isFasting: false,
      lastSahur: '',
      lastBuka: '',
      lastTadarus: '',
      lastTeraweh: '',
      lastNgabuburit: '',
      tadarusAyat: 0,
      tadarusJuz: 0,
      takjilCollected: 0,
      mood: 0,
      dailyQuestDate: '',
      dailyQuestDone: {
        sahur: false,
        tadarus: false,
        ngabuburit: false,
        teraweh: false,
        buka: false
      },
      dailyQuestClaimed: false
    }
  }
  const st = user.rpg.ramadhan
  if (typeof st.tadarusAyat === 'undefined') st.tadarusAyat = 0
  if (typeof st.tadarusJuz === 'undefined') st.tadarusJuz = 0
  if (typeof st.mood === 'undefined') st.mood = 0
  if (typeof st.dailyQuestDate === 'undefined') st.dailyQuestDate = ''
  if (typeof st.dailyQuestDone === 'undefined') {
    st.dailyQuestDone = { sahur: false, tadarus: false, ngabuburit: false, teraweh: false, buka: false }
  }
  if (typeof st.dailyQuestClaimed === 'undefined') st.dailyQuestClaimed = false

  return st
}

let WAR_TAKJIL_STOCK = { date: '', items: {} }

function resetWarTakjilIfNeeded() {
  const today = todayStr()
  if (WAR_TAKJIL_STOCK.date !== today) {
    WAR_TAKJIL_STOCK.date = today
    WAR_TAKJIL_STOCK.items = {
      es_buah: { name: 'Es Buah Segar', stock: 50, price: 5000 },
      gorengan: { name: 'Gorengan Anget', stock: 100, price: 2000 },
      kolak: { name: 'Kolak Pisang', stock: 30, price: 7000 },
      es_kelapa: { name: 'Es Kelapa Muda', stock: 20, price: 8000 },
      kurma_premium: { name: 'Kurma Ajwa', stock: 10, price: 15000 }
    }
  }
}

function resetDailyQuestIfNeeded(stats) {
  const today = todayStr()
  if (stats.dailyQuestDate !== today) {
    stats.dailyQuestDate = today
    stats.dailyQuestDone = { sahur: false, tadarus: false, ngabuburit: false, teraweh: false, buka: false }
    stats.dailyQuestClaimed = false
  }
}

const TOD_QUESTIONS = {
  truth: [
    'Pernah batal puasa diam-diam gak? Jujur!',
    'Siapa orang yang paling pengen kamu ajak bukber tahun ini?',
    'Tarawih full apa bolong-bolong?',
    'Pernah pura-pura puasa padahal udah makan siang?',
    'Surat Al-Qur’an apa yang terakhir kamu baca?',
    'Berapa nominal sedekah paling kecil yang pernah kamu kasih?'
  ],
  dare: [
    'Kirim VN baca Al-Fatihah sekarang!',
    "Update status: 'Aku berjanji tidak akan mokel hari ini 🤲'",
    'Sholawat Nabi 3x di VN!',
    "Chat salah satu admin: 'Maaf lahir batin ya kak 🙏'",
    'Kirim foto menu bukamu hari ini (atau kemarin).'
  ]
}

const NGABUBURIT_EVENTS = [
  { text: 'Jalan sore ketemu Pak Ustadz, kamu dapat nasihat. Hati adem.', reward: { pahala: 50 }, type: 'good' },
  { text: 'Nemu takjil gratis di masjid!', reward: { item: 'takjil_gratis', qty: 1 }, type: 'good' },
  { text: 'Liat orang pacaran, kamu istighfar. Mantap jaga pandangan.', reward: { pahala: 20 }, type: 'good' },
  { text: 'Bantu ibu-ibu nyebrang jalan.', reward: { pahala: 100, exp: 500 }, type: 'good' },
  { text: 'Kepleset kulit pisang depan orang rame… malu tapi lucu.', reward: { energi: -5, mood: -2 }, type: 'bad' },
  { text: 'Ikut kultum sore di masjid kompleks.', reward: { pahala: 150, exp: 200 }, type: 'good' },
  { text: 'Dipalak preman pasar pas beli kolak…', reward: { money: -5000, mood: -3 }, type: 'bad' },
  { text: 'Nemu dompet jatuh, kamu balikin ke orangnya.', reward: { pahala: 500, money: 20000, mood: 3 }, type: 'good' },
  { text: 'Nemu dompet jatuh, kamu ambil isinya… Astaghfirullah.', reward: { dosa: 500, money: 50000, mood: -5 }, type: 'bad' },
  { text: 'Ketiduran di masjid pas nunggu maghrib. Gapapa, yang penting niat.', reward: { energi: 10, mood: 1 }, type: 'neutral' },
  { text: 'Bantu panitia masjid nyiapin takjil.', reward: { pahala: 300, exp: 500 }, type: 'good' },
  { text: 'Main petasan malah kena sandal tetangga.', reward: { dosa: 50, money: -2000, mood: -2 }, type: 'bad' },
  { text: 'Motor mogok pas mau beli es buah.', reward: { energi: -20, money: -5000, mood: -2 }, type: 'bad' },
  { text: 'Dikasih es kelapa muda sama penjualnya karena kamu baik banget.', reward: { item: 'es_kelapa', qty: 1, mood: 3 }, type: 'good' },
  { text: 'Sendal ilang di masjid… yaudah ikhlasin.', reward: { money: -10000, mood: -4 }, type: 'bad' }
]

async function handler(m, { sock }) {
  const db = getDatabase()
  const user = db.getUser(m.sender)
  const cmd = (m.command || '').toLowerCase()
  const stats = getRamadhanStats(user)
  if (!user.inventory) user.inventory = {}
  if (typeof user.koin === 'undefined') user.koin = 0
  if (typeof user.energi === 'undefined') user.energi = config.energi?.default || 25

  resetWarTakjilIfNeeded()
  resetDailyQuestIfNeeded(stats)
  const reply = (text, opts = {}) => m.reply(text, { opts })
  const isRamadhanMenu = cmd === 'ramadhan' || cmd === 'ramadan'
  const sub = (m.args?.[0] || '').toLowerCase()

  if (isRamadhanMenu) {
    if (sub && sub.startsWith('lb')) {
      const type = sub.replace('lb', '')
      const users = db.getAllUsers()
      let sorted = []
      let title = ''
      let unit = ''

      if (type === 'tadarus') {
        title = 'TOP TADARUS 📖'
        unit = 'Ayat'
        sorted = Object.values(users).sort(
          (a, b) => (b.rpg?.ramadhan?.tadarusAyat || 0) - (a.rpg?.ramadhan?.tadarusAyat || 0)
        )
      } else if (type === 'takjil') {
        title = 'RAJA TAKJIL 🍹'
        unit = 'Item'
        sorted = Object.values(users).sort(
          (a, b) => (b.rpg?.ramadhan?.takjilCollected || 0) - (a.rpg?.ramadhan?.takjilCollected || 0)
        )
      } else if (type === 'pahala') {
        title = 'AHLI IBADAH 🕌'
        unit = 'Pahala'
        sorted = Object.values(users).sort(
          (a, b) => (b.rpg?.ramadhan?.pahala || 0) - (a.rpg?.ramadhan?.pahala || 0)
        )
      } else {
        return reply('⚠️ Leaderboard tidak ditemukan. Coba: lbpahala | lbtadarus | lbtakjil')
      }

      let txt = `🏆 *${title}*\n`
      txt += `🗓️ ${todayStr()} (WIB)\n\n`
      let rank = 0
      for (let i = 0; i < sorted.length; i++) {
        const u = sorted[i]
        const val =
          type === 'tadarus'
            ? u.rpg?.ramadhan?.tadarusAyat || 0
            : type === 'takjil'
              ? u.rpg?.ramadhan?.takjilCollected || 0
              : u.rpg?.ramadhan?.pahala || 0

        if (val <= 0) continue
        rank++
        txt += `${rank}. ${u.pushName || u.id?.split('@')?.[0] || 'Unknown'} — *${formatRp(val)} ${unit}*\n`
        if (rank >= 10) break
      }
      if (rank === 0) txt += 'Belum ada data. Gaskeun ibadahnya dulu 😄'
      return reply(txt)
    }

    if (sub === 'status') {
      const t = todayStr()
      const sahurDone = stats.lastSahur === t
      const bukaDone = stats.lastBuka === t
      const terawehDone = stats.lastTeraweh === t

      const quest = stats.dailyQuestDone
      const questCount = Object.values(quest).filter(Boolean).length

      const txt =
        `🌙 *RAMADHAN STATUS*\n` +
        `Hai *${m.pushName}* 🤍\n\n` +
        `👤 *Profil*\n` +
        `🕌 Pahala: *${formatRp(stats.pahala)}*\n` +
        `👹 Dosa: *${formatRp(stats.dosa)}*\n` +
        `🔥 Streak Puasa: *${stats.puasaStreak} hari*\n` +
        `🙂 Mood: *${stats.mood || 0}*\n` +
        `⚡ Energi: *${formatRp(user.energi)}*\n\n` +
        `📌 *Hari ini (${t})*\n` +
        `🥣 Sahur: ${sahurDone ? '✅' : '❌'}\n` +
        `🍽️ Buka: ${bukaDone ? '✅' : '❌'}\n` +
        `🕌 Teraweh: ${terawehDone ? '✅' : '❌'}\n` +
        `🛑 Status Puasa: *${stats.isFasting ? 'SEDANG PUASA' : 'TIDAK PUASA'}*\n\n` +
        `🎯 *Daily Quest* (${questCount}/5)\n` +
        `- Sahur: ${quest.sahur ? '✅' : '❌'}\n` +
        `- Tadarus: ${quest.tadarus ? '✅' : '❌'}\n` +
        `- Ngabuburit: ${quest.ngabuburit ? '✅' : '❌'}\n` +
        `- Teraweh: ${quest.teraweh ? '✅' : '❌'}\n` +
        `- Buka: ${quest.buka ? '✅' : '❌'}\n\n` +
        `👉 Cek quest: \`${m.prefix}ramadhan quest\`\n` +
        `👉 Claim hadiah: \`${m.prefix}ramadhan claim\``
      return reply(txt)
    }

    if (sub === 'inv') {
      const inv = user.inventory || {}
      const keys = Object.keys(inv).filter((k) => inv[k] > 0)
      let txt = `🎒 *INVENTORY RAMADHAN*\n`
      txt += `Uang: Rp ${formatRp(user.koin)}\n`
      txt += `Energi: ${formatRp(user.energi)} | Mood: ${stats.mood || 0}\n\n`

      if (keys.length === 0) {
        txt += `Kosong… yuk belanja takjil dulu 😄\n`
        txt += `➡️ \`${m.prefix}belitakjil\``
        return reply(txt)
      }

      for (const k of keys) {
        txt += `- *${k.replace(/_/g, ' ')}* x${inv[k]}\n`
      }
      txt += `\nPakai item: \`${m.prefix}pakai es_buah\``
      return reply(txt)
    }

    if (sub === 'quest') {
      const q = stats.dailyQuestDone
      const done = Object.values(q).filter(Boolean).length
      const canClaim = done >= 5 && !stats.dailyQuestClaimed

      let txt = `🎯 *DAILY QUEST RAMADHAN*\n`
      txt += `🗓️ ${todayStr()} (WIB)\n\n`
      txt += `Tuntasin 5 misi hari ini buat dapat hadiah!\n\n`
      txt += `1) Sahur ✅ kalau kamu pakai \`${m.prefix}sahur\`\n`
      txt += `2) Tadarus ✅ kalau kamu pakai \`${m.prefix}tadarusan\`\n`
      txt += `3) Ngabuburit ✅ kalau kamu pakai \`${m.prefix}ngabuburit\`\n`
      txt += `4) Teraweh ✅ kalau kamu pakai \`${m.prefix}teraweh\`\n`
      txt += `5) Buka ✅ kalau kamu pakai \`${m.prefix}bukapuasa\`\n\n`
      txt += `Progress: *${done}/5*\n`
      txt += `Status claim: ${stats.dailyQuestClaimed ? '✅ sudah di-claim' : '❌ belum'}\n\n`
      txt += canClaim
        ? `🎁 Kamu siap claim! ketik: \`${m.prefix}ramadhan claim\``
        : `Ayo lanjut! Nanti kalau 5/5, kamu bisa claim hadiah.`
      return reply(txt)
    }

    if (sub === 'claim') {
      const done = Object.values(stats.dailyQuestDone).filter(Boolean).length
      if (stats.dailyQuestClaimed) return reply('✅ Kamu sudah claim hadiah quest hari ini. Besok lanjut lagi ya 😄')
      if (done < 5) return reply(`⏳ Quest kamu baru *${done}/5*. Selesain dulu biar bisa claim!`)

      // reward
      const rewardKoin = 15000
      const rewardPahala = 300
      const rewardExp = 2000

      user.koin += rewardKoin
      stats.pahala += rewardPahala
      await addExpWithLevelCheck(sock, m, db, user, rewardExp)
      stats.dailyQuestClaimed = true

      db.save()
      return reply(
        `🎁 *QUEST CLAIMED!*\n\n` +
          `Mantap! Kamu nyelesain quest harian.\n\n` +
          `💰 Koin: +Rp ${formatRp(rewardKoin)}\n` +
          `🕌 Pahala: +${rewardPahala}\n` +
          `🧠 Exp: +${formatRp(rewardExp)}\n\n` +
          `Besok quest baru muncul lagi 🤍`
      )
    }

    const t = todayStr()
    const txt =
      `🌙 *RAMADHAN HUB*\n` +
      `Hai *${m.pushName}* 🤍\n\n` +
      `🕌 Pahala: *${formatRp(stats.pahala)}* | 👹 Dosa: *${formatRp(stats.dosa)}*\n` +
      `🔥 Streak: *${stats.puasaStreak} hari* | 🛑 Puasa: *${stats.isFasting ? 'YA' : 'TIDAK'}*\n\n` +
      `⏰ *Jam Aktif (WIB)*\n` +
      `🥣 Sahur: ${TIMES.SAHUR.start}-${TIMES.SAHUR.end}\n` +
      `🚶 Ngabuburit: ${TIMES.NGABUBURIT.start}-${TIMES.NGABUBURIT.end}\n` +
      `🍽️ Buka: ${TIMES.BUKA.start}-${TIMES.BUKA.end}\n` +
      `🕌 Teraweh: ${TIMES.TERAWEH.start}-${TIMES.TERAWEH.end}\n\n` +
      `📌 *Cepat Akses*\n` +
      `- Status: \`${m.prefix}ramadhan status\`\n` +
      `- Quest: \`${m.prefix}ramadhan quest\`\n` +
      `- Inventory: \`${m.prefix}ramadhan inv\`\n` +
      `- Shop: \`${m.prefix}belitakjil\`\n` +
      `- War Takjil: \`${m.prefix}wartakjil\`\n` +
      `- Leaderboard: \`${m.prefix}ramadhan lbpahala\` | \`${m.prefix}ramadhan lbtadarus\` | \`${m.prefix}ramadhan lbtakjil\`\n\n` +
      `Hari ini: *${t}*`
    return reply(txt)
  }

  // ===== COMMANDS =====

  if (cmd === 'sahur') {
    if (!isBetweenTimeWindow(TIMES.SAHUR.start, TIMES.SAHUR.end)) {
      return reply(
        `⏰ *Belum waktunya sahur.*\n\n` +
          `Sahur aktif pukul *${TIMES.SAHUR.start}-${TIMES.SAHUR.end}* WIB.\n` +
          `Sekarang: *${nowJkt().format('HH:mm')}* WIB`
      )
    }

    const today = todayStr()
    if (stats.lastSahur === today) return reply('😄 Kamu sudah sahur hari ini. Jangan dobel-dobel ya!')

    stats.lastSahur = today
    stats.isFasting = true
    stats.dailyQuestDone.sahur = true

    // lebih “human”: energi naik tapi gak brutal
    const baseEnergi = config.energi?.default || 25
    user.energi = Math.max(user.energi || 0, baseEnergi) + 35
    stats.mood = (stats.mood || 0) + 1

    const menuSahur = ['Nasi Goreng', 'Ayam Penyet', 'Soto Ayam', 'Mie Instan', 'Kurma & Air Putih', 'Rendang sisa kemarin (legend)']
    const randomMenu = menuSahur[Math.floor(Math.random() * menuSahur.length)]

    db.save()
    return reply(
      `🥣 *SAHUR BERHASIL*\n\n` +
        `Kamu makan *${randomMenu}*.\n` +
        `⚡ Energi +35 | 🙂 Mood +1\n` +
        `🛑 Status: *PUASA DIMULAI* (jaga diri ya 🤍)`
    )
  }

  if (cmd === 'bukapuasa' || cmd === 'buka') {
    if (!isBetweenTimeWindow(TIMES.BUKA.start, TIMES.BUKA.end)) {
      return reply(
        `⏰ *Belum waktunya buka.*\n\n` +
          `Buka aktif pukul *${TIMES.BUKA.start}-${TIMES.BUKA.end}* WIB.\n` +
          `Sekarang: *${nowJkt().format('HH:mm')}* WIB`
      )
    }

    const today = todayStr()
    if (stats.lastBuka === today) return reply('😄 Kamu sudah buka hari ini. Perut butuh jeda juga ya!')

    stats.lastBuka = today
    stats.dailyQuestDone.buka = true

    if (!stats.isFasting) {
      db.save()
      return reply('👀 Kamu lagi gak puasa / sudah mokel, jadi gak dapat pahala puasa. Tapi tetap makan yang bener ya.')
    }

    stats.isFasting = false
    stats.puasaStreak += 1
    stats.pahala += 1000
    user.energi = (user.energi || 0) + 40
    stats.mood = (stats.mood || 0) + 2

    db.save()
    return reply(
      `🍽️ *ALHAMDULILLAH BUKA!*\n\n` +
        `Streak Puasa: *${stats.puasaStreak} hari*\n` +
        `🕌 Pahala +1000 | ⚡ Energi +40 | 🙂 Mood +2\n\n` +
        `Jangan lupa shalat maghrib ya 🤍`
    )
  }

  if (cmd === 'ngabuburit') {
    if (!isBetweenTimeWindow(TIMES.NGABUBURIT.start, TIMES.NGABUBURIT.end)) {
      return reply(
        `🚶 *Ngabuburit belum dibuka.*\n\n` +
          `Aktif pukul *${TIMES.NGABUBURIT.start}-${TIMES.NGABUBURIT.end}* WIB.`
      )
    }

    const cooldown = db.checkCooldown(m.sender, 'ngabuburit', 3600)
    if (cooldown) return reply(`⏳ Sabar ya… tunggu *${cooldown} detik* lagi buat ngabuburit lagi.`)

    const event = NGABUBURIT_EVENTS[Math.floor(Math.random() * NGABUBURIT_EVENTS.length)]
    db.setCooldown(m.sender, 'ngabuburit', 3600)

    let txt = `🚶 *NGABUBURIT*\n\n> ${event.text}\n`
    const r = event.reward || {}

    if (r.pahala) stats.pahala += r.pahala
    if (r.dosa) stats.dosa += r.dosa
    if (r.money) user.koin = (user.koin || 0) + r.money
    if (r.exp) await addExpWithLevelCheck(sock, m, db, user, r.exp)
    if (r.energi) user.energi = (user.energi || 0) + r.energi
    if (r.mood) stats.mood = (stats.mood || 0) + r.mood
    if (r.item) user.inventory[r.item] = (user.inventory[r.item] || 0) + (r.qty || 1)

    stats.dailyQuestDone.ngabuburit = true

    txt += `\n*Efek yang kamu dapet:*`
    if (r.pahala) txt += `\n🕌 Pahala +${r.pahala}`
    if (r.dosa) txt += `\n👹 Dosa +${r.dosa}`
    if (r.money) txt += `\n💰 Koin ${r.money >= 0 ? '+' : ''}Rp ${formatRp(r.money)}`
    if (r.energi) txt += `\n⚡ Energi ${r.energi >= 0 ? '+' : ''}${r.energi}`
    if (r.mood) txt += `\n🙂 Mood ${r.mood >= 0 ? '+' : ''}${r.mood}`
    if (r.item) txt += `\n🎁 Item: ${r.item.replace(/_/g, ' ')} x${r.qty || 1}`

    db.save()
    return reply(txt)
  }

  if (cmd === 'mokel') {
    if (!stats.isFasting) return reply('😄 Kamu memang lagi nggak puasa. Jadi gak ada yang dibatalin.')

    stats.isFasting = false
    stats.dosa += 500
    stats.puasaStreak = 0
    user.energi = (user.energi || 0) + 10
    stats.mood = (stats.mood || 0) - 3

    db.save()
    return reply(
      `😱 *ASTAGHFIRULLAH…*\n\n` +
        `Kamu membatalkan puasa.\n` +
        `👹 Dosa +500 | 🔥 Streak reset | 🙂 Mood -3\n\n` +
        `Besok bisa mulai lagi. Yang penting niatnya dibenerin 🤍`
    )
  }

  if (cmd === 'tadarusan') {
    const cooldown = db.checkCooldown(m.sender, 'tadarusan', 1800)
    if (cooldown) return reply(config.messages.cooldown.replace('%time%', cooldown))

    const ayatRead = Math.floor(Math.random() * 20) + 10
    const pahalaGain = ayatRead * 10
    const expGain = ayatRead * 50

    stats.pahala += pahalaGain
    stats.tadarusAyat += ayatRead
    if (stats.tadarusAyat % 100 < ayatRead) stats.tadarusJuz += 1

    stats.dailyQuestDone.tadarus = true
    stats.mood = (stats.mood || 0) + 1

    await addExpWithLevelCheck(sock, m, db, user, expGain)
    db.setCooldown(m.sender, 'tadarusan', 1800)

    db.save()
    return reply(
      `📖 *TADARUS SELESAI*\n\n` +
        `Kamu membaca *${ayatRead} ayat*.\n` +
        `Total: *${stats.tadarusAyat} ayat* (${stats.tadarusJuz} juz)\n\n` +
        `🕌 Pahala +${pahalaGain}\n` +
        `🧠 Exp +${expGain}\n` +
        `🙂 Mood +1`
    )
  }

  if (cmd === 'teraweh') {
    if (!isBetweenTimeWindow(TIMES.TERAWEH.start, TIMES.TERAWEH.end)) {
      return reply(
        `🕌 *Belum waktunya teraweh.*\n\n` +
          `Aktif pukul *${TIMES.TERAWEH.start}-${TIMES.TERAWEH.end}* WIB.`
      )
    }

    const today = todayStr()
    if (stats.lastTeraweh === today) return reply('✅ Kamu sudah teraweh hari ini. MasyaAllah konsisten!')

    stats.lastTeraweh = today
    stats.pahala += 500
    stats.dailyQuestDone.teraweh = true
    stats.mood = (stats.mood || 0) + 2

    await addExpWithLevelCheck(sock, m, db, user, 2000)

    db.save()
    return reply(`🕌 *TERAWEH BERHASIL*\n\n🕌 Pahala +500\n🧠 Exp +2000\n🙂 Mood +2\n\nSemoga istiqomah 🤍`)
  }

  // SHOP (bisa qty)
  if (cmd === 'belitakjil') {
    const itemKeys = Object.keys(ITEMS)
    const selected = (m.args[0] || '').toLowerCase()
    const qty = Math.max(1, parseInt(m.args[1] || '1'))

    if (!selected) {
      let list = `🏪 *RAMADHAN SHOP*\n\n💰 Uangmu: Rp ${formatRp(user.koin || 0)}\n\n`
      itemKeys.forEach((key, i) => {
        const item = ITEMS[key]
        list += `${i + 1}. *${key.toUpperCase().replace(/_/g, ' ')}*\n`
        list += `   💸 Rp ${formatRp(item.price)}\n`
        list += `   📝 ${item.desc || '-'}\n`
      })
      list += `\nCara beli: \`${m.prefix}belitakjil es_buah 2\` (qty opsional)`
      return reply(list)
    }

    if (!ITEMS[selected]) return reply(`⚠️ Item tidak valid. Cek list: \`${m.prefix}belitakjil\``)

    const item = ITEMS[selected]
    const total = item.price * qty
    if ((user.koin || 0) < total) return reply(`💸 Uangmu kurang.\nButuh: Rp ${formatRp(total)} (qty ${qty})`)

    user.koin -= total
    user.inventory[selected] = (user.inventory[selected] || 0) + qty

    db.save()
    return reply(`✅ Beli *${selected.replace(/_/g, ' ')}* x${qty}\n💸 Total: Rp ${formatRp(total)}`)
  }

  // PAKAI ITEM
  if (cmd === 'pakai') {
    const key = (m.args[0] || '').toLowerCase()
    if (!key) return reply(`Ketik: \`${m.prefix}pakai es_buah\``)
    if (!ITEMS[key]) return reply('⚠️ Item tidak dikenal.')
    if ((user.inventory[key] || 0) <= 0) return reply(`⚠️ Kamu nggak punya *${key.replace(/_/g, ' ')}*.`)

    const item = ITEMS[key]
    if (!item.consumable) return reply(`❌ *${key.replace(/_/g, ' ')}* itu item permanen, bukan consumable.`)
    if (typeof item.apply !== 'function') return reply('⚠️ Item ini belum punya efek yang bisa dipakai.')

    user.inventory[key] -= 1
    const msg = item.apply(user, stats)

    db.save()
    return reply(`✨ *PAKAI ITEM*\n\n✅ ${key.replace(/_/g, ' ')} digunakan.\n${msg}`)
  }

  // PETASAN
  if (cmd === 'petasan') {
    if ((user.inventory.petasan || 0) < 1) return reply(`⚠️ Kamu nggak punya petasan.\nBeli dulu: \`${m.prefix}belitakjil petasan\``)

    user.inventory.petasan -= 1
    const sounds = ['DUAR! 💥', 'PRETEL… DUAR! 💣', 'Sssstt… BOOM! 🎇', 'Pletak… (gagal meledak) 💨']
    const sound = sounds[Math.floor(Math.random() * sounds.length)]

    if (Math.random() < 0.2) {
      user.energi = Math.max(0, (user.energi || 0) - 10)
      stats.mood = (stats.mood || 0) - 2
      db.save()
      return reply(`💥 *MELEDAK DI TANGAN!* 💥\n\n> ${sound}\n⚡ Energi -10 | 🙂 Mood -2\n\nYah… lain kali jangan sok jago 😭`)
    }

    stats.mood = (stats.mood || 0) + 1
    db.save()
    return reply(`🎇 *PETASAN!* \n\n> ${sound}\nTetangga kaget… kamu kabur 🤣\n🙂 Mood +1`)
  }

  // PERANG SARUNG
  if (cmd === 'perangsarung') {
    if ((user.inventory.sarung || 0) < 1) return reply(`⚠️ Butuh item *Sarung*.\nBeli: \`${m.prefix}belitakjil sarung\``)

    const target = m.mentionedJid?.[0]
    if (!target) return reply(`⚠️ Tag lawanmu.\nContoh: \`${m.prefix}perangsarung @user\``)
    if (target === m.sender) return reply('⚠️ Gak bisa perang sama diri sendiri…')

    const win = Math.random() > 0.5
    const expGain = 2000
    const moneyGain = 10000

    if (win) {
      await addExpWithLevelCheck(sock, m, db, user, expGain)
      user.koin += moneyGain
      stats.pahala = Math.max(0, stats.pahala - 50)
      stats.mood = (stats.mood || 0) + 1
      db.save()
      return reply(
        `⚔️ *PERANG SARUNG: MENANG!* \n\n` +
          `Kamu pakai jurus *Ulti Sarung Gajah Duduk*… lawan K.O!\n\n` +
          `💰 +Rp ${formatRp(moneyGain)}\n` +
          `🧠 +${expGain} Exp\n` +
          `⚠️ Pahala -50 (kekerasan)\n` +
          `🙂 Mood +1`
      )
    } else {
      user.energi = Math.max(0, (user.energi || 0) - 20)
      stats.mood = (stats.mood || 0) - 1
      db.save()
      return reply(`⚔️ *PERANG SARUNG: KALAH…*\n\nKena sabetan *Sarung Wadimor*.\n⚡ Energi -20 | 🙂 Mood -1`)
    }
  }

  // BANGUNIN SAHUR
  if (cmd === 'bangunin') {
    if (!isBetweenTimeWindow(TIMES.SAHUR.start, TIMES.SAHUR.end)) return reply('😴 Jangan ganggu orang tidur… ini bukan jam sahur.')

    const target = m.mentionedJid?.[0]
    if (!target) return reply('⚠️ Tag orang yang mau dibangunin!')

    stats.pahala += 50
    stats.mood = (stats.mood || 0) + 1
    db.save()

    return sock.sendMessage(
      m.chat,
      {
        text:
          `🔊 *SAHUR! SAHUR!* 🔊\n\n` +
          `Oy @${target.split('@')[0]}, bangun woy! Keburu imsak!\n\n` +
          `🕌 Pahala +50 buat yang membangunkan 🤲`,
        mentions: [target]
      },
      { quoted: m }
    )
  }

  // BUKBER (fix reply mentions via sock.sendMessage already)
  if (cmd === 'bukber') {
    if (!m.isGroup) return reply('❌ Bukber cuma bisa di grup ya 😄')
    if (!isBetweenTimeWindow('16:00', '18:30')) return reply('⏰ Bukber dibuka jam 16:00 sampai maghrib!')

    if (!global.bukberSessions) global.bukberSessions = {}
    const session = global.bukberSessions[m.chat]
    const subCmd = (m.args[0] || '').toLowerCase()

    if (!session) {
      if (subCmd === 'start') {
        global.bukberSessions[m.chat] = {
          host: m.sender,
          participants: [m.sender],
          created_at: Date.now()
        }
        return sock.sendMessage(
          m.chat,
          {
            text:
              `🍱 *BUKBER DIMULAI!*\n\n` +
              `Host: @${m.sender.split('@')[0]}\n\n` +
              `Ketik \`${m.prefix}bukber join\` buat ikutan.\n` +
              `Makin rame, makin besar bonusnya 😄`,
            mentions: [m.sender]
          },
          { quoted: m }
        )
      }
      return reply(`⚠️ Belum ada sesi bukber.\nMulai dulu: \`${m.prefix}bukber start\``)
    }

    if (subCmd === 'join') {
      if (session.participants.includes(m.sender)) return reply('⚠️ Kamu sudah join bukber ini.')
      session.participants.push(m.sender)
      return sock.sendMessage(
        m.chat,
        {
          text: `✅ @${m.sender.split('@')[0]} join bukber!\nTotal: ${session.participants.length} orang.`,
          mentions: [m.sender]
        },
        { quoted: m }
      )
    }

    if (subCmd === 'claim') {
      if (session.host !== m.sender) return reply('⚠️ Cuma host yang bisa claim reward bukber.')
      if (!isBetweenTimeWindow(TIMES.BUKA.start, TIMES.BUKA.end)) return reply(`⏳ Tunggu maghrib dulu (${TIMES.BUKA.start} WIB).`)

      let txt = `🍱 *BUKBER SELESAI!*\n\n`
      const bonusPahala = session.participants.length * 500
      const bonusExp = session.participants.length * 200

      for (const participant of session.participants) {
        const pUser = db.getUser(participant)
        const pStats = getRamadhanStats(pUser)
        resetDailyQuestIfNeeded(pStats)

        pStats.pahala += bonusPahala
        pUser.exp = (pUser.exp || 0) + bonusExp
        pUser.energi = (pUser.energi || 0) + 30
        pStats.mood = (pStats.mood || 0) + 2

        txt += `- @${participant.split('@')[0]} (🕌 +${bonusPahala}, 🧠 +${bonusExp}, ⚡ +30)\n`
      }

      delete global.bukberSessions[m.chat]
      db.save()

      return sock.sendMessage(m.chat, { text: txt, mentions: session.participants }, { quoted: m })
    }

    return reply(
      `🍱 *BUKBER MENU*\n\n` +
        `Host: @${session.host.split('@')[0]}\n` +
        `Participants: ${session.participants.length}\n\n` +
        `- \`${m.prefix}bukber join\`\n` +
        `- \`${m.prefix}bukber claim\` (Host, pas maghrib)`
    )
  }

  // KELILING SAHUR / PATROL
  if (cmd === 'kelilingsahur' || cmd === 'patrol') {
    if (!isBetweenTimeWindow(TIMES.SAHUR.start, TIMES.SAHUR.end))
      return reply(`⏰ Keliling sahur cuma bisa jam ${TIMES.SAHUR.start}-${TIMES.SAHUR.end} WIB!`)

    const patterns = ['dung tak dung', 'tak dung tak', 'dung dung tak', 'tak tak dung']
    const pattern = patterns[Math.floor(Math.random() * patterns.length)]

    if (!m.args[0]) {
      return reply(
        `🥁 *KELILING SAHUR*\n\n` +
          `Ketik pola kentongan ini (harus persis):\n` +
          `\`${m.prefix}kelilingsahur ${pattern}\``
      )
    }

    const userPattern = m.args.join(' ').toLowerCase()
    if (patterns.includes(userPattern)) {
      const reward = 10000
      const pahala = 50
      user.koin += reward
      stats.pahala += pahala
      stats.mood = (stats.mood || 0) + 1
      db.save()
      return reply(`🥁 *DUNG DUNG TAK!* \n\nWarga kebangun dan senyum 😄\n💰 +Rp ${formatRp(reward)}\n🕌 +${pahala} pahala\n🙂 Mood +1`)
    }
    return reply('🔇 Salah pola… kentonganmu sumbang. Coba lagi ya 😭')
  }

  // THR
  if (cmd === 'thr') {
    if (!m.isOwner && !m.isAdmin) return reply('❌ Hanya Owner/Admin yang bisa bagi THR!')

    const amount = parseInt(m.args[0])
    const count = parseInt(m.args[1]) || 1

    if (!amount || isNaN(amount)) return reply(`⚠️ Format: \`${m.prefix}thr [jumlah_per_orang] [pemenang]\`\nContoh: \`${m.prefix}thr 10000 5\``)
    if (user.koin < amount * count) return reply(`💸 Uangmu kurang buat bagi THR segitu.`)

    user.koin -= amount * count
    db.save()

    const sessionID = m.chat + '_thr_' + Date.now()
    global.thrSession = global.thrSession || {}
    global.thrSession[sessionID] = { amount, quota: count, claimedBy: [] }

    await sock.sendMessage(
      m.chat,
      {
        text:
          `💸 *THR KAGET!* 💸\n\n` +
          `@${m.sender.split('@')[0]} bagi-bagi THR!\n` +
          `💰 Nominal: *Rp ${formatRp(amount)}*\n` +
          `👥 Kuota: *${count} orang*\n\n` +
          `Siapa cepat dia dapat!`,
        mentions: [m.sender],
        buttons: [
          {
            buttonId: `thr_claim ${sessionID}`,
            buttonText: { displayText: '💰 AMBIL THR' },
            type: 1
          }
        ],
        headerType: 1,
        viewOnce: true
      },
      { quoted: m }
    )
    return
  }

  if (cmd === 'thr_claim') {
    const sessionID = m.args[0]
    if (!global.thrSession || !global.thrSession[sessionID]) return reply('⚠️ Sesi THR sudah berakhir / tidak valid.')

    const session = global.thrSession[sessionID]
    if (session.quota <= 0) {
      delete global.thrSession[sessionID]
      return reply('❌ Telat… THR sudah habis!')
    }
    if (session.claimedBy.includes(m.sender)) return reply('⚠️ Kamu sudah ambil THR ini.')

    session.quota -= 1
    session.claimedBy.push(m.sender)
    user.koin += session.amount

    db.save()
    return reply(`✅ Dapat THR *Rp ${formatRp(session.amount)}*! 🎉\nSisa kuota: ${session.quota}`)
  }

  // WAR TAKJIL
  if (cmd === 'wartakjil' || cmd === 'bukawarung') {
    resetWarTakjilIfNeeded()

    if (!isBetweenTimeWindow(TIMES.WARTAKJIL.start, TIMES.WARTAKJIL.end) && !m.isOwner) {
      return reply(`⏰ War Takjil buka jam *${TIMES.WARTAKJIL.start}-${TIMES.WARTAKJIL.end}* WIB!`)
    }

    const subCmd = (m.args[0] || '').toLowerCase()
    const targetItem = (m.args[1] || '').toLowerCase()

    if (subCmd === 'beli') {
      if (!targetItem) return reply('⚠️ Mau beli apa? Contoh: `wartakjil beli es_buah`')
      const item = WAR_TAKJIL_STOCK.items[targetItem]
      if (!item) return reply('⚠️ Menu tidak ada!')
      if (item.stock <= 0) return reply(`❌ *${item.name}* sudah SOLD OUT!`)
      if (user.koin < item.price) return reply('💸 Uangmu kurang!')

      user.koin -= item.price
      item.stock -= 1
      stats.takjilCollected += 1
      user.inventory[targetItem] = (user.inventory[targetItem] || 0) + 1

      db.save()
      return reply(`✅ Kebeli: *${item.name}*\n📦 Sisa stok: ${item.stock}\n🎒 Masuk inventory: ${targetItem}`)
    }

    let list = `⚔️ *WAR TAKJIL* ⚔️\n`
    list += `🗓️ ${todayStr()} | ⏰ ${TIMES.WARTAKJIL.start}-${TIMES.WARTAKJIL.end} WIB\n\n`
    list += `Uangmu: Rp ${formatRp(user.koin)}\n\n`

    Object.keys(WAR_TAKJIL_STOCK.items).forEach((key, i) => {
      const it = WAR_TAKJIL_STOCK.items[key]
      list += `${i + 1}. *${it.name}* (${key})\n`
      list += `   💰 Rp ${formatRp(it.price)} | 📦 Stok: ${it.stock}${it.stock === 0 ? ' ❌' : ''}\n`
    })

    list += `\nBeli: \`${m.prefix}wartakjil beli es_buah\``
    return reply(list)
  }

  // TOD
  if (cmd === 'tod') {
    const type = Math.random() > 0.5 ? 'Truth' : 'Dare'
    const q = type === 'Truth' ? TOD_QUESTIONS.truth : TOD_QUESTIONS.dare
    const pick = q[Math.floor(Math.random() * q.length)]
    return reply(`🎲 *TOD RAMADHAN*\n\n🅰️ *${type.toUpperCase()}*\n"${pick}"\n\nJawab jujur / lakukan tantangan 😄`)
  }

  // SEDEKAH
  if (cmd === 'sedekah') {
    const target = m.mentionedJid?.[0]
    const amount = parseInt(m.args[1])

    if (!target) return reply(`⚠️ Tag orangnya.\nContoh: \`${m.prefix}sedekah @user 10000\``)
    if (!amount || isNaN(amount) || amount < 1000) return reply('⚠️ Minimal sedekah Rp 1.000')
    if (user.koin < amount) return reply('💸 Uangmu kurang!')
    if (target === m.sender) return reply('😄 Sedekah ke diri sendiri itu mindahin dompet…')

    const targetUser = db.getUser(target)
    user.koin -= amount
    targetUser.koin = (targetUser.koin || 0) + amount

    const pahalaEarned = Math.floor(amount / 100)
    stats.pahala += pahalaEarned
    stats.dosa = Math.max(0, stats.dosa - Math.floor(pahalaEarned / 2))
    stats.mood = (stats.mood || 0) + 2

    db.save()

    return sock.sendMessage(
      m.chat,
      {
        text:
          `🤲 *SEDEKAH TERKIRIM*\n\n` +
          `Kamu sedekah *Rp ${formatRp(amount)}* ke @${target.split('@')[0]}.\n\n` +
          `🕌 Pahala +${pahalaEarned}\n` +
          `👹 Dosa berkurang ${Math.floor(pahalaEarned / 2)}\n` +
          `🙂 Mood +2`,
        mentions: [target]
      },
      { quoted: m }
    )
  }
}

module.exports = { config: pluginConfig, handler }