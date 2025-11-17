import './menuT.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import eulji from '../icons/eulji.png';
import drinklogo from '../icons/beverage-emoji-style.svg';
import springai from '../utils/springai';
import orderStartAudio from '../audio/start.mp3';

function Onboarding({ voiceMode, setVoiceMode }) {
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [_isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const voiceEnabledRef = useRef(false);
  const voiceModeRef = useRef(voiceMode);
  const deviceRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const readingRef = useRef(false);
  
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
        const errorText = await backendResponse.text();
        console.error('백엔드 에러 응답:', errorText);
        throw new Error(`백엔드 응답 에러: ${backendResponse.status}`);
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

  const checkKeywordAndNavigate = (recognizedText) => {
    console.log('🔍 키워드 체크:', recognizedText);
    
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

  // ✅ CH340 초기화 함수 (Baud Rate 설정)
// ✅ CH340 초기화 함수 (완전 버전)
const initCH340 = async (device, baudRate) => {
  try {
    console.log('⚙️ CH340 초기화 시작...');
    
    const requestType = 'vendor';
    const recipient = 'device';
    
    // Baud Rate 계산
    const factor = 1532620800 / baudRate;
    const divisor = Math.floor(factor / 256);
    const subdivisor = Math.floor(factor % 256);
    
    console.log('Baud Rate:', baudRate);
    console.log('Divisor:', divisor, 'Subdivisor:', subdivisor);
    
    // 1. Baud Rate 설정
    await device.controlTransferOut({
      requestType: requestType,
      recipient: recipient,
      request: 0x9a,
      value: 0x1312,
      index: divisor | (subdivisor << 8)
    });
    
    console.log('✅ Baud Rate 설정 완료:', baudRate);
    
    // 2. CH340 초기화
    await device.controlTransferOut({
      requestType: requestType,
      recipient: recipient,
      request: 0xa1,
      value: 0,
      index: 0
    });
    
    console.log('✅ CH340 기본 초기화 완료');
    
    // 3. ✅ DTR/RTS 신호 활성화 (중요!)
    await device.controlTransferOut({
      requestType: requestType,
      recipient: recipient,
      request: 0xa4, // Set Handshake
      value: 0x0101, // DTR=1, RTS=1
      index: 0
    });
    
    console.log('✅ DTR/RTS 신호 활성화');
    
    // 4. ✅ Line Control 설정 (데이터 비트, 정지 비트, 패리티)
    // 8N1: 8 data bits, No parity, 1 stop bit
    await device.controlTransferOut({
      requestType: requestType,
      recipient: recipient,
      request: 0x9a, // Set Line Control
      value: 0xc3,   // 8N1
      index: 0x0008
    });
    
    console.log('✅ Line Control 설정 (8N1)');
    
    // 5. ✅ 대기 시간 (아두이노 재부팅 대기)
    console.log('⏳ 아두이노 재부팅 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    
    console.log('✅ CH340 완전 초기화 완료!');
    
  } catch (error) {
    console.error('❌ CH340 초기화 실패:', error);
    throw error;
  }
};


  // ✅ WebUSB로 아두이노 연결
  const connectArduino = async () => {
    try {
      if (!('usb' in navigator)) {
        alert('❌ WebUSB API를 지원하지 않는 브라우저입니다.\nChrome 브라우저를 사용해주세요.');
        return;
      }

      console.log('🔌 WebUSB로 아두이노 연결 시도...');
      
      const selectedDevice = await navigator.usb.requestDevice({ 
        filters: [
          { vendorId: 0x1a86 }, // CH340
          { vendorId: 0x0403 }, // FTDI
          { vendorId: 0x10c4 }, // CP210x
          { vendorId: 0x2341 }, // Arduino 정품
          { vendorId: 0x2a03 }  // Arduino 정품
        ]
      });

      console.log('✅ USB 장치 선택됨:', selectedDevice);
      console.log('장치 정보:', {
        vendorId: '0x' + selectedDevice.vendorId.toString(16),
        productId: '0x' + selectedDevice.productId.toString(16)
      });
      
      // 장치가 이미 열려있으면 닫기
      if (selectedDevice.opened) {
        console.log('⚠️ 장치가 이미 열려있음, 먼저 닫기...');
        await selectedDevice.close();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 장치 열기
      await selectedDevice.open();
      console.log('✅ 장치 열기 성공');
      
      // Configuration 선택
      if (selectedDevice.configuration === null) {
        await selectedDevice.selectConfiguration(1);
        console.log('✅ Configuration 1 선택됨');
      }
      
      // Interface claim
      let interfaceClaimed = false;
      for (const interfaceNumber of [0, 1, 2]) {
        try {
          await selectedDevice.claimInterface(interfaceNumber);
          console.log(`✅ Interface ${interfaceNumber} Claim 성공!`);
          interfaceClaimed = true;
          break;
        } catch (error) {
          console.warn(`⚠️ Interface ${interfaceNumber} Claim 실패`);
        }
      }
      
      if (!interfaceClaimed) {
        throw new Error('Interface Claim 실패');
      }
      
      // ✅ CH340 초기화 (Baud Rate 9600 설정)
      await initCH340(selectedDevice, 9600);
      
      console.log('✅ 아두이노 WebUSB 연결 성공!');
      
      setDevice(selectedDevice);
      deviceRef.current = selectedDevice;
      setIsConnected(true);
      
      // 데이터 읽기 시작
      readArduinoData(selectedDevice);

    } catch (error) {
      console.error('❌ 아두이노 연결 실패:', error);
      
      if (error.name === 'NotFoundError') {
        alert('USB 장치를 선택하지 않았습니다.');
      } else if (error.name === 'NetworkError') {
        alert('USB 장치가 다른 앱에서 사용 중입니다!\n\nUSB Serial Console 앱을 완전히 종료하고 다시 시도해주세요.');
      } else {
        alert('아두이노 연결 실패:\n' + error.message);
      }
    }
  };

  const disconnectArduino = async () => {
    try {
      readingRef.current = false;
      
      if (deviceRef.current) {
        await deviceRef.current.close();
      }
      
      setDevice(null);
      deviceRef.current = null;
      setIsConnected(false);
      
      console.log('✅ 아두이노 연결 해제 완료');
    } catch (error) {
      console.error('아두이노 연결 해제 실패:', error);
    }
  };

  // ✅ WebUSB로 데이터 읽기 (수정됨)
  const readArduinoData = async (selectedDevice) => {
    readingRef.current = true;
    
    try {
      console.log('📡 아두이노 데이터 수신 시작...');
      
      const endpointNumber = 2; // CH340 IN endpoint
      
      // ✅ 버퍼 초기화 (부분 데이터 처리용)
      let buffer = '';
      
      while (readingRef.current && deviceRef.current) {
        try {
          const result = await selectedDevice.transferIn(endpointNumber, 64);
          
          if (result.data && result.data.byteLength > 0) {
            // ✅ UTF-8 디코딩
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(result.data);
            
            // ✅ 버퍼에 추가
            buffer += text;
            
            // ✅ 줄바꿈으로 분리
            const lines = buffer.split('\n');
            
            // 마지막 불완전한 라인은 버퍼에 보관
            buffer = lines.pop() || '';
            
            // 완전한 라인들만 처리
            for (const line of lines) {
              const data = line.replace(/\r/g, '').trim(); // \r 제거
              
              if (data.length > 0) {
                console.log('📡 수신 데이터:', data);
                
                if (data.toUpperCase().includes('USER_DETECT')) {
                  console.log(`🎉 사용자 감지됨!`);
                  
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
          
        } catch (readError) {
          if (readError.name === 'NetworkError') {
            console.log('📡 연결 끊김, 재연결 시도...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw readError;
          }
        }
      }
    } catch (error) {
      console.error('📡 시리얼 읽기 중 오류:', error);
      setIsConnected(false);
      readingRef.current = false;
    }
  };

  useEffect(() => {
    const autoConnect = async () => {
      try {
        if ('usb' in navigator) {
          const devices = await navigator.usb.getDevices();

          if (devices.length > 0) {
            const selectedDevice = devices[0];
            
            await selectedDevice.open();
            if (selectedDevice.configuration === null) {
              await selectedDevice.selectConfiguration(1);
            }
            await selectedDevice.claimInterface(0);
            
            // ✅ 자동 연결 시에도 CH340 초기화
            await initCH340(selectedDevice, 9600);
            
            setDevice(selectedDevice);
            deviceRef.current = selectedDevice;
            setIsConnected(true);
            readArduinoData(selectedDevice);
            
            console.log('✅ 아두이노 자동 재연결 성공!');
          }
        }
      } catch (error) {
        console.log('자동 연결 실패:', error.message);
      }
    };

    autoConnect();

    return () => {
      stopVoiceRecording();
      readingRef.current = false;
      if (deviceRef.current) {
        deviceRef.current.close().catch(console.error);
      }
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
            아두이노 연결됨 (WebUSB)
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
            🔌 아두이노 수동 연결 (WebUSB)
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
