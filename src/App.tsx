import { useState } from 'react'
import './App.css'

interface TimelineItem {
  code: string;
  data: {
    itemName?: string;
    itemId?: string;
    itemGrade?: string;
    channelName?: string;
    channelNo?: number;
    dungeonName?: string;
    mistGear?: boolean;
    regionName?: string;
    guildName?: string;
    modeName?: string;
    hard?: boolean;
    raidName?: string;
    raidPartyName?: string;
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
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
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
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0]
      }

      const url = `/api/proxy?path=servers/${serverId}/characters/${characterId}/timeline&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&limit=10`
      
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      console.log('타임라인 원본 데이터:', data)

      // API 응답 구조에 맞게 데이터 처리
      if (!data.timeline || !Array.isArray(data.timeline.rows)) {
        throw new Error('타임라인 데이터가 올바르지 않습니다.')
      }

      // 타임라인 데이터 정제
      const processedTimeline = data.timeline.rows
        .map((item: TimelineItem) => {
          // 아이템 획득 이벤트 (505) 처리
          if (item.code === '505' && item.data.itemName) {
            return {
              ...item,
              code: '203', // 아이템 획득 코드로 변경
              data: {
                itemName: item.data.itemName,
                itemId: item.data.itemId,
                itemGrade: item.data.itemRarity,
                channelName: item.data.channelName,
                channelNo: item.data.channelNo,
                dungeonName: item.data.dungeonName,
                mistGear: item.data.mistGear
              }
            }
          }
          // 에픽 던전 클리어 이벤트 (209) 처리
          if (item.code === '209' && item.data.regionName) {
            return {
              ...item,
              code: '202', // 던전 클리어 코드로 변경
              data: {
                ...item.data,
                dungeonName: `${item.data.regionName} 에픽 던전`
              }
            }
          }
          // 길드 관련 이벤트 처리
          if (['405', '507'].includes(item.code)) {
            return {
              ...item,
              data: {
                ...item.data,
                guildName: item.data.guildName || '길드'
              }
            }
          }
          // 레이드 클리어 이벤트 (201) 처리
          if (item.code === '201') {
            return {
              ...item,
              data: {
                ...item.data,
                raidMode: item.data.modeName,
                raidDifficulty: item.data.hard ? '하드' : '일반'
              }
            }
          }
          return item
        })
        .filter((item: TimelineItem | null): item is TimelineItem => item !== null)

      console.log('처리된 타임라인 데이터:', processedTimeline)
      setTimeline(processedTimeline)
      
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
        flexWrap: 'wrap',
        minHeight: 'calc(100vh - 200px)'
      }}>
        <div style={{ 
          flex: '1 1 300px',
          minWidth: '300px',
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto'
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
            flex: '2 1 600px',
            minWidth: '600px',
            padding: '25px',
            border: '1px solid #ddd',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 200px)',
            overflow: 'hidden'
          }}>
            <h2 style={{ 
              marginBottom: '20px',
              color: '#333',
              fontSize: '1.5em',
              borderBottom: '2px solid #646cff',
              paddingBottom: '10px',
              flexShrink: 0
            }}>
              {selectedCharacter.characterName}의 타임라인
            </h2>
            {isLoading ? (
              <div style={{ 
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                flexShrink: 0
              }}>
                타임라인 로딩 중...
              </div>
            ) : error ? (
              <div style={{ 
                textAlign: 'center',
                padding: '40px',
                color: '#dc3545',
                flexShrink: 0
              }}>
                {error}
              </div>
            ) : timeline.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px',
                overflowY: 'auto',
                paddingRight: '10px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#888 #f1f1f1',
                flex: 1
              }}>
                {timeline.map((item, index) => {
                  console.log('렌더링할 타임라인 항목:', item)

                  const date = new Date(item.date)
                  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                  const formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
                  
                  let content = ''
                  let style: ItemStyle | undefined = undefined
                  let itemImage: string | null = null
                  
                  switch (item.code) {
                    case '101':
                      content = `모험단명 변경: ${item.data.adventureName || ''}`
                      style = EVENT_STYLES.level
                      break
                    case '102':
                      content = `길드명 변경: ${item.data.guildName || ''}`
                      style = EVENT_STYLES.level
                      break
                    case '103':
                      content = `전직: ${item.data.jobGrowName || ''}`
                      style = EVENT_STYLES.jobGrow
                      break
                    case '104':
                      content = `레벨 달성: ${item.data.level || ''}`
                      style = EVENT_STYLES.level
                      break
                    case '201':
                      content = `${item.data.raidName || ''} ${item.data.raidMode || ''} ${item.data.raidDifficulty || ''} 클리어`
                      if (item.data.raidPartyName) {
                        content += ` (${item.data.raidPartyName})`
                      }
                      style = EVENT_STYLES.raid
                      break
                    case '202':
                      content = `${item.data.dungeonName || ''} 클리어`
                      style = EVENT_STYLES.region
                      break
                    case '203':
                      content = `${item.data.itemName || '아이템 획득'}`
                      if (item.data.itemGrade) {
                        const grade = item.data.itemGrade
                        if (grade in ITEM_GRADES) {
                          style = ITEM_GRADES[grade]
                        }
                      }
                      if (item.data.itemId) {
                        itemImage = `https://img-api.neople.co.kr/df/items/${item.data.itemId}`
                      }
                      break
                    case '204':
                      content = `${item.data.channelName || ''} ${item.data.channelNo ? `- ${item.data.channelNo}채널` : ''}`
                      style = EVENT_STYLES.level
                      break
                    case '405':
                      content = `${item.data.guildName || '길드'} 가입`
                      style = EVENT_STYLES.level
                      break
                    case '507':
                      content = `${item.data.guildName || '길드'} 추방`
                      style = EVENT_STYLES.level
                      break
                    default:
                      console.log('알 수 없는 타임라인 코드:', item.code, item.data)
                      content = `이벤트 코드 ${item.code}`
                      style = EVENT_STYLES.level
                  }

                  if (!content) {
                    console.log('내용이 없는 타임라인 항목:', item)
                    return null
                  }

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
                      alignItems: 'flex-start',
                      gap: '16px',
                      marginBottom: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: '80px'
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
                        borderRight: '1px solid #eee',
                        flexShrink: 0
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
                        alignItems: 'flex-start',
                        gap: '16px',
                        flex: 1,
                        minWidth: 0
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
                          flex: 1,
                          minWidth: 0,
                          wordBreak: 'break-word'
                        }}>
                          {content}
                          {item.data.channelName && item.code !== '204' && (
                            <div style={{
                              fontSize: '0.9em',
                              color: style?.color ? `${style.color}99` : '#999',
                              marginTop: '4px'
                            }}>
                              {item.data.channelName} {item.data.channelNo ? `- ${item.data.channelNo}채널` : ''}
                            </div>
                          )}
                          {item.data.dungeonName && item.code !== '202' && (
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
