import './menuT.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import eulji from '../icons/eulji.png';
import drinklogo from '../icons/beverage-emoji-style.svg';
import springai from '../utils/springai';
// ✅ 녹음한 "주문시작" 파일 import
import orderStartAudio from '../audio/start.mp3';

function Onboarding({ voiceMode, setVoiceMode }) {
  const navigate = useNavigate();
  const [port, setPort] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const voiceEnabledRef = useRef(false);
  const voiceModeRef = useRef(voiceMode);
  const readerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  
  const [userDetected, setUserDetected] = useState(false);
  const userDetectedRef = useRef(false);

  const API_BASE_URL = 'https://54-116-8-71.nip.io';

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
        
        if (error.name === 'NotAllowedError') {
          alert('마이크 권한이 거부되었습니다.\n브라우저 설정에서 마이크 권한을 허용해주세요.');
        } else if (error.name === 'NotFoundError') {
          alert('마이크를 찾을 수 없습니다.');
        } else {
          alert('마이크 접근 중 오류가 발생했습니다.\nHTTPS 연결인지 확인해주세요.');
        }
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

    // ✅ 녹음한 "주문시작" 파일 재생
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
      
      // ✅ 녹음 파일을 백엔드로 전송
      sendPreRecordedVoiceToBackend();
    };
    
    audio.onerror = (e) => {
      console.error('[audio] 음성 재생 오류:', e);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      
      // 오류 시 바로 마이크 시작
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

  // ✅ 녹음된 "주문시작" 파일을 백엔드로 전송
const sendPreRecordedVoiceToBackend = async () => {
  try {
    console.log('📤 녹음된 "주문시작" 파일을 백엔드로 전송 중...');
    
    const response = await fetch(orderStartAudio);
    const audioBlob = await response.blob();
    
    console.log('📊 원본 파일 크기:', audioBlob.size, 'bytes');
    console.log('📊 원본 파일 타입:', audioBlob.type);
    
    // ✅ 파일 타입 명시적으로 설정
    let fileToSend = audioBlob;
    
    // 파일 타입이 없거나 잘못된 경우 수정
    if (!audioBlob.type || audioBlob.type === '' || !audioBlob.type.includes('audio')) {
      console.warn('⚠️ 파일 타입이 없거나 잘못됨, audio/mpeg로 변환');
      fileToSend = new Blob([audioBlob], { type: 'audio/mpeg' });
      console.log('📊 변환된 타입:', fileToSend.type);
    }
    
    // ✅ File 객체로 변환 (더 명확한 파일 정보 제공)
    const file = new File([fileToSend], 'order-start.mp3', { 
      type: 'audio/mpeg',
      lastModified: Date.now()
    });
    
    console.log('📊 전송할 파일 정보:');
    console.log('  - 이름:', file.name);
    console.log('  - 크기:', file.size, 'bytes');
    console.log('  - 타입:', file.type);
    console.log('  - 수정일:', new Date(file.lastModified).toLocaleString());

    const formData = new FormData();
    // ✅ File 객체로 전송
    formData.append('question', file);

    console.log('📤 백엔드로 전송 중...');
    const backendResponse = await fetch(`${API_BASE_URL}/api/ai/chat-voice`, {
      method: 'POST',
      body: formData,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('백엔드 에러 응답:', errorText);
      throw new Error(`백엔드 응답 에러: ${backendResponse.status}`);
    }

    console.log('✅ 백엔드 응답 수신');
    console.log('응답 Content-Type:', backendResponse.headers.get('content-type'));

    const audioPlayer = audioPlayerRef.current;
    
    audioPlayer.addEventListener('ended', () => {
      console.log('🔊 백엔드 AI 음성 재생 완료');
      setIsSpeaking(false);
      isSpeakingRef.current = false;

      if (voiceModeRef.current) {
        startMicRecording();
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
    console.log('📊 파일 크기:', mp3Blob.size, 'bytes');

    if (!voiceModeRef.current) {
      console.log('🔇 음성 모드 비활성화 - 음성 처리 중단');
      return;
    }

    if (mp3Blob.size < 5000) {
      console.warn('⚠️ 음성이 너무 짧습니다. 다시 말씀해주세요.');
      setTimeout(() => {
        if (voiceModeRef.current) {
          startMicRecording();
        }
      }, 1000);
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
        const errorText = await response.text();
        console.error('백엔드 에러 응답:', errorText);
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
      
      alert('백엔드 서버와 통신 중 오류가 발생했습니다.');
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
              
              if (userDetectedRef.current) {
                console.log('[readArduinoData] 이미 사용자 감지됨 - 추가 감지 무시');
                continue;
              }
              
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

    return () => {
      stopVoiceRecording();
      if (readerRef.current) readerRef.current.cancel().catch(console.error);
      if (port) port.close().catch(console.error);
    };
  }, []);

  return (
    <div className="mmaaiinn">
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
            아두이노 연결됨
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
            🔌 아두이노 수동 연결
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
