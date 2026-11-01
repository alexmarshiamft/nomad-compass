import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use('/api', createProxyMiddleware({ target: 'http://127.0.0.1:3000', changeOrigin: true }));

const publicDir = path.join(__dirname, 'artifacts/nomad-compass/dist/public');
app.use(express.static(publicDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(8080, () => {
  console.log('Production preview server running on http://localhost:8080');
});
