import { useState } from 'react'
import './App.css'

interface Timeline {
  code: string;
  data: any; // 실제 데이터 구조에 맞게 타입 정의 필요
  date: string;
}

interface Character {
  characterId: string;
  characterName: string;
  level: number;
}

function App() {
  const [serverId, setServerId] = useState('cain')
  const [characterName, setCharacterName] = useState('')
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [timeline, setTimeline] = useState<Timeline[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!characterName) return
    setIsLoading(true)
    setError(null)
    try {
      const url = `/api/df?serverId=${serverId}&characterName=${encodeURIComponent(characterName)}`;
      const res = await fetch(url)
      const data = await res.json()
      setCharacters(data.rows || [])
    } catch (err) {
      setError('캐릭터 검색 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTimeline = async (characterId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // 현재 날짜와 30일 전 날짜 계산
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      // 날짜 포맷팅 (YYYYMMDDTHHmm 형식)
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0]
      }

      // API 키 확인
      const apiKey = import.meta.env.VITE_NEOPLE_API_KEY
      if (!apiKey) {
        console.error('API 키가 설정되지 않았습니다. 환경변수를 확인해주세요.')
        throw new Error('API 키가 설정되지 않았습니다. 환경변수를 확인해주세요.')
      }

      // API 요청 URL 구성
      const baseUrl = import.meta.env.PROD 
        ? 'https://api.neople.co.kr/df'  // 프로덕션 환경
        : '/api'                         // 개발 환경 (Vite 프록시 사용)

      const url = `${baseUrl}/servers/${serverId}/characters/${characterId}/timeline?apikey=${apiKey}&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&limit=10`
      
      console.log('API 요청 URL:', url) // 디버깅용 (개발 환경에서만 사용)
      
      const res = await fetch(url)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('API 응답 에러:', {
          status: res.status,
          statusText: res.statusText,
          data: errorData
        })
        throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      if (data.error) {
        console.error('API 데이터 에러:', data.error)
        throw new Error(data.error.message || '타임라인 데이터를 가져오는데 실패했습니다.')
      }
      
      setTimeline(data.rows || [])
    } catch (err) {
      console.error('타임라인 에러:', err)
      setError(err instanceof Error ? err.message : '타임라인 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character)
    fetchTimeline(character.characterId)
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
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? '검색 중...' : '검색'}
        </button>
      </div>

      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1 }}>
          {characters.map((char) => (
            <div 
              key={char.characterId} 
              style={{ 
                textAlign: 'center',
                cursor: 'pointer',
                padding: '10px',
                border: selectedCharacter?.characterId === char.characterId ? '2px solid #646cff' : '1px solid #ccc',
                borderRadius: '8px',
                marginBottom: '10px'
              }}
              onClick={() => handleCharacterClick(char)}
            >
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

        {selectedCharacter && (
          <div style={{ flex: 1, padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>{selectedCharacter.characterName}의 타임라인</h2>
            {isLoading ? (
              <div>타임라인 로딩 중...</div>
            ) : timeline.length > 0 ? (
              <div>
                {timeline.map((item, index) => (
                  <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee' }}>
                    <div>날짜: {new Date(item.date).toLocaleString()}</div>
                    <div>코드: {item.code}</div>
                    <div>데이터: {JSON.stringify(item.data)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>타임라인 정보가 없습니다.</div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default App
