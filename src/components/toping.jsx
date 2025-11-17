import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import strawberry from '../icons/strawberry.jpg';
import springai from '../utils/springai';
import './toping.css';

const Toping = ({ handleAddToCart, voiceMode }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const menu = state?.menu;

  const [count, setCount] = useState(1);
  const [sizeUp, setSizeUp] = useState(false);
  const [shot, setShot] = useState(0);
  const [syrupCafe, setSyrupCafe] = useState(0);
  const [syrupVanilla, setSyrupVanilla] = useState(0);
  const [syrupHazelnut, setSyrupHazelnut] = useState(0);

  const [decaf, setDecaf] = useState(false);
  const [coffeeTemp, setCoffeeTemp] = useState('ICE');
  const [coffeeIce, setCoffeeIce] = useState('NORMAL');

  const [pearl, setPearl] = useState(false);

  const [teaTemp] = useState('HOT');
  const [teaIce, setTeaIce] = useState('NORMAL');

  const [setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const voiceModeRef = useRef(voiceMode);
  const audioPlayerRef = useRef(null);
  const conversationStartedRef = useRef(false);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
    
    if (!voiceMode) {
      console.log('🔇 Toping - 음성 모드 비활성화');
      stopVoiceRecording();
    }
  }, [voiceMode]);

  useEffect(() => {
    if (voiceMode && !conversationStartedRef.current) {
      conversationStartedRef.current = true;
      setTimeout(() => {
        startBackendConversation();
      }, 500);
    }
  }, [voiceMode]);

  const startBackendConversation = async () => {
    if (!voiceModeRef.current) {
      console.log('🔇 음성 모드 아님 - 대화 시작 중단');
      return;
    }

    if (isSpeakingRef.current) return;
    
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    try {
      const formData = new FormData();
      formData.append('menuName', menu?.name || '메뉴');
      
      console.log('📤 백엔드에 Toping 페이지 진입 알림');
      const response = await fetch('/ai/chat-voice-toping', {
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
        console.log('🔊 백엔드 AI 음성 재생 완료');
        setIsSpeaking(false);
        isSpeakingRef.current = false;

        if (voiceModeRef.current) {
          startMicRecording();
        }
      }, { once: true });

      await springai.voice.playAudioFormStreamingData(response, audioPlayer);

    } catch (error) {
      console.error('❌ 백엔드 통신 오류:', error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  const startMicRecording = () => {
    if (!springai || !springai.voice) {
      console.error('❌ springai.js가 로드되지 않았습니다.');
      return;
    }
    
    if (!voiceModeRef.current) {
      console.log('🔇 음성 모드 비활성화 - 마이크 시작 중단');
      return;
    }
    
    console.log('🎤 음성 인식 마이크 시작');
    springai.voice.initMic(handleVoice);
    springai.voice.controlSpeakerAnimation('user-speaker', true);
  };

  const stopVoiceRecording = () => {
    if (springai && springai.voice) {
      if (springai.voice.mediaRecorder && springai.voice.mediaRecorder.state === 'recording') {
        springai.voice.mediaRecorder.stop();
      }
      if (springai.voice.recognition) {
        springai.voice.recognition.stop();
      }
      springai.voice.controlSpeakerAnimation('user-speaker', false);
      springai.voice.controlSpeakerAnimation('ai-speaker', false);
    }
    window.speechSynthesis.cancel();
  };

  const handleVoice = async (mp3Blob) => {
    springai.voice.controlSpeakerAnimation('user-speaker', false);
    console.log('🎤 사용자 음성 수신:', mp3Blob);

    if (!voiceModeRef.current) {
      console.log('🔇 음성 모드 비활성화 - 음성 처리 중단');
      return;
    }

    setIsSpeaking(true);
    isSpeakingRef.current = true;

    try {
      const formData = new FormData();
      formData.append('question', mp3Blob, 'speech.mp3');
      formData.append('page', 'toping');
      formData.append('menuName', menu?.name || '');

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
      
      springai.voice.controlSpeakerAnimation('ai-speaker', true);

      const audioPlayer = audioPlayerRef.current;
      
      audioPlayer.addEventListener('ended', () => {
        console.log('🔊 AI 응답 음성 재생 완료');
        springai.voice.controlSpeakerAnimation('ai-speaker', false);
        setIsSpeaking(false);
        isSpeakingRef.current = false;

        if (voiceModeRef.current) {
          setTimeout(() => {
            startMicRecording();
          }, 1000);
        }
      }, { once: true });

      await springai.voice.playAudioFormStreamingData(response, audioPlayer);

    } catch (error) {
      console.error('❌ 음성 처리 중 에러:', error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      springai.voice.controlSpeakerAnimation('ai-speaker', false);
    }
  };

  const basePrice = menu?.price ?? 0;
  const sizeUpPrice = sizeUp ? 700 : 0;
  const shotPrice = shot * 500;
  const syrupPrice = (syrupCafe + syrupVanilla + syrupHazelnut) * 500;
  const decafPrice = decaf ? 500 : 0;
  const pearlPrice = pearl ? 700 : 0;
  const optionTotal = basePrice + sizeUpPrice + shotPrice + syrupPrice + decafPrice + pearlPrice;
  const finalTotal = optionTotal * count;

  const addToCartAndNavigate = () => {
    stopVoiceRecording();
    
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
    navigate('/main');
  };

  useEffect(() => {
    return () => {
      stopVoiceRecording();
    };
  }, []);

  if (!menu) {
    return <div>메뉴 정보를 불러오는 중입니다...</div>;
  }

  return (
    <div className='mmaaiinn'>
      {/* 음성 재생용 audio 태그 */}
      <audio ref={audioPlayerRef} style={{ display: 'none' }} />

      {/* springai 음성 스피커 애니메이션용 요소 (숨김) */}
      <div style={{ display: 'none' }}>
        <div id="user-speaker"></div>
        <div id="ai-speaker"></div>
      </div>

      {voiceMode && (
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
          🎤 음성 모드 활성
        </div>
      )}

      <header className='top-title-ct'>
        <p onClick={() => {
          stopVoiceRecording();
          navigate('/main');
        }}>{'<'}</p>
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
