import './menuT.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import eulji from '../icons/eulji.png';
import drinklogo from '../icons/beverage-emoji-style.svg';
import springai from '../utils/springai';
import orderStartAudio from '../audio/start.mp3';

function Onboarding({ voiceMode, setVoiceMode }) {
  const navigate = useNavigate();
  const [port, setPort] = useState(null); // ✅ device → port
  const [isConnected, setIsConnected] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [_isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const voiceEnabledRef = useRef(false);
  const voiceModeRef = useRef(voiceMode);
  const portRef = useRef(null); // ✅ deviceRef → portRef
  const audioPlayerRef = useRef(null);
  const readerRef = useRef(null); // ✅ 추가
  
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
    
    audio.onended = () => {
      console.log('[audio] "주문시작" 음성 재생 종료');
      
      if (!voiceModeRef.current) {
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
      const response = await fetch(orderStartAudio);
      const audioBlob = await response.blob();
      
      let fileToSend = audioBlob;
      
      if (!audioBlob.type || !audioBlob.type.includes('audio')) {
        fileToSend = new Blob([audioBlob], { type: 'audio/mpeg' });
      }
      
      const file = new File([fileToSend], 'order-start.mp3', { 
        type: 'audio/mpeg',
        lastModified: Date.now()
      });

      const formData = new FormData();
      formData.append('question', file);

      const backendResponse = await fetch(`${API_BASE_URL}/api/ai/chat-voice`, {
        method: 'POST',
        body: formData,
      });

      if (!backendResponse.ok) {
        throw new Error(`백엔드 응답 에러: ${backendResponse.status}`);
      }

      const audioPlayer = audioPlayerRef.current;
      
      audioPlayer.addEventListener('ended', () => {
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

  const checkKeywordAndNavigate = (recognizedText) => {
    const keywords = ['포장', '테이크아웃', 'take out', '매장', '먹고', 'dine in', '여기서'];
    
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

    if (!voiceModeRef.current) {
      return;
    }

    const recognizedText = springai.voice.lastRecognizedText || '';

    const shouldNavigate = checkKeywordAndNavigate(recognizedText);
    if (shouldNavigate) {
      return;
    }

    if (mp3Blob.size < 5000) {
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

      const response = await fetch(`${API_BASE_URL}/api/ai/chat-voice`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`백엔드 응답 에러: ${response.status}`);
      }
      
      springai.voice.controlSpeakerAnimation('ai-speaker', true);

      const audioPlayer = audioPlayerRef.current;
      
      audioPlayer.addEventListener('ended', () => {
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

  // ✅ Web Serial API로 아두이노 연결
  const connectArduino = async () => {
    try {
      if (!('serial' in navigator)) {
        alert('❌ Web Serial API를 지원하지 않는 브라우저입니다.\nChrome 브라우저를 사용해주세요.');
        return;
      }

      console.log('🔌 Web Serial API로 아두이노 연결 시도...');
      
      // ✅ 모든 장치 표시
      const selectedPort = await navigator.serial.requestPort({ 
        filters: []
      });

      console.log('✅ 포트 선택됨');
      
      // ✅ 9600 baud로 열기
      await selectedPort.open({ baudRate: 9600 });
      console.log('✅ 포트 열림 (9600 baud)');

      setPort(selectedPort);
      portRef.current = selectedPort;
      setIsConnected(true);
      
      // 데이터 읽기 시작
      readArduinoData(selectedPort);
      
      console.log('✅ 아두이노 연결 성공!');

    } catch (error) {
      console.error('아두이노 연결 실패:', error);
      
      if (error.name === 'NotFoundError') {
        alert('포트를 선택하지 않았습니다.');
      } else {
        alert('아두이노 연결 실패: ' + error.message);
      }
    }
  };

  const disconnectArduino = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      
      if (portRef.current) {
        await portRef.current.close();
      }
      
      setPort(null);
      portRef.current = null;
      setIsConnected(false);
      
      console.log('✅ 아두이노 연결 해제 완료');
    } catch (error) {
      console.error('아두이노 연결 해제 실패:', error);
    }
  };

  // ✅ Web Serial API로 데이터 읽기
  const readArduinoData = async (selectedPort) => {
    try {
      console.log('📡 아두이노 데이터 수신 시작...');
      
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
            
            if (data.includes('USER_DETECTED')) {
              console.log(`🎉 사용자 감지됨!`);
              
              if (userDetectedRef.current) {
                continue;
              }
              
              if (!isSpeakingRef.current && voiceEnabledRef.current) {
                playWelcomeMessage();
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
            portRef.current = selectedPort;
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
      if (portRef.current) portRef.current.close().catch(console.error);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            아두이노 연결됨 (Web Serial)
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
