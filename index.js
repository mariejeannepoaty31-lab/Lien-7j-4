const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. FORCE LE TIMEZONE CONGO POUR TOUT LE SERVEUR
process.env.TZ = 'Africa/Brazzaville';

// 2. CONFIG - Modifie juste ici
const DATE_DEBUT = '2026-06-02T21:20:00+01:00'; // Format: AAAA-MM-JJTHH:mm:ss+01:00
const DUREE_MINUTES = 55; // 55 minutes exactement
const LIEN_FOURNISSEUR = 'COLLE_TON_LIEN_M3U_ICI'; // Ton lien M3U du fournisseur

function getTimes() {
  const debut = new Date(DATE_DEBUT);
  const expireLe = new Date(debut.getTime() + DUREE_MINUTES * 60000);
  const maintenant = new Date();
  const restantMs = expireLe.getTime() - maintenant.getTime();
  const restantMin = Math.max(0, restantMs / 1000 / 60);
  const expire = restantMs <= 0;
  
  return {
    maintenant_utc: maintenant.toISOString(),
    maintenant_congo: maintenant.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville', hour12: false}),
    debut_congo: debut.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville', hour12: false}),
    expire_congo: expireLe.toLocaleString('fr-FR', {timeZone: 'Africa/Brazzaville', hour12: false}),
    expire_utc: expireLe.toISOString(),
    restant_min: restantMin,
    est_expire: expire
  };
}

app.get('/playlist.m3u', async (req, res) => {
  const t = getTimes();
  
  if (t.est_expire) {
    return res.status(403).type('text/plain').send(
`403 FORBIDDEN
Lien expiré depuis ${t.expire_congo} Congo
Heure Render UTC: ${t.expire_utc}
Durée: ${DUREE_MINUTES}min
Contact support pour renouveler`
    );
  }

  try {
    const response = await axios.get(LIEN_FOURNISSEUR, {
      timeout: 10000,
      headers: {'User-Agent': 'Mozilla/5.0'}
    });
    
    res.set('Content-Type', 'application/x-mpegURL');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(response.data);
    
  } catch (err) {
    res.status(500).type('text/plain').send(
`500 ERREUR FOURNISSEUR
Impossible de récupérer le flux
Heure: ${t.maintenant_congo} Congo`
    );
  }
});

// Page statut avec compte à rebours
app.get('/', (req, res) => {
  const t = getTimes();
  const min = Math.floor(t.restant_min);
  const sec = Math.floor((t.restant_min - min) * 60);
  
  res.type('text/html').send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Statut Lien M3U</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:Arial;background:#0f172a;color:#e2e8f0;padding:20px;text-align:center}
.box{max-width:500px;margin:50px auto;background:#1e293b;padding:30px;border-radius:15px;border:2px solid ${t.est_expire ? '#ef4444' : '#22c55e'}}
h1{margin:0 0 20px;font-size:24px}
.status{font-size:32px;font-weight:bold;margin:20px 0;color:${t.est_expire ? '#ef4444' : '#22c55e'}}
.timer{font-size:48px;font-family:monospace;margin:20px 0}
.info{margin:15px 0;font-size:16px;line-height:1.8}
.label{color:#94a3b8}
.note{margin-top:25px;font-size:13px;color:#64748b;border-top:1px solid #334155;padding-top:15px}
</style>
</head>
<body>
<div class="box">
<h1>🔐 Lien M3U Sécurisé</h1>
<div class="status">${t.est_expire ? 'EXPIRÉ ❌' : 'ACTIF ✅'}</div>
${!t.est_expire ? `<div class="timer">${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}</div>` : ''}
<div class="info">
<div><span class="label">Heure Congo UTC+1:</span> ${t.maintenant_congo}</div>
<div><span class="label">Heure Render UTC:</span> ${t.maintenant_utc.replace('T',' ').replace('Z','')}</div>
<div><span class="label">Créé le:</span> ${t.debut_congo}</div>
<div><span class="label">Expire le:</span> ${t.expire_congo} Congo</div>
<div><span class="label">Expire Render UTC:</span> ${t.expire_utc.replace('T',' ').replace('Z','')}</div>
<div><span class="label">Durée totale:</span> ${DUREE_MINUTES} minutes</div>
</div>
<div class="note">
⚠️ Render tourne en UTC. Congo = UTC+1 donc +1h d'avance<br>
URL du flux: <a href="/playlist.m3u" style="color:#60a5fa">/playlist.m3u</a>
</div>
</div>
<script>
// Auto-refresh toutes les secondes pour le compte à rebours
${!t.est_expire ? 'setTimeout(()=>location.reload(),1000);' : ''}
</script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  const t = getTimes();
  console.log('='.repeat(50));
  console.log(`Serveur démarré sur port ${PORT}`);
  console.log(`Timezone forcé: Africa/Brazzaville UTC+1`);
  console.log(`Heure Congo: ${t.maintenant_congo}`);
  console.log(`Heure Render UTC: ${t.maintenant_utc}`);
  console.log(`Créé le: ${t.debut_congo} Congo`);
  console.log(`Expire le: ${t.expire_congo} Congo = ${t.expire_utc} UTC`);
  console.log(`Durée: ${DUREE_MINUTES} minutes`);
  console.log('='.repeat(50));
});
