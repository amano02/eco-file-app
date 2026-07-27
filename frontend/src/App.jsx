import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CardView from './CardView'
import History from './History'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 名刺表示ページ */}
        <Route path="/card/:id" element={<CardView />} />

        {/* 一覧画面 */}
        <Route path="/history" element={<History />} />
      </Routes>

    </BrowserRouter>
  )
}

export default App