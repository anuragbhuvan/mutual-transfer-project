import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './components/Auth';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App; 