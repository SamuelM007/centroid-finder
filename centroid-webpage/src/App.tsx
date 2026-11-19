import { Routes, Route, Navigate } from 'react-router-dom';
import Video from './pages/Video';
import './App.css';
import Home from './pages/Home';

function App() {


  return (
    <>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/video/:fileName" element={<Video />} />
      </Routes>
    </>
  )
}

export default App
