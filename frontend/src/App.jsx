import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CardView from './CardView'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/card/:id" element={<CardView />} />
      </Routes>
    </Router>
  )
}

export default App