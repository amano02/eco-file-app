import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CardView from './CardView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ここが <CardView /> とタグの形になっているかが最大のポイントです！ */}
        <Route path="/card/:id" element={<CardView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App