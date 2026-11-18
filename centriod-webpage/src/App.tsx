import { Routes, Route, Navigate } from 'react-router-dom';
import Video from './pages/Video';

function App() {


  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/videos" />} />
        <Route path="/videos" element={<Video />} />
        <Route path="/preview/:filename" element={<div>Preview</div>} />
      </Routes>
    </>
  )
}

export default App
