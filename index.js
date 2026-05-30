const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. DATE DE CRÉATION FIXE - NE TOUCHE PLUS APRÈS DÉPLOIEMENT
const DATE_DEBUT = '2026-05-29T21:38:00+01:00'; // 29 mai 21h38 Congo
const DUREE_MINUTES = 60; // 1h = 60min
const LIEN_FOURNISSEUR = 'COLLE_TON_LIEN_M3U_ICI';

function estExpire() {
  const maintenant = new Date();
  const debut = new Date(DATE_DEBUT);
  const diffMinutes = (maintenant - debut) / 1000 / 60;
  return diffMinutes > DUREE_MINUTES;
}

app.get('/playlist.m3u', async (req, res) => {
  // Check expiration AVANT tout
  if (estExpire()) {
    const debut = new Date(DATE_DEBUT);
    const expireLe = new Date(debut.getTime() + DUREE_MINUTES*60000);
    return res.status(403).type('text/plain')
      .send(`403 FORBIDDEN\nLien expiré depuis ${expireLe.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville'})}`);
  }

  try {
    const response = await axios.get(LIEN_FOURNISSEUR, { 
      timeout: 10000,
      headers: {'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20'}
    });
    res.set('Content-Type', 'application/x-mpegURL');
    res.set('Cache-Control', 'no-cache');
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Erreur fournisseur');
  }
});

app.get('/', (req, res) => {
  const debut = new Date(DATE_DEBUT);
  const expireLe = new Date(debut.getTime() + DUREE_MINUTES*60000);
  const maintenant = new Date();
  const restant = Math.max(0, (expireLe - maintenant)/1000/60);
  
  res.type('text/plain').send(
    `Statut: ${estExpire() ? 'EXPIRÉ' : 'ACTIF'}\n` +
    `Créé le: ${debut.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville'})}\n` +
    `Expire le: ${expireLe.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville'})}\n` +
    `Temps restant: ${restant.toFixed(1)} min`
  );
});

app.listen(PORT, () => {
  const debut = new Date(DATE_DEBUT);
  const expireLe = new Date(debut.getTime() + DUREE_MINUTES*60000);
  console.log(`Serveur lancé. Expiration forcée à ${expireLe.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville'})}`);
});
