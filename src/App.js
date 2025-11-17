import React, { useState, useEffect } from 'react';
import Main from './components/main';
import Toping from './components/toping';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Onboarding from './components/menuT';

function App() {
  const [cart, setCart] = useState([]);
  const [voiceMode, setVoiceMode] = useState(true); // 음성 모드 전역 상태

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

  // ✅ 터치/클릭 감지하여 음성 모드 비활성화
  useEffect(() => {
    const handleUserInteraction = (e) => {
      // 특정 버튼 클릭은 제외
      if (e.target.closest('.voice-activation-btn') || 
          e.target.closest('.arduino-btn') ||
          e.target.closest('.connect-btn') ||
          e.target.closest('.disconnect-btn')) {
        return;
      }
      
      if (voiceMode) {
        console.log('🖐️ 사용자 터치 감지 - 음성 모드 비활성화');
        setVoiceMode(false);
      }
    };

    // 터치 및 클릭 이벤트 리스너
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('click', handleUserInteraction);

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, [voiceMode]);

  // ✅ 전체화면 관련 코드 제거 (Onboarding에서 처리)
  // useEffect(() => {
  //   function openFullscreen() {
  //     const elem = document.documentElement;
  //     if (elem.requestFullscreen) {
  //       elem.requestFullscreen();
  //     } else if (elem.webkitRequestFullscreen) {
  //       elem.webkitRequestFullscreen();
  //     } else if (elem.msRequestFullscreen) {
  //       elem.msRequestFullscreen();
  //     }
  //   }
  //   document.documentElement.addEventListener('click', openFullscreen, { once: true });
  // }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<Onboarding voiceMode={voiceMode} setVoiceMode={setVoiceMode} />}
        />
        <Route 
          path="/main" 
          element={<Main cart={cart} setCart={setCart} voiceMode={voiceMode} />} 
        />
        <Route 
          path="/toping" 
          element={<Toping handleAddToCart={handleAddToCart} voiceMode={voiceMode} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
