import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import About from './routes/About';
import Chatbot from './routes/Chatbot';
import Navbar from './routes/Navbar.jsx';
import News from './routes/News';
import Form from './routes/Form';
import CivicPulse from './routes/CivicPulse';
function App() {
    return(
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/news" element={<News />} />
          <Route path="/form" element={<Form />} />
          <Route path="/civicpulse" element={<CivicPulse />} />
        </Routes>
      </BrowserRouter>
    )
}
export default App;