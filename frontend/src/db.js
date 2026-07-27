import Dexie from 'dexie';

// 'BusinessCardDB' という名前のデータベースをブラウザ内に作成
export const db = new Dexie('BusinessCardDB');

// 'cards' というテーブル（データを入れる箱）を定義
// 最初の 'uuid' が主キー（データを特定するための絶対的なID）になります
db.version(1).stores({
  cards: 'uuid, name, company, savedAt'
});