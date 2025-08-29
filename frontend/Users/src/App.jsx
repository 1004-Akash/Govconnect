import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import About from './routes/About';
import Chatbot from './routes/Chatbot';
import Navbar from './routes/Navbar.jsx';
import News from './routes/News';
import Form from './routes/Form';
import CivicPulse from './routes/CivicPulse';
import Footer from './components/Footer';

function App() {
    return(
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/news" element={<News />} />
              <Route path="/form" element={<Form />} />
              <Route path="/civicpulse" element={<CivicPulse />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    )
}
export default App;