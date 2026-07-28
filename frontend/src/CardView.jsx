import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import './CardView.css'

export default function CardView() {
  const { id } = useParams()
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [activeMenu, setActiveMenu] = useState(null)
  const exportCardRef = useRef(null)

  useEffect(() => {
    fetch(`https://eco-file-app.onrender.com/api/cards/${id}/`)
      .then(res => {
        if (!res.ok) throw new Error('名刺データが見つかりませんでした')
        return res.json()
      })
      .then(data => { setCardData(data); setLoading(false) })
      .catch(err => { setError(String(err.message)); setLoading(false) })
  }, [id])

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>読み込み中...</div>
  if (error) return <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>エラー: {error}</div>
  if (!cardData) return null

  const { employee } = cardData
  const { company } = employee

  const closeMenu = () => setActiveMenu(null)

  // 💡 LINEに直接送信する関数（ワンタップ保存！）
  const handleSaveToLine = () => {
    const text = `📇 名刺を交換しました\n\n${company.name}\n${employee.department} ${employee.role}\n${employee.name}\n\n▼名刺データを開く\n${window.location.href}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank', 'noopener,noreferrer');
  }

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

  // 3. Excel保存
  const handleDownloadExcel = () => {
    closeMenu()
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
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "名刺データ")
    XLSX.writeFile(workbook, `${employee.name}_名刺データ.xlsx`)
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
          {/* 💡 変更：LINEカラーのワンタップボタンに変更 */}
          <button 
            className="action-btn" 
            style={{ backgroundColor: '#06C755', boxShadow: '0 4px 6px rgba(6, 199, 85, 0.3)' }}
            onClick={handleSaveToLine}
          >
            <span style={{ marginRight: '5px' }}>💬</span> LINEに保存
          </button>
          
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

    </div>
  )
}