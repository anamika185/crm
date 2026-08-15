import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Db } from './db.js';
import { seed } from './seed.js';
import { createApi } from './api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const dataDir = process.env.CRM_DATA_DIR
  ? process.env.CRM_DATA_DIR
  : path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'crm.sqlite');
const db = new Db(dbPath);

if (!db.isSeeded) {
  seed(db);
  console.log('Seeded sample data into', dbPath);
}

const app = express();
app.use(express.json());
app.use('/api', createApi(db));

const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = Number(process.env.PORT || 5173);
app.listen(port, '0.0.0.0', () => {
  console.log(`Personal CRM running at http://localhost:${port}`);
  console.log(`Database: ${dbPath}`);
});