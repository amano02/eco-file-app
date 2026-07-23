import { useEffect, useState, useRef } from 'react'
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

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/cards/${id}/`)
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
          <button className="action-btn" onClick={() => setActiveMenu('save')}>保存する</button>
          <button className="action-btn" onClick={() => setActiveMenu('share')}>共有する</button>
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
        {activeMenu === 'save' && (
          <>
            <p className="drawer-title">名刺を保存</p>
            <button className="drawer-menu-btn" onClick={handleDownloadVCard}>
              <span>👤</span> 連絡先に追加 (vcf)
            </button>
            {/* 💡 alertを消して handleDownloadExcel 関数を割り当て */}
            <button className="drawer-menu-btn" onClick={handleDownloadExcel}>
              <span>📊</span> 名刺アプリ用 (xlsx)
            </button>
            <button className="drawer-menu-btn" onClick={handleSaveImage}>
              <span>🖼️</span> 画像として保存 (png)
            </button>
          </>
        )}
        {activeMenu === 'share' && (
          <>
            <p className="drawer-title">名刺を共有</p>
            <button className="drawer-menu-btn" onClick={handleCopyURL}>
              <span>🔗</span> URLをコピー
            </button>
            <button className="drawer-menu-btn" onClick={() => { alert('QRコード表示機能は次回実装します！'); closeMenu(); }}>
              <span>📱</span> QRコードを表示
            </button>
          </>
        )}
        <button className="drawer-menu-btn cancel" onClick={closeMenu}>キャンセル</button>
      </div>

    </div>
  )
}