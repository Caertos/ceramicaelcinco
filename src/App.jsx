import { Routes, Route } from 'react-router-dom';

import Home from './pages/home/Home';
import About from './pages/about/About';
import Products from './pages/products/Products';
import ProductionProcess from './pages/productionProcess/productionProcess';
import Contact from './pages/contact/Contact';

import './App.css'

function App() {
  return (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/About" element={<About />} />
          <Route path="/Products" element={<Products />} />
          <Route path="/Process" element={<ProductionProcess />} />
          <Route path="/Gallery" element={<h1>Galería</h1>} />
          <Route path="/Contact" element={<Contact />} />
        </Routes>
  );
}

export default App
