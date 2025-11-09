import React from "react";
import './main.css';
import drink from '../icons/beverage-emoji-style.svg'
import americano from '../icons/americano.jpg'
import vanlia from '../icons/vanila.jpg'
import cara  from '../icons/ca.jpg'
import icetea from '../icons/lemon.jpg'
import lemonade from '../icons/lemonade.jpg'
import orangejuice from '../icons/orangejuice.jpg'
import strawberry from '../icons/strawberry.jpg'
import kewhi from '../icons/kewhi.jpg'
import ujacha from '../icons/ujacha.jpg'
import kamomaeil from '../icons/kamomaeil.jpg'
import shopimg from '../icons/shop.svg'

const drinks = [
  { name: '아메리카노', price: 1500, img: americano },
  { name: '바닐라 라뗴', price: 2500, img: vanlia },
  { name: '캐러멜 마키아토', price: 3000, img: cara },
  { name: '복숭아 아이스티', price: 2000, img: icetea },
  { name: '레모네이드', price: 2000, img: lemonade },
  { name: '오렌지 주스', price: 2009, img: orangejuice },
  { name: '딸기 스무디', price: 3500, img: strawberry },
  { name: '키위 스무디', price: 2500, img: kewhi },
  { name: '유자차', price: 3000, img: ujacha },
  { name: '캐모마일 티', price: 3000, img: kamomaeil }
  // 더 추가 가능
];

export default function Main() {
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
  <section className="menu-detail-ct" key={idx}>
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
          borderRadius: '15px 15px 0px 0px'
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
          <div className="order-shop-img"><img src={shopimg} alt="shoping img"/></div>
          <p>주문내역</p>
        </div>

        <div className="order-main">
        <div className="order-shop-img2"><img src={shopimg} alt="shoping img2"/></div>
          <p className="order-text">주문할 상품을 선택해주세요</p>
          <div className="order-footer-line"></div>
        </div>

      </section>
    </div>
  );
}
