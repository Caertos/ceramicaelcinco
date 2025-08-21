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
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/process" element={<ProductionProcess />} />
          <Route path="/gallery" element={<h1>Galería</h1>} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
  );
}

export default App
