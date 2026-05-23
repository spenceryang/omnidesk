import app from './app.js';

const port = Number(process.env.OMNIDESK_API_PORT || 8787);
app.listen(port, '127.0.0.1', () => {
  console.log(`Omnidesk live API running on http://127.0.0.1:${port}`);
});
