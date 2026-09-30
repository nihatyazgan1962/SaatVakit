const https = require('https');

function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => resolve(''));
  });
}

(async () => {
  const html = await fetchPage('https://www.davetradyo.com.tr');
  const regex = /https?:\/\/[a-zA-Z0-9.\-_]+(?::[0-9]+)?\/[a-zA-Z0-9.\-_/;\?=&]*/g;
  const matches = html.match(regex) || [];
  const audioMatches = matches.filter(m => m.includes('stream') || m.includes('800') || m.includes('mp3') || m.includes('live') || m.includes('radio') || m.includes('audio') || m.includes('m3u8') || m.includes('zeno'));
  console.log('Davet audio matches:', Array.from(new Set(audioMatches)));
})();
