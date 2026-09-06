import https from 'https';
import http from 'http';

const HOST = 'sysarmortech.com';
const KEY = '288ab56fe97c4744b8ea5552bcda57f0';
const SITEMAP_URL = `https://${HOST}/sitemap-0.xml`;

function fetchSitemap() {
  return new Promise((resolve, reject) => {
    https.get(SITEMAP_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Fallo al descargar sitemap. Status code: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function notifyIndexNow() {
  try {
    console.log(`🔍 Consultando sitemap en vivo: ${SITEMAP_URL}`);
    const xmlContent = await fetchSitemap();

    const locRegex = /<loc>(.*?)<\/loc>/g;
    const urlList = [];
    let match;

    while ((match = locRegex.exec(xmlContent)) !== null) {
      urlList.push(match[1]);
    }

    if (urlList.length === 0) {
      console.warn('⚠️ No se encontraron URLs en el sitemap.');
      return;
    }

    console.log(`🚀 Se extrajeron ${urlList.length} URLs dinámicamente (Blog + Herramientas). Enviando a IndexNow...`);

    const postData = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urlList
    });

    const options = {
      hostname: 'api.indexnow.org',
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          console.log(`✅ IndexNow Notificación Exitosa - Status: ${res.statusCode}`);
        } else {
          console.warn(`⚠️ IndexNow respondió con código inesperado: ${res.statusCode} - ${responseBody}`);
        }
      });
    });

    req.on('error', (e) => {
      if (e.code !== 'ECONNRESET') {
        console.error(`❌ Error en la petición a IndexNow: ${e.message}`);
      }
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error(`❌ Error general en la automatización: ${error.message}`);
  }
}

notifyIndexNow();