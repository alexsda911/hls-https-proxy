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
    res.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    response.body.pipe(res);
  } catch (error) {
    res.status(500).send('Proxy error: ' + error.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy listening on port ${port}`));
