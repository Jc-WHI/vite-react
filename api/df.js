export default async function handler(req, res) {
  const { serverId, characterName } = req.query;
  const apiKey = process.env.VITE_API_KEY; // Vercel 환경 변수 사용

  if (!serverId || !characterName || !apiKey) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const url = `https://api.neople.co.kr/df/servers/${serverId}/characters?characterName=${encodeURIComponent(characterName)}&limit=10&apikey=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  res.status(200).json(data);
}