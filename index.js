const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://iptv-org.github.io/iptv/index.country.m3u');
    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Erreur lors du chargement de la playlist');
  }
});

app.listen(PORT, () => console.log(`App running on ${PORT}`));
