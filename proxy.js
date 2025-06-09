import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

app.get(['/proxy', '/proxy.m3u8'], async (req, res) => {
  const url = req.query.url;

  if (!url || !url.startsWith('http://hls3.bashtel.ru')) {
    return res.status(400).send('Invalid URL');
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Если это .m3u8, подменяем все .ts-ссылки
    if (url.endsWith('.m3u8') || contentType.includes('mpegurl')) {
      const text = await response.text();
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
      const proto = req.headers['x-forwarded-proto'] || 'http';
      const proxyBase = `${proto}://${req.get('host')}${req.path}`;


      // Заменяем как относительные, так и абсолютные ts-ссылки
      const updated = text.replace(/^(?!#)(.+\.ts)$/gm, (line) => {
        let fullTsUrl;
        try {
          fullTsUrl = new URL(line, baseUrl).href; // обработка относительных и абсолютных путей
        } catch {
          fullTsUrl = baseUrl + line;
        }
        const encoded = encodeURIComponent(fullTsUrl);
        return `${proxyBase}?url=${encoded}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.status(200).send(updated);
    }

    // Прокси .ts или других бинарных файлов
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).send('Proxy error: ' + error.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy running on port ${port}`));
