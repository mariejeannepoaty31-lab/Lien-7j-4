const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const DATE_DEBUT = '2026-05-28T21:40:00'; // Départ maintenant 21h40
const DUREE_MINUTES = 1440; // 1 jour = 24h x 60min = 1440min

app.get('/', async (req, res) => {
  const debut = new Date(DATE_DEBUT);
  const maintenant = new Date();
  const diffMinutes = (maintenant - debut) / (1000 * 60);

  if (diffMinutes > DUREE_MINUTES) {
    return res.status(403).send('Lien expiré');
  }

  try {
    const response = await axios.get('https://iptv-org.github.io/iptv/index.country.m3u');
    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Erreur lors du chargement de la playlist');
  }
});

app.listen(PORT, () => console.log(`App running on ${PORT}`));
