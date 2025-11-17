import './menuT.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import eulji from '../icons/eulji.png';
import drinklogo from '../icons/beverage-emoji-style.svg';
import springai from '../utils/springai';

function Onboarding() {
  const navigate = useNavigate();
  const [port, setPort] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const voiceEnabledRef = useRef(false);
  const readerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  
  // ✅ 사용자 감지 여부 추적 (한 번만 감지)
  const [userDetected, setUserDetected] = useState(false);
  const userDetectedRef = useRef(false);

  const handleOrderTypeClick = () => {
    navigate('/main');
  };

  // 음성 활성화 함수
  const enableVoice = () => {
    if (!voiceEnabledRef.current) {
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
      setVoiceEnabled(true);
      voiceEnabledRef.current = true;
      console.log('✅ 음성 재생 권한 활성화 완료');
    }
  };

  // 환영 메시지 + springai 음성 인식 시작
  const playWelcomeMessage = () => {
    console.log('=== playWelcomeMessage 호출됨 ===');
    
    // ✅ 이미 감지된 경우 무시
    if (userDetectedRef.current) {
      console.log('[playWelcomeMessage] 이미 사용자 감지됨 - 중복 실행 차단');
      return;
    }
    
    if (isSpeakingRef.current) {
      console.log('[playWelcomeMessage] 음성 재생 중, 중복 재생 차단');
      return;
    }
    
    if (!voiceEnabledRef.current) {
      console.log('[playWelcomeMessage] 음성 권한 미활성화 - 재생 불가');
      return;
    }

    // ✅ 사용자 감지 상태를 true로 설정 (더 이상 감지하지 않음)
    setUserDetected(true);
    userDetectedRef.current = true;
    console.log('✅ 사용자 최초 감지 - 추가 감지 비활성화');

    console.log('[playWelcomeMessage] 음성 재생 시작');
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    const messages = [
      '안녕하세요! EU 음성 키오스크에 오신 것을 환영합니다.',
      '포장 또는 매장을 말해주세요.'
    ];

    const utterance1 = new SpeechSynthesisUtterance(messages[0]);
    utterance1.lang = 'ko-KR';
    utterance1.rate = 0.95;
    utterance1.pitch = 1.1;

    const utterance2 = new SpeechSynthesisUtterance(messages[1]);
    utterance2.lang = 'ko-KR';
    utterance2.rate = 0.95;
    utterance2.pitch = 1.0;

    utterance1.onend = () => {
      setTimeout(() => {
        window.speechSynthesis.speak(utterance2);
      }, 300);
    };

    utterance2.onend = () => {
      console.log('[utterance2] 음성 재생 종료');
      setIsSpeaking(false);
      isSpeakingRef.current = false;

      // 음성 안내 종료 후 음성 인식 시작
      startMicRecording();
    };

    utterance1.onerror = utterance2.onerror = (e) => {
      console.error('[utterance] 음성 재생 오류:', e);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.speak(utterance1);
  };

  // springai 마이크 시작
  const startMicRecording = () => {
    if (!springai || !springai.voice) {
      console.error('❌ springai.js가 로드되지 않았습니다.');
      return;
    }
    console.log('🎤 음성 인식 마이크 시작');
    springai.voice.initMic(handleVoice);
    springai.voice.controlSpeakerAnimation('user-speaker', true);
  };

  // 사용자 음성 mp3Blob 받는 콜백
  const handleVoice = async (mp3Blob) => {
    springai.voice.controlSpeakerAnimation('user-speaker', false);
    console.log('🎤 사용자 음성 수신:', mp3Blob);

    // 음성 재생 중으로 설정
    setIsSpeaking(true);
    isSpeakingRef.current = true;

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
      
      // AI 스피커 애니메이션 시작
      springai.voice.controlSpeakerAnimation('ai-speaker', true);

      // 오디오 플레이어 가져오기
      const audioPlayer = audioPlayerRef.current;
      
      // 응답 음성 재생 완료 후 처리
      audioPlayer.addEventListener('ended', () => {
        console.log('🔊 AI 응답 음성 재생 완료');
        springai.voice.controlSpeakerAnimation('ai-speaker', false);
        setIsSpeaking(false);
        isSpeakingRef.current = false;

        // 메인 화면으로 이동
        setTimeout(() => {
          navigate('/main');
        }, 500);
      }, { once: true });

      // 스트리밍 응답 재생
      await springai.voice.playAudioFormStreamingData(response, audioPlayer);

    } catch (error) {
      console.error('❌ 음성 처리 중 에러:', error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      springai.voice.controlSpeakerAnimation('ai-speaker', false);
      
      // 에러 발생 시에도 메인으로 이동 (개발 중)
      alert('음성 인식 오류가 발생했습니다. 메인 화면으로 이동합니다.');
      navigate('/main');
    }
  };

  const connectArduino = async () => {
    try {
      if ('serial' in navigator) {
        console.log('🔌 포트 선택 대기 중...');
        const selectedPort = await navigator.serial.requestPort();
        await selectedPort.open({ baudRate: 9600 });

        setPort(selectedPort);
        setIsConnected(true);
        readArduinoData(selectedPort);

        console.log('✅ 아두이노 연결 성공!');
      } else {
        alert('❌ Web Serial API를 지원하지 않는 브라우저입니다.\nChrome 브라우저를 사용해주세요.');
      }
    } catch (error) {
      console.error('아두이노 연결 실패:', error);
      alert('아두이노 연결에 실패했습니다. USB 케이블을 확인해주세요.');
    }
  };

  const disconnectArduino = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (port) {
        await port.close();
      }
      setPort(null);
      setIsConnected(false);
      console.log('✅ 아두이노 연결 해제 완료');
    } catch (error) {
      console.error('아두이노 연결 해제 실패:', error);
    }
  };

  const readArduinoData = async (selectedPort) => {
    try {
      const textDecoder = new TextDecoderStream();
      selectedPort.readable.pipeTo(textDecoder.writable);
      
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          reader.releaseLock();
          readerRef.current = null;
          break;
        }
        
        if (value) {
          const lines = value.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          
          for (const data of lines) {
            console.log('📡 수신 데이터:', data);
            
            if (data.toUpperCase().includes('USER_DETECT')) {
              console.log(`[readArduinoData] USER_DETECTED 신호 수신`);
              
              // ✅ 이미 감지된 경우 무시
              if (userDetectedRef.current) {
                console.log('[readArduinoData] 이미 사용자 감지됨 - 추가 감지 무시');
                continue;
              }
              
              // ✅ 음성 재생 중이거나 권한 없으면 무시
              if (!isSpeakingRef.current && voiceEnabledRef.current) {
                playWelcomeMessage();
              } else {
                console.log('[readArduinoData] 음성 재생 중이거나 음성 비활성화 상태');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('📡 시리얼 읽기 중 오류:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    const autoConnect = async () => {
      try {
        if ('serial' in navigator) {
          const ports = await navigator.serial.getPorts();

          if (ports.length > 0) {
            const selectedPort = ports[0];
            await selectedPort.open({ baudRate: 9600 });
            setPort(selectedPort);
            setIsConnected(true);
            readArduinoData(selectedPort);
            console.log('✅ 아두이노 자동 재연결 성공!');
          }
        }
      } catch (error) {
        console.log('자동 연결 실패');
      }
    };

    autoConnect();

    // ✅ 컴포넌트 언마운트 시 정리 (다시 돌아오면 상태 리셋됨)
    return () => {
      if (readerRef.current) readerRef.current.cancel().catch(console.error);
      if (port) port.close().catch(console.error);
      console.log('🔄 Onboarding 언마운트 - 감지 상태 리셋 준비');
    };
  }, []);

  return (
    <div className="mmaaiinn">
      {/* 음성 활성화 버튼 */}
      {!voiceEnabled && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 50px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <h2 style={{marginBottom: '20px', fontSize: '28px'}}>🔊 음성 안내 시작</h2>
          <p style={{marginBottom: '30px', fontSize: '18px', color: '#666'}}>
            시작하려면 아래 버튼을 클릭하세요
          </p>
          <button 
            onClick={enableVoice}
            style={{
              background: '#4CAF50',
              color: 'white',
              padding: '20px 40px',
              fontSize: '24px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
          >
            음성 활성화
          </button>
        </div>
      )}

      <div className="arduino-status">
        {isConnected ? (
          <div className="status-connected">
            <span className="status-dot"></span>
            아두이노 연결됨
            {userDetected && (
              <span style={{marginLeft: '10px', color: '#4CAF50', fontSize: '14px'}}>
                ✓ 사용자 감지됨
              </span>
            )}
            <button className="disconnect-btn" onClick={disconnectArduino} style={{marginLeft: '10px'}}>
              🔌 연결 해제
            </button>
          </div>
        ) : (
          <button className="connect-btn" onClick={connectArduino}>
            🔌 아두이노 수동 연결
          </button>
        )}
      </div>

      {/* 음성 재생용 audio 태그 */}
      <audio ref={audioPlayerRef} style={{ display: 'none' }} />

      {/* springai 음성 스피커 애니메이션용 요소 (숨김) */}
      <div style={{ display: 'none' }}>
        <div id="user-speaker"></div>
        <div id="ai-speaker"></div>
      </div>

      <section className="onboard-total-ct">
        <div className="logo-ct">
          <div className="eulji-logo"> <img src={eulji} alt="eulji logo" /> </div>
          <div className="middle-line"><p> </p></div>
          <div className="kiosk-logo"> <img src={drinklogo} alt="drink logo" /> </div>
        </div>

        <div className="kiosk-title">EU AI 음성 키오스크 </div>
        <p className="kiosk-eng"> Ai Voice Kiosk </p>
        <p className="click"> 클릭하여 주문하세요. </p>
        <p className="kiosk-solution"> 주문 방식을 선택해주세요</p>

        <div className="order-method-ct">
          <section className="Take-out-ct" onClick={handleOrderTypeClick}>
            <div className="tt">
              <div className="takeout-img">🛍️</div>
            </div>
            <p className="takeout"> 포장 </p>
            <p className="takeout-sub"> Take out</p>
          </section>

          <section className="Dine-in-ct" onClick={handleOrderTypeClick}>
            <div className="tt2">
              <div className="dinein-img">🪑</div>
            </div>
            <p className="pack"> 매장 </p>
            <p className="pack-sub"> Dine in</p>
          </section>
        </div>
      </section>
    </div>
  );
}

export default Onboarding;
