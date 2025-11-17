import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import drink from '../icons/beverage-emoji-style.svg';
import americano from '../icons/americano.jpg';
import vanlia from '../icons/vanila.jpg';
import cara  from '../icons/ca.jpg';
import icetea from '../icons/lemon.jpg';
import lemonade from '../icons/lemonade.jpg';
import orangejuice from '../icons/orangejuice.jpg';
import strawberry from '../icons/strawberry.jpg';
import kewhi from '../icons/kewhi.jpg';
import ujacha from '../icons/ujacha.jpg';
import kamomaeil from '../icons/kamomaeil.jpg';
import shopimg from '../icons/shop.svg';
import trash from '../icons/trashcan.png';
import springai from '../utils/springai';
import './main.css';

const drinks = [
  { name: '아메리카노', price: 1500, img: americano, type: 'coffee' },
  { name: '바닐라 라뗴', price: 2500, img: vanlia, type: 'coffee' },
  { name: '캐러멜 마키아토', price: 3000, img: cara, type: 'coffee' },
  { name: '복숭아 아이스티', price: 2000, img: icetea, type: 'tea' },
  { name: '레모네이드', price: 2000, img: lemonade, type: 'juice' },
  { name: '오렌지 주스', price: 2000, img: orangejuice, type: 'juice' },
  { name: '딸기 스무디', price: 3500, img: strawberry, type: 'smoothie' },
  { name: '키위 스무디', price: 2500, img: kewhi, type: 'smoothie' },
  { name: '유자차', price: 3000, img: ujacha, type: 'tea' },
  { name: '캐모마일 티', price: 3000, img: kamomaeil, type: 'tea' }
];

export default function Main({ cart, setCart }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(100);
  const [showDetails, setShowDetails] = useState(false);
  
  // 음성 관련 상태
  const [voiceActive, setVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    const savedOrderNumber = localStorage.getItem('orderNumber');
    if (savedOrderNumber) {
      setOrderNumber(parseInt(savedOrderNumber));
    } else {
      localStorage.setItem('orderNumber', '100');
    }

    // 페이지 로드 시 음성 안내 시작
    setTimeout(() => {
      playMenuGuide();
    }, 500);
  }, []);

  // 메뉴 안내 음성
  const playMenuGuide = () => {
    if (isSpeakingRef.current) return;
    
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    const guideText = '원하시는 메뉴를 선택하시거나 음성으로 주문해주세요.';
    const utterance = new SpeechSynthesisUtterance(guideText);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      
      // 안내 후 음성 인식 시작
      startVoiceOrder();
    };

    window.speechSynthesis.speak(utterance);
  };

  // 음성 주문 시작
  const startVoiceOrder = () => {
    if (!springai || !springai.voice) {
      console.error('❌ springai.js가 로드되지 않았습니다.');
      return;
    }
    
    if (voiceActive) return; // 이미 활성화된 경우
    
    console.log('🎤 음성 주문 시작');
    setVoiceActive(true);
    springai.voice.initMic(handleVoiceOrder);
  };

  // 음성 주문 처리
  const handleVoiceOrder = async (mp3Blob) => {
    console.log('🎤 사용자 음성 수신:', mp3Blob);
    
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    setVoiceActive(false);

    try {
      const formData = new FormData();
      formData.append('question', mp3Blob, 'speech.mp3');

      console.log('📤 백엔드로 음성 전송 중...');
      const response = await fetch('/ai/chat-voice-one-model', {
        method: 'POST',
        headers: { Accept: 'application/octet-stream' },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`백엔드 응답 에러: ${response.status}`);
      }

      console.log('✅ 백엔드 응답 수신');

      const audioPlayer = audioPlayerRef.current;
      
      audioPlayer.addEventListener('ended', () => {
        console.log('🔊 AI 응답 음성 재생 완료');
        setIsSpeaking(false);
        isSpeakingRef.current = false;

        // 응답 완료 후 다시 음성 주문 대기
        setTimeout(() => {
          startVoiceOrder();
        }, 1000);
      }, { once: true });

      await springai.voice.playAudioFormStreamingData(response, audioPlayer);

    } catch (error) {
      console.error('❌ 음성 처리 중 에러:', error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      
      // 에러 발생 시 다시 음성 주문 대기
      setTimeout(() => {
        startVoiceOrder();
      }, 1000);
    }
  };

  const handleMenuClick = (menu) => {
    // 음성 인식 중지
    if (springai && springai.voice && springai.voice.mediaRecorder) {
      springai.voice.mediaRecorder.stop();
    }
    if (springai && springai.voice && springai.voice.recognition) {
      springai.voice.recognition.stop();
    }
    setVoiceActive(false);
    
    navigate('/toping', { state: { menu } });
  };

  const handleDelete = (idx) => {
    setCart(oldCart => oldCart.filter((_, i) => i !== idx));
  };

  const getOptionSummary = (options) => {
    const details = [];
    if (options?.sizeUp?.selected) details.push('사이즈업');
    if (options?.shot?.count > 0) details.push(`샷 x${options.shot.count}`);
    if (options?.syrupCafe?.count > 0) details.push(`카페시럽 x${options.syrupCafe.count}`);
    if (options?.syrupVanilla?.count > 0) details.push(`바닐라시럽 x${options.syrupVanilla.count}`);
    if (options?.syrupHazelnut?.count > 0) details.push(`헤이즐넛시럽 x${options.syrupHazelnut.count}`);
    if (options?.decaf?.selected) details.push('디카페인');
    if (options?.pearl?.selected) details.push('펄');
    return details;
  };

  const totalCount = cart.reduce((acc, item) => acc + item.count, 0);
  const totalPrice = cart.reduce((acc, item) => {
    const optionPrice = Object.values(item.options || {}).reduce((optAcc, opt) => {
      if (typeof opt !== 'object' || opt === null) return optAcc;
      if ('selected' in opt) return optAcc + (opt.selected ? (opt.price || 0) : 0);
      if ('count' in opt) return optAcc + ((opt.price || 0) * (opt.count || 0));
      return optAcc;
    }, 0);
    return acc + (item.price + optionPrice) * item.count;
  }, 0);

  const handleOrderSubmit = () => {
    if (cart.length === 0) return;
    
    // 음성 인식 중지
    if (springai && springai.voice && springai.voice.mediaRecorder) {
      springai.voice.mediaRecorder.stop();
    }
    if (springai && springai.voice && springai.voice.recognition) {
      springai.voice.recognition.stop();
    }
    setVoiceActive(false);
    
    const newOrderNumber = orderNumber + 1;
    setOrderNumber(newOrderNumber);
    localStorage.setItem('orderNumber', newOrderNumber.toString());
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowDetails(false);
  };

  const resetOrderNumber = () => {
    const confirm = window.confirm('주문번호를 100으로 초기화하시겠습니까?');
    if (confirm) {
      setOrderNumber(100);
      localStorage.setItem('orderNumber', '100');
      alert('주문번호가 100으로 초기화되었습니다.');
    }
  };

  return (
    <div className={`mmaaiinn ${showModal ? 'blur-background' : ''}`}>
      {/* 음성 재생용 audio 태그 */}
      <audio ref={audioPlayerRef} style={{ display: 'none' }} />

      <section className="main-top-sec">
        <div className="top-img"><img src={drink} alt="음료" /></div>
        <p className="top-title">EU 키오스크</p>
        <p className="top-sub-title">원하시는 메뉴를 선택해주세요.</p>
        
        {/* 음성 인식 상태 표시 */}
        {voiceActive && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '20px',
            fontSize: '16px',
            zIndex: 1000,
            animation: 'pulse 1.5s infinite'
          }}>
            🎤 음성 듣는 중...
          </div>
        )}
        
        <button 
          className="reset-order-btn" 
          onDoubleClick={resetOrderNumber}
          title="더블클릭하여 주문번호 초기화"
        >
          주문번호 초기화
        </button>
      </section>

      <div className="line"></div>

      <div className="drink-total-ct">
        {drinks.map((d, idx) => (
          <section key={idx} className="menu-detail-ct" onClick={() => handleMenuClick(d)}>
            <section className="menu-contant-ct">
              <div
                className="menu-img"
                style={{
                  backgroundImage: `url(${d.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  width: '225px',
                  height: '220px',
                  borderRadius: '15px 15px 0 0'
                }}
              ></div>
            </section>
            <p className="menu-name">{d.name}</p>
            <p className="menu-price">&#8361;{d.price.toLocaleString()}</p>
          </section>
        ))}
      </div>

      <section className="order-details">
        <div className="order-header">
          <div className="order-shop-img"><img src={shopimg} alt="shoping img" /></div>
          <p>주문내역</p>
        </div>
        <div className="order-main">
          {cart.length === 0 && (
            <div className="order-shop-img2"><img src={shopimg} alt="shoping img2" /></div>
          )}
          
          {cart.length === 0 ? (
            <p className="order-text">주문할 상품을 선택해주세요</p>
          ) : (
            <>
              <div className="order-history-container">
                {cart.map((item, idx) => {
                  const optionPrice = Object.values(item.options || {}).reduce((optAcc, opt) => {
                    if (typeof opt !== 'object' || opt === null) return optAcc;
                    if ('selected' in opt) return optAcc + (opt.selected ? (opt.price || 0) : 0);
                    if ('count' in opt) return optAcc + ((opt.price || 0) * (opt.count || 0));
                    return optAcc;
                  }, 0);
                  
                  const totalItemPrice = (item.price + optionPrice) * item.count;
                  const optionDetails = getOptionSummary(item.options);
                  
                  return (
                    <div key={idx} className="order-history-total">
                      <div className="order-footer-history-ct">
                        <div className="dfd">
                        <section className="ofhc">
                          <p className="ah">{item.name}</p>
                          <p className="aj">&#8361;{totalItemPrice.toLocaleString()}원</p>                        
                        </section>
                          {optionDetails.length > 0 && (
                            <p className="option-details" style={{ fontSize: '12px', color: '#666' }}>
                              {optionDetails.join(', ')}
                            </p>
                          )}
                        </div>
                        <p>
                          <img 
                            className="ab" 
                            src={trash} 
                            style={{width: 30, height: 30, cursor: 'pointer'}} 
                            onClick={() => handleDelete(idx)} 
                          />
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="order-footer-line"></div>
              <div className="qwer">
                <div className="order-total-cont">
                  <p className="ddong">총 {totalCount}개</p>
                  <p className="ddong2">&#8361;{totalPrice.toLocaleString()}원</p>
                </div>
                <button className="order-submit-btn" onClick={handleOrderSubmit}>
                  주문하기 <span className="qp"> &#8361;{totalPrice.toLocaleString()}원</span>
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {showModal && (
        <div className="order-complete-overlay">
          <div className="order-complete-modal">
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="check-line check-tip"></span>
                <span className="check-line check-long"></span>
                <div className="check-circle"></div>
              </div>
            </div>

            <h2 className="complete-title">주문이 완료되었습니다!</h2>
            <p className="order-number-text">
              주문번호: <span className="order-number-highlight">{orderNumber}</span>
            </p>

            <div className="order-summary-section">
              <h3 className="section-header">주문 내역</h3>
              
              <div className="order-items-container">
                {cart.map((item, idx) => {
                  const optionPrice = Object.values(item.options || {}).reduce((optAcc, opt) => {
                    if (typeof opt !== 'object' || opt === null) return optAcc;
                    if ('selected' in opt) return optAcc + (opt.selected ? (opt.price || 0) : 0);
                    if ('count' in opt) return optAcc + ((opt.price || 0) * (opt.count || 0));
                    return optAcc;
                  }, 0);
                  const totalItemPrice = (item.price + optionPrice) * item.count;
                  
                  const optionsList = [];
                  if (item.options?.sizeUp?.selected) optionsList.push('사이즈업');
                  if (item.options?.shot?.count > 0) optionsList.push(`샷 추가 x ${item.options.shot.count}`);
                  if (item.options?.syrupCafe?.count > 0) optionsList.push(`카페 시럽 x ${item.options.syrupCafe.count}`);
                  if (item.options?.syrupVanilla?.count > 0) optionsList.push(`바닐라 시럽 x ${item.options.syrupVanilla.count}`);
                  if (item.options?.syrupHazelnut?.count > 0) optionsList.push(`헤이즐넛 시럽 x ${item.options.syrupHazelnut.count}`);
                  if (item.options?.decaf?.selected) optionsList.push('디카페인');
                  if (item.options?.pearl?.selected) optionsList.push('펄 추가');
                  
                  return (
                    <div key={idx} className="order-item-wrapper">
                      <div className="order-item-line">
                        <span className="item-description">{item.name} × {item.count}</span>
                        <span className="item-amount">₩{totalItemPrice.toLocaleString()}</span>
                      </div>
                      
                      {optionsList.length > 0 && (
                        <div className="item-options-summary">
                          {optionsList.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="total-payment-box">
                <span className="total-label">총 결제금액</span>
                <span className="total-value">₩{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="notice-box">
              <div className="notice-row">
                <span className="notice-emoji">⏰</span>
                <span className="notice-message">주문하신 음료는 5-10분 후에 준비됩니다.</span>
              </div>
              <div className="notice-row">
                <span className="notice-emoji">⚠️</span>
                <span className="notice-message">진동벨이 울리면 카운터에서 수령해주세요.</span>
              </div>
            </div>

            <button className="new-order-button" onClick={() => {
              setCart([]);
              closeModal();
              navigate('/');
            }}>
              ✨ 새 주문하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
