import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import About from './routes/About';
import Chatbot from './routes/Chatbot';
import Navbar from './routes/Navbar.jsx';
import News from './routes/News';

function App() {
    return(
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/news" element={<News />} />
        </Routes>
      </BrowserRouter>
    )
}
export default App;