import https from 'https';
import http from 'http';

const HOST = 'sysarmortech.com';
const KEY = '5c47cea4709f444c926a5cd1a7758f11'; // Tu clave API de Bing
const SITEMAP_URL = `https://${HOST}/sitemap-0.xml`; // Ajusta si tu sitemap usa otra ruta (ej. /sitemap.xml)

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

    // Extraer todas las URLs entre las etiquetas <loc>...</loc>
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
      console.log(`✅ IndexNow Notificación Exitosa - Status: ${res.statusCode}`);
    });

    req.on('error', (e) => {
      console.error(`❌ Error en la petición a IndexNow: ${e.message}`);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error(`❌ Error general en la automatización: ${error.message}`);
  }
}

notifyIndexNow();