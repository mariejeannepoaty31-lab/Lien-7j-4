const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

process.env.TZ = 'Africa/Brazzaville';

// ========== MODIFIE SEULEMENT CES 3 LIGNES ==========
// LIGNE 1: Mets l'heure Congo actuelle avec +01:00
const DATE_DEBUT = '2026-06-02T21:50:00+01:00'; 

// LIGNE 2: Durée 15min
const DUREE_MINUTES = 15;

// LIGNE 3: COLLE TON LIEN M3U ICI ENTRE LES GUILLEMETS
const LIEN_FOURNISSEUR = 'https://iptv-org.github.io/iptv/index.m3u';
// ========== NE TOUCHE PAS AU RESTE ==========

function estExpire() {
  const maintenant = new Date();
  const debut = new Date(DATE_DEBUT);
  const diffMinutes = (maintenant.getTime() - debut.getTime()) / 1000 / 60;
  return diffMinutes > DUREE_MINUTES;
}

function getExpireTime() {
  return new Date(new Date(DATE_DEBUT).getTime() + DUREE_MINUTES*60000);
}

function formatHeure(date) {
  return date.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville', hour12: false});
}

app.get('/playlist.m3u', async (req, res) => {
  if (estExpire()) {
    return res.type('application/x-mpegURL').send('#EXTM3U\n#EXTINF:-1,LIEN EXPIRE\n');
  }
  try {
    const response = await axios.get(LIEN_FOURNISSEUR, {timeout: 15000});
    let data = response.data;
    data = data.replace(/(https?:\/\/[^\s"']+\.(m3u8|ts)[^\s"']*)/g, (url) => {
      return '/proxy?url=' + encodeURIComponent(url);
    });
    res.set('Content-Type', 'application/x-mpegURL');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(data);
  } catch (err) {
    res.status(500).send('Erreur fournisseur');
  }
});

app.get('/proxy', async (req, res) => {
  if (estExpire()) return res.status(403).end();
  const url = req.query.url;
  if (!url) return res.status(400).end();
  try {
    const response = await axios.get(url, {responseType: 'stream', timeout: 20000, headers: {'User-Agent': 'VLC/3.0.18'}});
    res.set('Content-Type', response.headers['content-type'] || 'video/mp2t');
    res.set('Cache-Control', 'no-cache');
    response.data.pipe(res);
  } catch (err) {
    res.status(500).end();
  }
});

app.get('/', (req, res) => {
  const expireLe = getExpireTime();
  const restant = Math.max(0, (expireLe - new Date())/1000/60);
  const min = Math.floor(restant);
  const sec = Math.floor((restant - min) * 60);
  const actif = !estExpire();
  res.type('text/html').send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:Arial;background:#0f172a;color:#fff;text-align:center;padding:30px}.box{max-width:400px;margin:auto;background:#1e293b;padding:30px;border-radius:15px;border:3px solid ${actif ? '#22c55e' : '#ef4444'}}h1{font-size:28px}.status{font-size:40px;font-weight:bold;color:${actif ? '#22c55e' : '#ef4444'}}.timer{font-size:60px;font-family:monospace;margin:20px 0}.info{font-size:18px;line-height:2;margin-top:20px}</style></head><body><div class="box"><h1>LIEN M3U</h1><div class="status">${actif ? 'ACTIF ✅' : 'EXPIRÉ ❌'}</div>${actif ? `<div class="timer">${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}</div>` : ''}<div class="info">Heure Congo: ${formatHeure(new Date())}<br>Début: ${formatHeure(new Date(DATE_DEBUT))}<br>Expire: ${formatHeure(expireLe)}<br>Durée: ${DUREE_MINUTES}min</div></div><script>${actif ? 'setTimeout(()=>location.reload(),1000);' : ''}</script></body></html>`);
});

app.listen(PORT, () => {
  console.log(`EXPIRATION: ${formatHeure(getExpireTime())} Congo`);
});
