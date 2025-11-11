import React from "react";
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

  const handleMenuClick = (menu) => {
    navigate('/toping', { state: { menu } });
  };

  // 수량 증감
  const handleCountChange = (idx, delta) => {
    setCart(oldCart => oldCart.map((item, i) =>
      i === idx ? { ...item, count: Math.max(1, item.count + delta) } : item
    ));
  };

  // 삭제
  const handleDelete = (idx) => {
    setCart(oldCart => oldCart.filter((_, i) => i !== idx));
  };

  // 주문 총 개수, 총 금액 계산
const totalCount = cart.reduce((acc, item) => acc + item.count, 0);
const totalPrice = cart.reduce((acc, item) => {
  const optionPrice = Object.values(item.options || {}).reduce((optAcc, opt) => {
    // 문자열이나 null은 무시
    if (typeof opt !== 'object' || opt === null) {
      return optAcc;
    }
    
    // selected 속성이 있는 경우 (sizeUp, decaf, pearl 등)
    if ('selected' in opt) {
      return optAcc + (opt.selected ? (opt.price || 0) : 0);
    }
    
    // count 속성이 있는 경우 (shot, syrup 등)
    if ('count' in opt) {
      return optAcc + ((opt.price || 0) * (opt.count || 0));
    }
    
    return optAcc;
  }, 0);
  
  return acc + (item.price + optionPrice) * item.count;
}, 0);


  return (
    <div className="mmaaiinn">
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
  return (
            <div key={idx} className="order-history-total">
              <div className="order-footer-history-ct">
                <section className="ofhc">
                  <p className="ah">{item.name}</p>
                  <p className="aj">&#8361;{totalItemPrice.toLocaleString()}원</p>
                </section>
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
        <button className="order-submit-btn">
          주문하기 <span className="qp"> &#8361;{totalPrice.toLocaleString()}원</span>
        </button>
      </div>
    </>
  )}
</div>

      </section>
    </div>
  );
}
