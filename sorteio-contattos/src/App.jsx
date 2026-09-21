import { Routes, Route } from 'react-router-dom';
import Sorteio from './pages/Sorteio.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Sorteio />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
