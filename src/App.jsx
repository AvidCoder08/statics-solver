import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Unit1Page from './pages/Unit1Page.jsx'
import Unit2Page from './pages/Unit2Page.jsx'
import Unit3Page from './pages/Unit3Page.jsx'
import Unit4Page from './pages/Unit4Page.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="unit1" element={<Unit1Page />} />
          <Route path="unit2" element={<Unit2Page />} />
          <Route path="unit3" element={<Unit3Page />} />
          <Route path="unit4" element={<Unit4Page />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
