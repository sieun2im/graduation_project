import React, { useState } from "react";
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

  const handleMenuClick = (menu) => {
    navigate('/toping', { state: { menu } });
  };

  const handleDelete = (idx) => {
    setCart(oldCart => oldCart.filter((_, i) => i !== idx));
  };

  // 옵션 상세 정보 생성 함수
  const getOptionDetails = (options) => {
    const details = [];
    
    if (options?.sizeUp?.selected) {
      details.push('사이즈업');
    }
    if (options?.shot?.count > 0) {
      details.push(`샷 추가 x${options.shot.count}`);
    }
    if (options?.syrupCafe?.count > 0) {
      details.push(`카페 시럽 x${options.syrupCafe.count}`);
    }
    if (options?.syrupVanilla?.count > 0) {
      details.push(`바닐라 시럽 x${options.syrupVanilla.count}`);
    }
    if (options?.syrupHazelnut?.count > 0) {
      details.push(`헤이즐넛 시럽 x${options.syrupHazelnut.count}`);
    }
    if (options?.decaf?.selected) {
      details.push('디카페인');
    }
    if (options?.pearl?.selected) {
      details.push('펄 추가');
    }
    
    return details;
  };

  // 주문 총 개수, 총 금액 계산
  const totalCount = cart.reduce((acc, item) => acc + item.count, 0);
  const totalPrice = cart.reduce((acc, item) => {
    const optionPrice = Object.values(item.options || {}).reduce((optAcc, opt) => {
      if (typeof opt !== 'object' || opt === null) {
        return optAcc;
      }
      if ('selected' in opt) {
        return optAcc + (opt.selected ? (opt.price || 0) : 0);
      }
      if ('count' in opt) {
        return optAcc + ((opt.price || 0) * (opt.count || 0));
      }
      return optAcc;
    }, 0);
    
    return acc + (item.price + optionPrice) * item.count;
  }, 0);

  const handleOrderSubmit = () => {
    if (cart.length === 0) return;
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className={`mmaaiinn ${showModal ? 'blur-background' : ''}`}>
      <section className="main-top-sec">
        <div className="top-img"><img src={drink} alt="음료" /></div>
        <p className="top-title">EU 키오스크</p>
        <p className="top-sub-title">원하시는 메뉴를 선택해주세요.</p>
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
                    if (typeof opt !== 'object' || opt === null) {
                      return optAcc;
                    }
                    if ('selected' in opt) {
                      return optAcc + (opt.selected ? (opt.price || 0) : 0);
                    }
                    if ('count' in opt) {
                      return optAcc + ((opt.price || 0) * (opt.count || 0));
                    }
                    return optAcc;
                  }, 0);
                  
                  const totalItemPrice = (item.price + optionPrice) * item.count;
                  const optionDetails = getOptionDetails(item.options);
                  
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

      {/* 상세 주문 내역이 포함된 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-section">
              <h2>주문 확인</h2>
              <button className="modal-close-x" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-order-list">
              {cart.map((item, idx) => {
                const optionPrice = Object.values(item.options || {}).reduce((optAcc, opt) => {
                  if (typeof opt !== 'object' || opt === null) return optAcc;
                  if ('selected' in opt) return optAcc + (opt.selected ? (opt.price || 0) : 0);
                  if ('count' in opt) return optAcc + ((opt.price || 0) * (opt.count || 0));
                  return optAcc;
                }, 0);
                const totalItemPrice = (item.price + optionPrice) * item.count;
                const optionDetails = getOptionDetails(item.options);
                
                return (
                  <div key={idx} className="modal-item-detail">
                    <div className="modal-item-header">
                      <div>
                        <p className="modal-item-name">{item.name} <span className="modal-item-qty">x {item.count}</span></p>
                        <p className="modal-item-base-price">기본 가격: &#8361;{item.price.toLocaleString()}</p>
                      </div>
                      <p className="modal-item-total">&#8361;{totalItemPrice.toLocaleString()}원</p>
                    </div>
                    
                    {/* 옵션 상세 표시 */}
                    {optionDetails.length > 0 && (
                      <div className="modal-item-options">
                        <p className="modal-options-title">선택 옵션:</p>
                        <div className="modal-options-list">
                          {item.options?.sizeUp?.selected && (
                            <div className="modal-option-item">
                              <span>• 사이즈업</span>
                              <span>+&#8361;{item.options.sizeUp.price}</span>
                            </div>
                          )}
                          {item.options?.shot?.count > 0 && (
                            <div className="modal-option-item">
                              <span>• 샷 추가 x{item.options.shot.count}</span>
                              <span>+&#8361;{item.options.shot.count * item.options.shot.price}</span>
                            </div>
                          )}
                          {item.options?.syrupCafe?.count > 0 && (
                            <div className="modal-option-item">
                              <span>• 카페 시럽 x{item.options.syrupCafe.count}</span>
                              <span>+&#8361;{item.options.syrupCafe.count * item.options.syrupCafe.price}</span>
                            </div>
                          )}
                          {item.options?.syrupVanilla?.count > 0 && (
                            <div className="modal-option-item">
                              <span>• 바닐라 시럽 x{item.options.syrupVanilla.count}</span>
                              <span>+&#8361;{item.options.syrupVanilla.count * item.options.syrupVanilla.price}</span>
                            </div>
                          )}
                          {item.options?.syrupHazelnut?.count > 0 && (
                            <div className="modal-option-item">
                              <span>• 헤이즐넛 시럽 x{item.options.syrupHazelnut.count}</span>
                              <span>+&#8361;{item.options.syrupHazelnut.count * item.options.syrupHazelnut.price}</span>
                            </div>
                          )}
                          {item.options?.decaf?.selected && (
                            <div className="modal-option-item">
                              <span>• 디카페인</span>
                              <span>+&#8361;{item.options.decaf.price}</span>
                            </div>
                          )}
                          {item.options?.pearl?.selected && (
                            <div className="modal-option-item">
                              <span>• 펄 추가</span>
                              <span>+&#8361;{item.options.pearl.price}</span>
                            </div>
                          )}
                          {item.type === 'coffee' && (
                            <div className="modal-option-item">
                              <span>• 온도/얼음: {item.options?.coffeeTemp} / {item.options?.coffeeIce}</span>
                            </div>
                          )}
                          {item.type === 'tea' && (
                            <div className="modal-option-item">
                              <span>• 온도/얼음: {item.options?.teaTemp} / {item.options?.teaIce}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="modal-divider"></div>
            
            <div className="modal-total">
              <p>총 주문 수량</p>
              <p className="modal-total-count">{totalCount}개</p>
            </div>
            
            <div className="modal-total modal-final-total">
              <p>총 결제 금액</p>
              <p className="modal-total-price">&#8361;{totalPrice.toLocaleString()}원</p>
            </div>
            
            <div className="modal-buttons">
              <button className="modal-cancel-btn" onClick={closeModal}>취소</button>
              <button className="modal-confirm-btn" onClick={() => {
                alert('주문이 완료되었습니다!');
                setCart([]);
                closeModal();
              }}>
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
