import { VercelRequest, VercelResponse } from '@vercel/node'

const API_KEY = 'o3VgpfcYb4BEcTQj4zhqweX8NCUGntYn'
const API_BASE_URL = 'https://api.neople.co.kr/df'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { path, ...query } = req.query
    const apiPath = Array.isArray(path) ? path.join('/') : path || ''
    const queryString = new URLSearchParams({
      ...query as Record<string, string>,
      apikey: API_KEY
    }).toString()

    const url = `${API_BASE_URL}/${apiPath}?${queryString}`
    console.log('프록시 요청:', url)

    const response = await fetch(url)
    const data = await response.json()

    res.status(response.status).json(data)
  } catch (error) {
    console.error('프록시 에러:', error)
    res.status(500).json({ error: '프록시 서버 에러' })
  }
} 