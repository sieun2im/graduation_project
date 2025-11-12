import './menuT.css';
import { useNavigate } from 'react-router-dom'; // 추가
import eulji from '../icons/eulji.png'
import drinklogo from '../icons/beverage-emoji-style.svg'

function Onboarding() {
    const navigate = useNavigate(); // navigate 함수 선언
    
    const handleOrderTypeClick = () => {
        navigate('/main'); // main 페이지로 이동
    };
    
    return (
        <div className="mmaaiinn">
            <section className="onboard-total-ct">
                <div className='logo-ct'>
                    <div className='eulji-logo'> <img src={eulji}/> </div>
                    <div className='middle-line'> <p> </p></div>
                    <div className='kiosk-logo'> <img src={drinklogo}/> </div>
                </div>

                <div className='kiosk-title'>EU AI 음성 키오스크 </div>

                <p className='kiosk-eng'> Ai Voice Kiosk </p>

                <p className='click'> 클릭하여 주문하세요. </p>

                <p className='kiosk-solution'> 주문 방식을 선택해주세요</p>

                <div className='order-method-ct'>
                    <section className='Take-out-ct' onClick={handleOrderTypeClick}>
                        <div className='tt'>
                            <div className='takeout-img'>🛍️</div>
                        </div>
                        <p className='takeout'> 포장 </p>
                        <p className='takeout-sub'> Take out</p>
                    </section>
                   
                   <section className='Dine-in-ct' onClick={handleOrderTypeClick}>
                    <div className='tt2'>
                        <div className='dinein-img'>🪑</div>
                    </div>    
                        <p className='pack'> 매장 </p>
                        <p className='pack-sub'> Dine in</p>
                    </section>
                </div>
            </section>
        </div>
    );
}

export default Onboarding
