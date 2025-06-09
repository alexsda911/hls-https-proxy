import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
  const url = req.query.url;

  if (!url || !url.startsWith('http://hls3.bashtel.ru')) {
    return res.status(400).send('Invalid URL');
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    if (url.endsWith('.m3u8') || contentType.includes('mpegurl')) {
      const text = await response.text();
      const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
      const proxyBase = `${req.protocol}://${req.get('host')}${req.path}`;

      const updated = text.replace(/^(?!#)(.+\.ts)$/gm, (line) => {
        const fullUrl = new URL(line, baseUrl).href;
        const encoded = encodeURIComponent(fullUrl);
        return `${proxyBase}?url=${encoded}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.status(200).send(updated);
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).send('Proxy error: ' + error.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy listening on port ${port}`));
