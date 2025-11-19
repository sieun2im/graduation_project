import './menuT.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import eulji from '../icons/eulji.png';
import drinklogo from '../icons/beverage-emoji-style.svg';
import springai from '../utils/springai';
import orderStartAudio from '../audio/start.mp3';

function Onboarding({ voiceMode, setVoiceMode }) {
  const navigate = useNavigate();
  
  // ✅ WebSocket 상태
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  
const [isListening, setIsListening] = useState(false);  // 음성 인식 중
  const [_isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const voiceEnabledRef = useRef(false);
  const voiceModeRef = useRef(voiceMode);
  const audioPlayerRef = useRef(null);
  
  const [userDetected, setUserDetected] = useState(false);
  const userDetectedRef = useRef(false);

// 환경 자동 감지
const API_BASE_URL = 'https://54-116-8-71.nip.io';
const ARDUINO_WS_URL = 'ws://10.205.113.235:8080';

  useEffect(() => {
    voiceModeRef.current = voiceMode;
    
    if (!voiceMode) {
      console.log('🔇 음성 모드 비활성화 - 음성 인식 중지');
      stopVoiceRecording();
    }
  }, [voiceMode]);

  const handleOrderTypeClick = () => {
    navigate('/main');
  };

  const enableVoice = async () => {
    if (!voiceEnabledRef.current) {
      try {
        console.log('🎤 마이크 권한 요청 시작');
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ 마이크 권한 획득 성공');
        stream.getTracks().forEach(track => track.stop());
        
        const utterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(utterance);
        
        setVoiceEnabled(true);
        voiceEnabledRef.current = true;
        console.log('✅ 음성 및 마이크 권한 활성화 완료');
        
        setTimeout(() => {
          enterFullscreen();
        }, 500);
        
      } catch (error) {
        console.error('❌ 마이크 권한 오류:', error);
        alert('마이크 권한을 허용해주세요.');
      }
    }
  };

  const enterFullscreen = () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      console.log('📺 전체화면 전환 완료');
    } catch (error) {
      console.error('전체화면 전환 오류:', error);
    }
  };

  const playWelcomeMessage = () => {
    console.log('=== playWelcomeMessage 호출됨 ===');
    
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

    setUserDetected(true);
    userDetectedRef.current = true;
    console.log('✅ 사용자 최초 감지 - 추가 감지 비활성화');

    console.log('[playWelcomeMessage] 음성 재생 시작');
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    const audio = new Audio(orderStartAudio);
    audio.volume = 1.0;
    
    audio.onplay = () => {
      console.log('🔊 "주문시작" 오디오 재생 시작');
    };
    
    audio.onended = () => {
      console.log('[audio] "주문시작" 음성 재생 종료');
      
      if (!voiceModeRef.current) {
        console.log('🔇 음성 모드 비활성화됨 - 백엔드 호출 중단');
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        return;
      }
      
      sendPreRecordedVoiceToBackend();
    };
    
    audio.onerror = (e) => {
      console.error('[audio] 음성 재생 오류:', e);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      
      if (voiceModeRef.current) {
        startMicRecording();
      }
    };

    audio.play().catch(err => {
      console.error('❌ 오디오 재생 실패:', err);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    });
  };

  const sendPreRecordedVoiceToBackend = async () => {
    try {
      console.log('📤 녹음된 "주문시작" 파일을 백엔드로 전송 중...');
      
      const response = await fetch(orderStartAudio);
      const audioBlob = await response.blob();
      
      let fileToSend = audioBlob;
      
      if (!audioBlob.type || audioBlob.type === '' || !audioBlob.type.includes('audio')) {
        console.warn('⚠️ 파일 타입이 없거나 잘못됨, audio/mpeg로 변환');
        fileToSend = new Blob([audioBlob], { type: 'audio/mpeg' });
      }
      
      const file = new File([fileToSend], 'order-start.mp3', { 
        type: 'audio/mpeg',
        lastModified: Date.now()
      });

      const formData = new FormData();
      formData.append('question', file);

      console.log('📤 백엔드로 전송 중...');
      const backendResponse = await fetch(`${API_BASE_URL}/api/ai/chat-voice`, {
        method: 'POST',
        body: formData,
      });

      if (!backendResponse.ok) {
        throw new Error(`백엔드 응답 에러: ${backendResponse.status}`);
      }

      console.log('✅ 백엔드 응답 수신');

      const audioPlayer = audioPlayerRef.current;
      
audioPlayer.addEventListener('ended', () => {
  console.log('🔊 백엔드 AI 음성 재생 완료');
  setIsSpeaking(false);
  isSpeakingRef.current = false;

  if (voiceModeRef.current) {
    setTimeout(() => {
      startMicRecording();
    }, 2000);  // ✅ 2초 대기 추가
  }
}, { once: true });

      await springai.voice.playAudioFormStreamingData(backendResponse, audioPlayer);

    } catch (error) {
      console.error('❌ 초기 음성 전송 오류:', error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      
      if (voiceModeRef.current) {
        startMicRecording();
      }
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
  
  // ✅ 음성 재생 중이면 마이크 시작 안 함
  if (isSpeakingRef.current) {
    console.log('🔇 음성 재생 중 - 마이크 시작 대기');
    return;
  }
  
  console.log('🎤 음성 인식 마이크 시작');
   setIsListening(true);  // ✅ 추가
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

  const checkKeywordAndNavigate = (recognizedText) => {
    console.log('🔍 키워드 체크:', recognizedText);
    
    const keywords = ['포장', '매장'];
    
    const foundKeyword = keywords.some(keyword => 
      recognizedText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (foundKeyword) {
      console.log('✅ 키워드 감지! Main 페이지로 이동합니다.');
      stopVoiceRecording();
      setTimeout(() => {
        navigate('/main');
      }, 1000);
      return true;
    }
    
    return false;
  };

  const handleVoice = async (mp3Blob) => {
    springai.voice.controlSpeakerAnimation('user-speaker', false);
      setIsListening(false);  // ✅ 추가
    console.log('🎤 사용자 음성 수신:', mp3Blob);

    if (!voiceModeRef.current) {
      console.log('🔇 음성 모드 비활성화 - 음성 처리 중단');
      return;
    }

    const recognizedText = springai.voice.lastRecognizedText || '';
    console.log('📝 인식된 텍스트:', recognizedText);

    const shouldNavigate = checkKeywordAndNavigate(recognizedText);
    if (shouldNavigate) {
      return;
    }

if (mp3Blob.size < 5000) {
  console.warn('⚠️ 음성이 너무 짧습니다. 다시 말씀해주세요.');
  setTimeout(() => {
    if (voiceModeRef.current) {
      startMicRecording();
    }
  }, 3000);  // ✅ 1000 → 3000 (3초 대기)
  return;
}


    setIsSpeaking(true);
    isSpeakingRef.current = true;

    try {
      const formData = new FormData();
      formData.append('question', mp3Blob, 'user-speech.mp3');

      console.log('📤 백엔드로 음성 전송 중...');
      const response = await fetch(`${API_BASE_URL}/api/ai/chat-voice`, {
        method: 'POST',
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
    }, 2000);  // ✅ 1000 → 2000 (2초 대기)
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

  // ✅ WebSocket으로 아두이노 연결
  const connectArduino = () => {
    try {
      console.log('🔌 WebSocket 연결 시도:', ARDUINO_WS_URL);
      
      const socket = new WebSocket(ARDUINO_WS_URL);
      
      socket.onopen = () => {
        console.log('✅ 아두이노 WebSocket 연결 성공!');
        setIsConnected(true);
      };
      
      socket.onmessage = (event) => {
        const data = event.data;
        console.log('📡 아두이노 데이터:', data);
        
        // 연결 확인 메시지 무시
        if (data === 'CONNECTED') {
          console.log('✅ 서버 연결 확인');
          return;
        }
        
        if (data.includes('USER_DETECTED')) {
          console.log('🎉 사용자 감지!');
          
          if (userDetectedRef.current) {
            console.log('이미 감지됨 - 무시');
            return;
          }
          
          if (!isSpeakingRef.current && voiceEnabledRef.current) {
            playWelcomeMessage();
          }
        }
      };
      
      socket.onerror = (error) => {
        console.error('❌ WebSocket 오류:', error);
        alert('아두이노 서버에 연결할 수 없습니다.\n\n확인사항:\n1. PC에서 node server.js 실행 중인가요?\n2. PC와 태블릿이 같은 Wi-Fi에 연결되어 있나요?\n3. ARDUINO_WS_URL의 IP 주소가 맞나요?');
      };
      
      socket.onclose = () => {
        console.log('❌ WebSocket 연결 종료');
        setIsConnected(false);
      };
      
      setWs(socket);
      
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      alert('WebSocket 연결 실패:\n' + error.message);
    }
  };

  const disconnectArduino = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
      console.log('✅ 아두이노 연결 해제');
    }
  };

  useEffect(() => {
    return () => {
      stopVoiceRecording();
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mmaaiinn">
          {isListening && (
      <div className="voice-listening-overlay">
        <div className="voice-listening-content">
          <div className="microphone-icon">🎤</div>
          <p className="listening-text">듣고 있습니다...</p>
          <div className="sound-wave">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    )}
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
            className="voice-activation-btn"
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
            아두이노 연결됨 (WebSocket)
            {userDetected && (
              <span style={{marginLeft: '10px', color: '#4CAF50', fontSize: '14px'}}>
                ✓ 사용자 감지됨
              </span>
            )}
            {!voiceMode && (
              <span style={{marginLeft: '10px', color: '#FF9800', fontSize: '14px'}}>
                🖐️ 터치 모드
              </span>
            )}
            <button className="disconnect-btn arduino-btn" onClick={disconnectArduino} style={{marginLeft: '10px'}}>
              🔌 연결 해제
            </button>
          </div>
        ) : (
          <button className="connect-btn arduino-btn" onClick={connectArduino}>
            🔌 아두이노 연결 (WebSocket)
          </button>
        )}
      </div>

      <audio ref={audioPlayerRef} style={{ display: 'none' }} />

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
