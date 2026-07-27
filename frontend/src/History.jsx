import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Link } from 'react-router-dom';
import './History.css';

export default function History() {
  // 🔽 Dexieから保存された名刺データを取得（新しい順に並び替え）
  const savedCards = useLiveQuery(
    () => db.cards.orderBy('savedAt').reverse().toArray()
  );

  return (
    <div className="history-page-container">
      <div className="history-header">
        <h1>📇 わたしの名刺入れ</h1>
      </div>

      <div className="history-list">
        {/* データ取得中の表示 */}
        {!savedCards && <p style={{textAlign: 'center'}}>読み込み中...</p>}
        
        {/* 保存された名刺が0件の時の表示 */}
        {savedCards && savedCards.length === 0 && (
          <div className="empty-state">
            <p>まだ保存された名刺がありません。</p>
          </div>
        )}

        {/* 保存された名刺がある場合、リストとして表示 */}
        {savedCards && savedCards.map(card => (
          <Link to={`/card/${card.uuid}`} key={card.uuid} className="history-card-item">
            <div className="history-card-company">{card.company}</div>
            <div className="history-card-name">{card.name}</div>
            <div className="history-card-date">
              保存日: {new Date(card.savedAt).toLocaleDateString('ja-JP')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}