const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. FORCE LE TIMEZONE CONGO POUR TOUT LE SERVEUR
process.env.TZ = 'Africa/Brazzaville';

// 2. DATE DE CRÉATION FIXE : 31 mai 2026 21h59 Congo
const DATE_DEBUT = '2026-05-31T21:59:00+01:00'; 
const DUREE_MINUTES = 45; // 45min exactement
const LIEN_FOURNISSEUR = 'COLLE_TON_LIEN_M3U_ICI';

function estExpire() {
  const maintenant = new Date(); // Render en UTC mais TZ forcé
  const debut = new Date(DATE_DEBUT);
  const diffMinutes = (maintenant.getTime() - debut.getTime()) / 1000 / 60;
  return diffMinutes > DUREE_MINUTES;
}

app.get('/playlist.m3u', async (req, res) => {
  if (estExpire()) {
    const expireLe = new Date(new Date(DATE_DEBUT).getTime() + DUREE_MINUTES*60000);
    return res.status(403).type('text/plain')
      .send(`403 FORBIDDEN\nLien expiré depuis ${expireLe.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville'})}`);
  }

  try {
    const response = await axios.get(LIEN_FOURNISSEUR, {timeout: 10000});
    res.set('Content-Type', 'application/x-mpegURL');
    res.set('Cache-Control', 'no-cache, no-store');
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Erreur fournisseur');
  }
});

app.get('/', (req, res) => {
  const debut = new Date(DATE_DEBUT);
  const expireLe = new Date(debut.getTime() + DUREE_MINUTES*60000);
  const restant = Math.max(0, (expireLe - new Date())/1000/60);
  
  res.type('text/plain').send(
    `Statut: ${estExpire() ? 'EXPIRÉ' : 'ACTIF'}\n` +
    `Heure serveur: ${new Date().toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville'})} Congo\n` +
    `Créé le: ${debut.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville'})}\n` +
    `Expire le: ${expireLe.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville'})}\n` +
    `Temps restant: ${restant.toFixed(1)} min`
  );
});

app.listen(PORT, () => {
  const expireLe = new Date(new Date(DATE_DEBUT).getTime() + DUREE_MINUTES*60000);
  console.log(`Expiration forcée à ${expireLe.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville'})}`);
});
