import React from "react";
import './main.css';
import drink from '../icons/beverage-emoji-style.svg'
import iceamericano from '../icons/iceamericano.png'
import shopimg from '../icons/shop.svg'
const drinks = [
  { name: '아메리카노', price: 4500, img: iceamericano },
  { name: '카페라떼', price: 5000, img: iceamericano },
  { name: '바닐라라떼', price: 5200, img: iceamericano },
  { name: '돌체라떼', price: 5500, img: iceamericano },
  { name: '카푸치노', price: 4700, img: iceamericano },
  { name: '콜드브루', price: 5000, img: iceamericano }
  // 더 추가 가능
];

export default function Main() {
  return (
    <div className="mmaaiinn">
      <section className="main-top-sec">
        <div className="top-img"><img src={drink} alt="음료" /></div>
        <p className="top-title">AI 음성 키오스크</p>
        <p className="top-sub-title">원하시는 메뉴를 선택하세요.</p>
      </section>

      <div className="line"></div>

      <div className="drink-total-ct">
        {drinks.map((d, idx) => (
          <section className="menu-detail-ct" key={idx}>
            <section className="menu-contant-ct">
              <div className="menu-img">
                <img src={d.img} alt={d.name} />
              </div>
            </section>
            <p className="menu-name">{d.name}</p>
            <p className="menu-price">&#8361;{d.price.toLocaleString()}</p>
          </section>
        ))}
      </div>

      <section className="order-details">

        <div className="order-header">
          <div className="order-shop-img"><img src={shopimg} alt="shoping img"/></div>
          <p>주문내역</p>
        </div>

        <div className="order-main">
        <div className="order-shop-img2"><img src={shopimg} alt="shoping img2"/></div>
          <p>주문할 상품을 선택해주세요</p>
          <div className="order-footer-line"></div>
        </div>

      </section>
    </div>
  );
}
