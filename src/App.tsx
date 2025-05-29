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
    itemId?: string;
    itemRarity?: string;
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
interface ItemStyle {
  backgroundColor: string;
  color: string;
  borderColor: string;
}

const ITEM_GRADES: Record<string, ItemStyle> = {
  '레전더리': {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    color: '#ff8c00',
    borderColor: '#ff8c00'
  },
  '에픽': {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    color: '#ff6b00',
    borderColor: '#ff6b00'
  },
  '유니크': {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    color: '#ff4500',
    borderColor: '#ff4500'
  }
}

// 타임라인 이벤트 타입별 스타일 정의
const EVENT_STYLES: Record<string, ItemStyle> = {
  'raid': {
    backgroundColor: 'rgba(100, 108, 255, 0.1)',
    color: '#646cff',
    borderColor: '#646cff'
  },
  'region': {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4caf50',
    borderColor: '#4caf50'
  },
  'level': {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    color: '#2196f3',
    borderColor: '#2196f3'
  },
  'jobGrow': {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    color: '#9c27b0',
    borderColor: '#9c27b0'
  }
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
      const url = `/api/proxy?path=servers/${serverId}/characters&characterName=${encodeURIComponent(characterName)}`
      console.log('캐릭터 검색 요청:', url)
      
      const res = await fetch(url)
      console.log('캐릭터 검색 응답:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('API 응답 에러:', {
          status: res.status,
          statusText: res.statusText,
          body: errorText
        })
        throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`)
      }

      const contentType = res.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await res.text()
        console.error('잘못된 응답 형식:', {
          contentType,
          body: text.substring(0, 200) // 처음 200자만 로깅
        })
        throw new Error('서버가 JSON 응답을 반환하지 않았습니다.')
      }

      const data = await res.json()
      console.log('캐릭터 검색 결과:', data)
      
      if (data.error) {
        throw new Error(data.error.message || '캐릭터 검색 중 오류가 발생했습니다.')
      }

      setCharacters(data.rows || [])
    } catch (err) {
      console.error('캐릭터 검색 에러:', err)
      setError(err instanceof Error ? err.message : '캐릭터 검색 중 오류가 발생했습니다.')
      setCharacters([])
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

      const url = `/api/proxy?path=servers/${serverId}/characters/${characterId}/timeline&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&limit=10`
      console.log('타임라인 API 요청:', {
        url,
        serverId,
        characterId,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      })
      
      const res = await fetch(url)
      console.log('타임라인 API 응답:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries())
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API 응답 에러:', {
          status: res.status,
          statusText: res.statusText,
          body: errorText
        })
        throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      console.log('타임라인 데이터:', data)
      
      if (data.error) {
        console.error('API 데이터 에러:', data.error)
        throw new Error(data.error.message || '타임라인 데이터를 가져오는데 실패했습니다.')
      }

      // 타임라인 데이터 처리
      let timelineData: Timeline[] = []
      
      if (data.timeline?.rows) {
        timelineData = data.timeline.rows
      } else if (data.rows) {
        timelineData = data.rows
      } else if (Array.isArray(data)) {
        timelineData = data
      }

      console.log('처리된 타임라인 데이터:', timelineData)
      setTimeline(timelineData)
      
    } catch (err) {
      console.error('타임라인 에러:', err)
      setError(err instanceof Error ? err.message : '타임라인 정보를 불러오는 중 오류가 발생했습니다.')
      setTimeline([])
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
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
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
            ) : error ? (
              <div style={{ 
                textAlign: 'center',
                padding: '40px',
                color: '#dc3545'
              }}>
                {error}
              </div>
            ) : timeline.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px'
              }}>
                {timeline.map((item, index) => {
                  const date = new Date(item.date)
                  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                  const formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
                  
                  let content = ''
                  let style: ItemStyle | undefined = undefined
                  let itemImage: string | null = null
                  
                  switch (item.code) {
                    case 'adventureName':
                      content = `모험단명 변경: ${item.data.adventureName}`
                      style = EVENT_STYLES.level
                      break
                    case 'guildName':
                      content = `길드명 변경: ${item.data.guildName}`
                      style = EVENT_STYLES.level
                      break
                    case 'jobGrowName':
                      content = `전직: ${item.data.jobGrowName}`
                      style = EVENT_STYLES.jobGrow
                      break
                    case 'level':
                      content = `레벨 달성: ${item.data.level}`
                      style = EVENT_STYLES.level
                      break
                    case 'raid':
                      content = `${item.data.raidName} ${item.data.raidMode} ${item.data.raidDifficulty || ''}`
                      style = EVENT_STYLES.raid
                      break
                    case 'region':
                      content = `${item.data.regionName || item.data.dungeonName || ''} 클리어`
                      style = EVENT_STYLES.region
                      break
                    case 'item':
                      content = `${item.data.itemName || '아이템 획득'}`
                      if (item.data.itemGrade || item.data.itemRarity) {
                        const grade = item.data.itemGrade || item.data.itemRarity
                        if (grade && grade in ITEM_GRADES) {
                          style = ITEM_GRADES[grade]
                        }
                      }
                      if (item.data.itemId) {
                        itemImage = `https://img-api.neople.co.kr/df/items/${item.data.itemId}`
                      }
                      break
                    case 'channel':
                      content = `${item.data.channelName || ''} ${item.data.channelNo ? `- ${item.data.channelNo}채널` : ''}`
                      style = EVENT_STYLES.level
                      break
                    default:
                      // 알 수 없는 이벤트 타입은 건너뛰기
                      return null
                  }

                  // content가 비어있으면 렌더링하지 않음
                  if (!content) return null

                  return (
                    <div key={index} style={{ 
                      padding: '16px',
                      border: '1px solid #eee',
                      borderRadius: '12px',
                      backgroundColor: style?.backgroundColor || '#f8f9fa',
                      color: style?.color || '#333',
                      borderColor: style?.borderColor || '#eee',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: style?.borderColor || '#eee'
                      }} />
                      
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        minWidth: '120px',
                        paddingRight: '16px',
                        borderRight: '1px solid #eee'
                      }}>
                        <div style={{ 
                          fontSize: '0.9em',
                          color: style?.color ? style.color : '#666',
                          fontWeight: '500'
                        }}>
                          {formattedDate}
                        </div>
                        <div style={{ 
                          fontSize: '0.8em',
                          color: style?.color ? `${style.color}99` : '#999',
                          marginTop: '4px'
                        }}>
                          {formattedTime}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flex: 1
                      }}>
                        {itemImage && (
                          <div style={{
                            position: 'relative',
                            width: '48px',
                            height: '48px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <img 
                              src={itemImage} 
                              alt={item.data.itemName || '아이템 이미지'} 
                              style={{ 
                                width: '100%',
                                height: '100%',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                background: '#fff',
                                objectFit: 'contain',
                                padding: '4px'
                              }} 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        
                        <div style={{ 
                          fontSize: '1.1em',
                          fontWeight: '500',
                          flex: 1
                        }}>
                          {content}
                          {item.data.channelName && item.code !== 'channel' && (
                            <div style={{
                              fontSize: '0.9em',
                              color: style?.color ? `${style.color}99` : '#999',
                              marginTop: '4px'
                            }}>
                              {item.data.channelName} {item.data.channelNo ? `- ${item.data.channelNo}채널` : ''}
                            </div>
                          )}
                          {item.data.dungeonName && item.code !== 'region' && (
                            <div style={{
                              fontSize: '0.9em',
                              color: style?.color ? `${style.color}99` : '#999',
                              marginTop: '4px'
                            }}>
                              {item.data.dungeonName}
                            </div>
                          )}
                        </div>
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
