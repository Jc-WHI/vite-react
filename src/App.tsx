import { useState } from 'react'

import './App.css'

function App() {
  const [serverId, setServerId] = useState('cain')
  const [characterName, setCharacterName] = useState('')
  const [characters, setCharacters] = useState([])
  // 환경 변수에서 API 키를 읽어옴
  const apiKey = import.meta.env.VITE_API_KEY

  const handleSearch = async () => {
    if (!characterName || !apiKey) return
    const url = `https://api.neople.co.kr/df/servers/${serverId}/characters?characterName=${encodeURIComponent(characterName)}&limit=10&apikey=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()
    setCharacters(data.rows || [])
  }

  return (
    <>
      <h1>nulldev kr</h1>
      <div>
        <select value={serverId} onChange={e => setServerId(e.target.value)}>
          <option value="cain">카인</option>
          <option value="diregie">디레지에</option>
          <option value="siroco">시로코</option>
          <option value="prey">프레이</option>
          <option value="casillas">카시야스</option>
          <option value="hilder">힐더</option>
          <option value="anton">안톤</option>
          <option value="bakal">바칼</option>
        </select>
        <input
          placeholder="캐릭터명"
          value={characterName}
          onChange={e => setCharacterName(e.target.value)}
        />
        <button onClick={handleSearch}>검색</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '24px' }}>
        {characters.map((char: any) => (
          <div key={char.characterId} style={{ textAlign: 'center' }}>
            <img
              src={`https://img-api.neople.co.kr/df/servers/${serverId}/characters/${char.characterId}?zoom=1`}
              alt={char.characterName}
              style={{ width: 100, display: 'block', margin: '0 auto' }}
            />
            <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
              {char.characterName} ({char.level}Lv)
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default App
