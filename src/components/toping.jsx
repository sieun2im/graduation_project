import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import strawberry from '../icons/strawberry.jpg';
import './toping.css';

const Toping = ({ handleAddToCart }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const menu = state?.menu;

  // 공통 옵션 상태
  const [count, setCount] = useState(1);
  const [sizeUp, setSizeUp] = useState(false);
  const [shot, setShot] = useState(0);
  const [syrupCafe, setSyrupCafe] = useState(0);
  const [syrupVanilla, setSyrupVanilla] = useState(0);
  const [syrupHazelnut, setSyrupHazelnut] = useState(0);

  // 커피 옵션
  const [decaf, setDecaf] = useState(false);
  const [coffeeTemp, setCoffeeTemp] = useState('ICE');
  const [coffeeIce, setCoffeeIce] = useState('NORMAL');

  // 스무디 옵션
  const [pearl, setPearl] = useState(false);

  // 티 옵션
  const [teaTemp, setTeaTemp] = useState('HOT');
  const [teaIce, setTeaIce] = useState('NORMAL');

  const basePrice = menu?.price ?? 0;
  const sizeUpPrice = sizeUp ? 700 : 0;
  const shotPrice = shot * 500;
  const syrupPrice = (syrupCafe + syrupVanilla + syrupHazelnut) * 500;
  const decafPrice = decaf ? 500 : 0;
  const pearlPrice = pearl ? 700 : 0;
  const optionTotal = basePrice + sizeUpPrice + shotPrice + syrupPrice + decafPrice + pearlPrice;
  const finalTotal = optionTotal * count;

const addToCartAndNavigate = () => {
  const item = {
    ...menu,
    count,
    options: {
      sizeUp: sizeUp ? { selected: true, price: 700 } : { selected: false, price: 0 },
      shot: { count: shot, price: 500 },
      syrupCafe: { count: syrupCafe, price: 500 },
      syrupVanilla: { count: syrupVanilla, price: 500 },
      syrupHazelnut: { count: syrupHazelnut, price: 500 },
      decaf: decaf ? { selected: true, price: 500 } : { selected: false, price: 0 },
      pearl: pearl ? { selected: true, price: 700 } : { selected: false, price: 0 },
      coffeeTemp,
      coffeeIce,
      teaTemp,
      teaIce,
    },
  };
  handleAddToCart(item);
  navigate('/');
};

  if (!menu) {
    return <div>메뉴 정보를 불러오는 중입니다...</div>;
  }

  return (
    <div className='mmaaiinn'>
      <header className='top-title-ct'>
        <p onClick={() => navigate('/')}>{'<'}</p>
        <p className="option-select">옵션 선택</p>
      </header>

      <article>
        <section className="toping-contant-ct">
          <div
            className="toping-menu-img"
            style={{
              backgroundImage: `url(${menu.img || strawberry})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '70px',
              height: '70px',
              borderRadius: '10px'
            }}
          ></div>

          <div className="tp-menu-title-ct">
            <p className="toping-menu-title">{menu.name}</p>
            <p> &#8361; {basePrice.toLocaleString()}</p>
            <p></p>
          </div>
        </section>

        <section className='toping-count-ct2'>
          <p> 수량 </p>
          <section className="toping-count-ct">
            <p> 수량 </p>
              <div className='count-pm'>
              <button className='chuga-btn' onClick={() => setCount(prev => Math.max(1, prev - 1))}>-</button>
              <p className="toping-count"> {count}</p>
              <button className='chuga-btn' onClick={() => setCount(prev => prev + 1)}>+</button>
            </div>
          </section>
        </section>

        <section className='toping-size-ct2'>
          <p> 사이즈 </p>
          <section className="toping-size-ct">
            <p className="size-title"> 사이즈 업 <span>&#8361;700</span></p>
            <button className='select-bbtn' onClick={() => setSizeUp(v => !v)}>
              {sizeUp ? '✓' : ''}
            </button>

          </section>
        </section>

        <section className='toping-shot-add-ct2'>
          <p> 샷 추가 </p>
          <section className="toping-shot-add-ct">
            <p className='shot'> 샷 추가<span> &#8361;500</span> </p>
            <div className='shot-pm'>
              <button className='chuga-btn' onClick={() => setShot(prev => Math.max(0, prev - 1))}>-</button>
              <p className='toping-count'>{shot}</p>
              <button className='chuga-btn' onClick={() => setShot(prev => prev + 1)}>+</button>
            </div>
          </section>
        </section>

        <section className='topin-syrup-ct2'>
          <p> 시럽 추가</p>
          <section className='toping-syrup-ct'>
            <div className='syrup-total-ct'>
              <p className='cafe-ct'> 카페 시럽 <span> &#8361;500</span></p>
              <div className="cafe-pm">
                <button className='chuga-btn' onClick={() => setSyrupCafe(prev => Math.max(0, prev - 1))}>-</button>
                <p className='toping-count'>{syrupCafe}</p>
                <button className='chuga-btn' onClick={() => setSyrupCafe(prev => prev + 1)}>+</button>
              </div>
            </div>

            <div className='syrup-total-ct'>
              <p className='banila-ct'> 바닐라 시럽 <span> &#8361;500</span></p>
              <div className="banila-pm">
                <button className='chuga-btn' onClick={() => setSyrupVanilla(prev => Math.max(0, prev - 1))}>-</button>
                <p className='toping-count'>{syrupVanilla}</p>
                <button className='chuga-btn' onClick={() => setSyrupVanilla(prev => prev + 1)}>+</button>
              </div>
            </div>

            <div className='syrup-total-ct'>
              <p className='hazelnuts-ct'> 헤이즐넛 시럽 <span> &#8361;500</span></p>
              <div className="hazenuts-pm">
                <button className='chuga-btn' onClick={() => setSyrupHazelnut(prev => Math.max(0, prev - 1))}>-</button>
                <p  className='toping-count'>{syrupHazelnut}</p>
                <button className='chuga-btn' onClick={() => setSyrupHazelnut(prev => prev + 1)}>+</button>
              </div>
            </div>
          </section>
        </section>

        {menu.type === 'coffee' && (
          <>
            <section className='decaffeine-ct2'>
              <p> 디카페인 </p>
              <section className='decaffeine-ct'>
                <div className='decaffeine-chose'>
                  <p className="decaffaine"> 디카페인 <span> &#8361;500 </span> </p>
                  <button className='select-bbtn' onClick={() => setDecaf(v => !v)}>
                    {decaf ? '✓' : ''}
                  </button>
                </div>
              </section>
            </section>

            <section className='ice-total-ct'>
              <p className='ice'> 얼음 양</p>
              <div className='ice-mount-ct'>
                <div>
                <input type='radio' name='coffeeIce' id='less' checked={coffeeIce === 'LESS'} onChange={() => setCoffeeIce('LESS')} />
                <label htmlFor='less'> 적게 </label>
                </div>
                <div>
                <input type='radio' name='coffeeIce' id='normal' checked={coffeeIce === 'NORMAL'} onChange={() => setCoffeeIce('NORMAL')} />
                <label htmlFor='normal'> 보통 </label>
                </div>
                <div>
                <input type='radio' name='coffeeIce' id='more' checked={coffeeIce === 'MORE'} onChange={() => setCoffeeIce('MORE')} />
                <label htmlFor='more'> 많이 </label>
                </div>
              </div>
            </section>

            <section className='temo-total-ct'>
              <p className='temp'> HOT/ICE </p>
              <div className='temp-ct'>
                <div>
                <input type='radio' name='coffeeTemp' id='hot' checked={coffeeTemp === 'HOT'} onChange={() => setCoffeeTemp('HOT')} />
                <label htmlFor='hot'> HOT</label>
                </div>
                <div>
                <input type='radio' name='coffeeTemp' id='ice' checked={coffeeTemp === 'ICE'} onChange={() => setCoffeeTemp('ICE')} />
                <label htmlFor='ice'> ICE</label>
                </div>
              </div>
            </section>
          </>
        )}

        {menu.type === 'smoothie' && (
          <section className='smoothie-ct'>
            <p className="smoothie"> 펄 추가 </p>
            <div className="pearl-add">
              <p> 펄 추가 <span> &#8361;700 </span></p>
              <button className='select-bbtn' onClick={() => setPearl(v => !v)}>{pearl ? '✓' : ''}</button>
            </div>
          </section>
        )}

        {menu.type === 'tea' && (
          <section className='tea-ct'>
            <p className='ice'> HOT/ICE</p>
            <div className='ice-mount-ct2'>
              <div className='aaaa'>
              <input type='radio' name='teaIce' id='less2' checked={teaIce === 'LESS'} onChange={() => setTeaIce('LESS')} />
              <label className="asds"htmlFor='less2'> HOT </label>
              </div>
              <div className='aaaa'>
              <input type='radio' name='teaIce' id='normal2' checked={teaIce === 'NORMAL'} onChange={() => setTeaIce('NORMAL')} />
              <label className="asds" htmlFor='normal2'> ICE </label>
              </div>
            </div>
          </section>
        )}

      </article>

      <footer>
        <section className='footer-total-ct'>
          <div className="final-count-ct">
            <p> 총 {count}개</p>
            <p className='final-price'> &#8361;{finalTotal.toLocaleString()}</p>
          </div>

          <button className='jupjup' onClick={addToCartAndNavigate}>
            장바구니에 담기 <span>&#8361;{finalTotal.toLocaleString()}원</span>
          </button>
        </section>
      </footer>
    </div>
  );
};

export default Toping;
