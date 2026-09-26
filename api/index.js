import app, { readyPromise } from '../server/index.js';

export default async function handler(req, res) {
  try {
    await readyPromise;
  } catch (e) {
    console.warn('DB initialization notice in serverless handler:', e.message);
  }
  return app(req, res);
}
