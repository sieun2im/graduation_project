import React, { useState, useEffect } from 'react';
import Main from './components/main';
import Toping from './components/toping';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Onboarding from './components/menuT';

function App() {
  const [cart, setCart] = useState([]);

  // 장바구니에 항목 추가 함수
  const handleAddToCart = (item) => {
    setCart(oldCart => {
      const existsIndex = oldCart.findIndex(c => c.name === item.name && JSON.stringify(c.options) === JSON.stringify(item.options));
      if (existsIndex !== -1) {
        const newCart = [...oldCart];
        newCart[existsIndex].count += item.count;
        return newCart;
      }
      return [...oldCart, item];
    });
  };

  useEffect(() => {
    function openFullscreen() {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }
    document.documentElement.addEventListener('click', openFullscreen);
    return () => {
      document.documentElement.removeEventListener('click', openFullscreen);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding/>}/>
        <Route path="/main" element={<Main cart={cart} setCart={setCart} />} />
        <Route path="/toping" element={<Toping handleAddToCart={handleAddToCart} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
