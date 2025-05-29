import { useState } from 'react'
import './App.css'

interface Timeline {
  code: string;
  data: {
    adventureName?: string;
    guildName?: string;
    jobGrowName?: string;
    level?: number;
    raidName?: string;
    raidMode?: string;
    raidDifficulty?: string;
    dungeonName?: string;
    itemName?: string;
    itemGrade?: string;
    channelName?: string;
    [key: string]: any;
  };
  date: string;
}

interface Character {
  characterId: string;
  characterName: string;
  level: number;
}

// 아이템 등급별 스타일 정의
const ITEM_GRADES = {
  '레전더리': {
    backgroundColor: '#ffa500',
    color: '#fff',
    borderColor: '#ff8c00'
  },
  '에픽': {
    backgroundColor: '#ff8c00',
    color: '#fff',
    borderColor: '#ff6b00'
  }
} as const

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
      const url = `/api/servers/${serverId}/characters?characterName=${encodeURIComponent(characterName)}`;
      const res = await fetch(url)
      const data = await res.json()
      setCharacters(data.rows || [])
    } catch (err) {
      console.error('캐릭터 검색 에러:', err)
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

      const url = `/api/servers/${serverId}/characters/${characterId}/timeline?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&limit=10`
      
      console.log('타임라인 API 요청:', {
        url,
        serverId,
        characterId,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      })
      
      const res = await fetch(url)
      console.log('API 응답 상태:', res.status, res.statusText)
      
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
      console.log('타임라인 데이터:', data)
      
      if (data.error) {
        console.error('API 데이터 에러:', data.error)
        throw new Error(data.error.message || '타임라인 데이터를 가져오는데 실패했습니다.')
      }

      // 타임라인 데이터가 timeline.rows에 있는 경우
      if (data.timeline?.rows) {
        setTimeline(data.timeline.rows)
        return
      }
      
      // 타임라인 데이터가 rows 필드에 있는 경우
      if (data.rows) {
        setTimeline(data.rows)
        return
      }

      // 타임라인 데이터가 없는 경우
      console.log('타임라인 데이터 없음:', data)
      setTimeline([])
      
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
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: '#333',
        fontSize: '2.5em'
      }}>
        던전앤파이터 캐릭터 타임라인
      </h1>

      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <select 
          value={serverId} 
          onChange={e => setServerId(e.target.value)}
          style={{
            padding: '10px 15px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '1em',
            minWidth: '120px'
          }}
        >
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
          style={{
            padding: '10px 15px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '1em',
            minWidth: '200px'
          }}
        />
        <button 
          onClick={handleSearch} 
          disabled={isLoading}
          style={{
            padding: '10px 25px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#646cff',
            color: 'white',
            fontSize: '1em',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          {isLoading ? '검색 중...' : '검색'}
        </button>
      </div>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          margin: '20px 0', 
          padding: '15px',
          backgroundColor: '#f8d7da',
          borderRadius: '8px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        gap: '30px', 
        marginTop: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          flex: '1 1 300px',
          minWidth: '300px'
        }}>
          {characters.map((char) => (
            <div 
              key={char.characterId} 
              style={{ 
                textAlign: 'center',
                cursor: 'pointer',
                padding: '20px',
                border: selectedCharacter?.characterId === char.characterId 
                  ? '2px solid #646cff' 
                  : '1px solid #ddd',
                borderRadius: '12px',
                marginBottom: '15px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
              onClick={() => handleCharacterClick(char)}
            >
              <img
                src={`https://img-api.neople.co.kr/df/servers/${serverId}/characters/${char.characterId}?zoom=1`}
                alt={char.characterName}
                style={{ 
                  width: 120, 
                  display: 'block', 
                  margin: '0 auto',
                  borderRadius: '8px'
                }}
              />
              <div style={{ 
                marginTop: '12px', 
                fontWeight: '600',
                fontSize: '1.1em',
                color: '#333'
              }}>
                {char.characterName}
              </div>
              <div style={{ 
                color: '#666',
                fontSize: '0.9em'
              }}>
                Lv.{char.level}
              </div>
            </div>
          ))}
        </div>

        {selectedCharacter && (
          <div style={{ 
            flex: '2 1 500px',
            minWidth: '500px',
            padding: '25px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              marginBottom: '20px',
              color: '#333',
              fontSize: '1.5em',
              borderBottom: '2px solid #646cff',
              paddingBottom: '10px'
            }}>
              {selectedCharacter.characterName}의 타임라인
            </h2>
            {isLoading ? (
              <div style={{ 
                textAlign: 'center',
                padding: '40px',
                color: '#666'
              }}>
                타임라인 로딩 중...
              </div>
            ) : timeline.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px'
              }}>
                {timeline.map((item, index) => {
                  const date = new Date(item.date)
                  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
                  
                  let content = ''
                  let style = {}
                  
                  switch (item.code) {
                    case 'adventureName':
                      content = `모험단명 변경: ${item.data.adventureName}`
                      break
                    case 'guildName':
                      content = `길드명 변경: ${item.data.guildName}`
                      break
                    case 'jobGrowName':
                      content = `전직: ${item.data.jobGrowName}`
                      break
                    case 'level':
                      content = `레벨 달성: ${item.data.level}`
                      break
                    case 'raid':
                      content = `${item.data.raidName} ${item.data.raidMode} ${item.data.raidDifficulty}`
                      break
                    case 'dungeon':
                      content = `${item.data.dungeonName} 클리어`
                      break
                    case 'item':
                      content = `${item.data.itemName} (${item.data.itemGrade}) 획득 - ${item.data.channelName}`
                      style = ITEM_GRADES[item.data.itemGrade as keyof typeof ITEM_GRADES] || {}
                      break
                    default:
                      content = JSON.stringify(item.data, null, 2)
                  }

                  return (
                    <div key={index} style={{ 
                      padding: '15px', 
                      border: '1px solid #eee',
                      borderRadius: '8px',
                      backgroundColor: style.backgroundColor || '#f8f9fa',
                      color: style.color || '#333',
                      borderColor: style.borderColor || '#eee',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ 
                        fontSize: '0.9em', 
                        color: style.color ? 'rgba(255,255,255,0.8)' : '#666',
                        marginBottom: '5px'
                      }}>
                        {formattedDate}
                      </div>
                      <div style={{ 
                        fontSize: '1.1em',
                        fontWeight: '500'
                      }}>
                        {content}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center',
                padding: '40px',
                color: '#666'
              }}>
                <p style={{ fontSize: '1.1em', marginBottom: '10px' }}>
                  타임라인 정보가 없습니다.
                </p>
                <p style={{ fontSize: '0.9em', color: '#888' }}>
                  (최근 30일 동안의 타임라인 데이터가 없거나,<br />
                  해당 캐릭터의 타임라인이 비공개 상태일 수 있습니다.)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
