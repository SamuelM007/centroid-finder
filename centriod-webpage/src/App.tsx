import { Routes, Route, Navigate } from 'react-router-dom';
import Video from './pages/Video';
import Home from './pages/Home';

function App() {


  return (
    <>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/videos" element={<Video />} />
        <Route path="/preview/:filename" element={<div>Preview</div>} />
      </Routes>
    </>
  )
}

export default App
