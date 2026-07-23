import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function CardView() {
  const { id } = useParams()
  
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/cards/${id}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('名刺データが見つかりませんでした')
        }
        return response.json()
      })
      .then((data) => {
        setCardData(data)
        setLoading(false)
      })
      .catch((err) => {
        // エラーメッセージも確実に文字列化します
        setError(String(err.message))
        setLoading(false)
      })
  }, [id])

  if (loading) return <div>読み込み中...</div>
  if (error) return <div>エラー: {error}</div>
  if (!cardData) return null

  // Reactがエラーを起こさないよう、データを丸ごと文字列にして表示します
  return (
    <div style={{ padding: '20px' }}>
      <h3>データの通信テスト</h3>
      <pre style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
        {JSON.stringify(cardData, null, 2)}
      </pre>
    </div>
  )
}