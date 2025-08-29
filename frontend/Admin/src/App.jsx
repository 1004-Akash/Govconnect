import React from 'react';
import 'leaflet/dist/leaflet.css';

import "./App.css";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './routes/Navbar';
import Home from './routes/Home';
import Chatbot from './routes/Chatbot';
import Map from './routes/Map';
import Sentiment from './routes/Sentiment';

function App() {
  return(
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/map" element={<Map />} />
        <Route path="/sentiment" element={<Sentiment />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App;