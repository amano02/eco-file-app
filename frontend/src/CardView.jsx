import { useEffect, useState, useRef } from 'react'
import { db } from './db'; 
import { useParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx' // 👈 インストールしたExcelライブラリを読み込む
import './CardView.css'

export default function CardView() {
  const { id } = useParams()
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [activeMenu, setActiveMenu] = useState(null)
  const exportCardRef = useRef(null)
  const [showSaveModal, setShowSaveModal] = useState(false)

  useEffect(() => {
    fetch(`https://eco-file-app.onrender.com/api/cards/${id}/`)
      .then(res => {
        if (!res.ok) throw new Error('名刺データが見つかりませんでした')
        return res.json()
      })
      .then(data => { setCardData(data); setLoading(false) })
      .catch(err => { setError(String(err.message)); setLoading(false) })
  }, [id])

  // 🔽 名刺をIndexedDBに保存する関数（修正版）
  const handleSaveCard = async () => {
    if (!cardData) return;

    // データ構造に合わせて、employee と company を取り出す
    const { employee } = cardData;
    const { company } = employee;

    try {
      // db.cards.put() は、同じuuidがあれば上書き、なければ新規追加してくれます
      await db.cards.put({
        uuid: id,                     // 👈 useParams()で取得したURLのUUIDを使用
        name: employee.name,          // 👈 employeeの中の名前を使用
        company: company.name,        // 👈 companyの中の会社名を使用
        savedAt: new Date().toISOString() 
      });
      
      console.log("ブラウザ（IndexedDB）への保存が完了しました！");
      
      // 保存成功時にモーダルを開く
      setShowSaveModal(true);
      
    } catch (error) {
      console.error("名刺の保存に失敗しました:", error);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>読み込み中...</div>
  if (error) return <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>エラー: {error}</div>
  if (!cardData) return null

  const { employee } = cardData
  const { company } = employee

  const closeMenu = () => setActiveMenu(null)

  // 1. vCard保存
  const handleDownloadVCard = () => {
    const vcardLines = [
      "BEGIN:VCARD", "VERSION:3.0",
      `FN:${employee.name}`, `ORG:${company.name}`,
      `TITLE:${employee.department} ${employee.role}`.trim(),
      employee.phone_number ? `TEL;TYPE=WORK,VOICE:${employee.phone_number}` : "",
      employee.email ? `EMAIL;TYPE=WORK:${employee.email}` : "",
      company.website_url ? `URL:${company.website_url}` : "",
      "END:VCARD"
    ]
    const blob = new Blob([vcardLines.filter(Boolean).join('\n')], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${employee.name}_連絡先.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    closeMenu()
  }

  // 2. 画像保存
  const handleSaveImage = async () => {
    closeMenu()
    if (employee.custom_card_image) {
      const link = document.createElement('a')
      link.href = employee.custom_card_image
      link.download = `${employee.name}_オリジナル名刺.png`
      link.click()
      return
    }
    if (!exportCardRef.current) return
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(exportCardRef.current, { scale: 2 })
        const imageURL = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = imageURL
        link.download = `${employee.name}_自動生成名刺.png`
        link.click()
      } catch (err) { alert("画像の保存に失敗しました。") }
    }, 300)
  }

  // 3. 💡 Excel保存（新規追加）
  const handleDownloadExcel = () => {
    closeMenu()
    
    // Excelの1行目（ヘッダー）と2行目（データ）になるオブジェクトを作成
    const excelData = [{
      "会社名": company.name,
      "部署名": employee.department,
      "役職": employee.role,
      "氏名": employee.name,
      "ふりがな": employee.furigana || "",
      "電話番号": employee.phone_number || "",
      "メールアドレス": employee.email || "",
      "Webサイト": company.website_url || "",
      "事業内容": company.business_description || "",
      "経歴": employee.career_history || ""
    }]

    // データをシートに変換し、ワークブック（Excelファイル本体）を作成
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "名刺データ")

    // ファイルとしてダウンロード
    XLSX.writeFile(workbook, `${employee.name}_名刺データ.xlsx`)
  }

  // 4. URLコピー
  const handleCopyURL = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('URLをコピーしました！'))
      .catch(() => alert('コピーに失敗しました。'))
    closeMenu()
  }

  return (
    <div className="page-container">
      
      {/* 隠しテンプレート */}
      <div ref={exportCardRef} className="hidden-card-export">
        <div className="export-header">
          <div className="export-company">{company.name}</div>
        </div>
        <div className="export-body">
          {employee.furigana && <div className="export-furigana">{employee.furigana}</div>}
          <div className="export-name">{employee.name}</div>
          <div className="export-role">{employee.department} {employee.role}</div>
        </div>
        <div className="export-footer">
          <div>{company.website_url && <div className="export-contact-item">🌐 {company.website_url}</div>}</div>
          <div style={{ textAlign: 'right' }}>
            {employee.phone_number && <div className="export-contact-item">📞 {employee.phone_number}</div>}
            {employee.email && <div className="export-contact-item">✉️ {employee.email}</div>}
          </div>
        </div>
      </div>

      {/* メイン画面 */}
      <div className="card-container">
      <div className="fixed-header">
        {/* 1. ここに「名刺入れに保存（ワンタップ保存）」を配置！ */}
        <button className="action-btn highlight-btn" onClick={handleSaveCard}>
          名刺入れに保存
        </button>
        {/* 2. ここに「名刺データ管理（帰ってからゆっくり）」を配置！ */}
        <button className="action-btn" onClick={() => setActiveMenu('manage')}>
          データ管理
        </button>
      </div>

        <div className="content-area">
          <div className="section">
            <p className="company-name">{company.name}</p>
            <h1 className="employee-name">{employee.name}</h1>
            {employee.furigana && <p style={{ fontSize: '12px', color: '#6b7280' }}>{employee.furigana}</p>}
            <p className="role">{employee.department} {employee.role}</p>
          </div>

          <div className="section">
            <h3>Contact</h3>
            {employee.phone_number && <a href={`tel:${employee.phone_number}`} className="contact-link">📞 {employee.phone_number}</a>}
            {employee.email && <a href={`mailto:${employee.email}`} className="contact-link">✉️ {employee.email}</a>}
            {company.website_url && <a href={company.website_url} target="_blank" rel="noreferrer" className="contact-link">🌐 企業Webサイト</a>}
          </div>

          <div className="section">
            <h3>経歴 / Profile</h3>
            <p className="text-body">{employee.career_history || '経歴情報がまだ登録されていません。'}</p>
          </div>
          <div className="section">
            <h3>事業内容 / Business</h3>
            <p className="text-body">{company.business_description || '事業内容がまだ登録されていません。'}</p>
          </div>
        </div>
      </div>

      <div className={`overlay ${activeMenu ? 'show' : ''}`} onClick={closeMenu}></div>

        {/* ドロワーメニュー */}
        <div className={`bottom-drawer ${activeMenu ? 'show' : ''}`}>
            {activeMenu === 'manage' && (
              <>
                <p className="drawer-title">名刺データ管理</p>
                <button className="drawer-menu-btn" onClick={handleDownloadVCard}>
                  <span>👤</span> 連絡先に追加 (vcf)
                </button>
                <button className="drawer-menu-btn" onClick={handleDownloadExcel}>
                  <span>📊</span> 名刺アプリ用 (xlsx)
                </button>
                <button className="drawer-menu-btn" onClick={handleSaveImage}>
                  <span>🖼️</span> 画像として保存 (png)
                </button>
              </>
            )}
            <button className="drawer-menu-btn cancel" onClick={closeMenu}>キャンセル</button>
          </div>
          {/* 👆 ここでドロワーメニューは完全に閉じる */}


          {/* 🔽 ⭕️ 正解の場所：ドロワーの外、全体を囲む最後の </div> の直前に置く！ */}
          {/* 保存完了モーダル（改・保存法のキモ！） */}
          {showSaveModal && (
            <div className="custom-modal-overlay">
              <div className="custom-modal-content">
                <h2 style={{ color: '#10b981', marginTop: 0 }}>保存完了！</h2>
                <p>名刺がブラウザに一時保存されました。</p>

                {/* 案内A：ホーム画面追加のガイド */}
                <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>📱 アプリとして使うには？</h4>
                  <p style={{ fontSize: '12px', margin: 0 }}>
                    ブラウザのメニューから「ホーム画面に追加」を選ぶと、次回からアイコンをタップするだけで、あなた専用の名刺入れがすぐに開きます。
                  </p>
                </div>

                {/* 案内B：LINE Keepへのバックアップ */}
                <a 
                  href={`https://line.me/R/msg/text/?${encodeURIComponent(`【名刺】${employee.name}さんの名刺\n${window.location.href}`)}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: 'block', background: '#06C755', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', marginBottom: '10px' }}
                >
                  LINEのKeepメモに残す
                </a>

                <button 
                  onClick={() => setShowSaveModal(false)}
                  style={{ width: '100%', padding: '12px', background: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  閉じる
                </button>
              </div>
            </div>
          )}

    </div> /* 👈 これが page-container の最後の閉じタグ */
  )
}