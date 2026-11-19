import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import VideoChooser from './pages/VideoChooser';
import Preview from './pages/Preview';
import Jobs from './pages/Jobs';
import JobResults from './pages/JobResults';
import './App.css';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/videos" replace />} />
        <Route path="/videos" element={<VideoChooser />} />
        <Route path="/preview/:filename" element={<Preview />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:jobId" element={<JobResults />} />
        <Route
          path="*"
          element={
            <main className="page">
              <h1>Page not found</h1>
            </main>
          }
        />
      </Routes>
    </>
  );
}

export default App;
