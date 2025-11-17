// lamejs import 수정

// springai 객체 생성
const springai = {
  voice: {},
  setSpinner: function() {}
};
// ##### 마이크를 활성화하고 소리 분석 도구 및 녹화 도구를 준비를 하는 함수 #####
springai.voice.initMic = async function (handleVoice) {
  //전역 변수 초기화
  springai.voice.voice = false;
  springai.voice.chatting = false;
  springai.voice.silenceStart = null;
  springai.voice.silenceDelay = 800;
  springai.voice.silenceThreshold = 0.06;
  springai.voice.stream = null;
  springai.voice.analyser = null;
  springai.voice.mediaRecorder = null;
  springai.voice.recognition = null;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  springai.voice.stream = stream;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  springai.voice.analyser = audioContext.createAnalyser();
  springai.voice.analyser.fftSize = 2048;
  source.connect(springai.voice.analyser);

  springai.voice.initMediaRecorder(handleVoice);
  springai.voice.initRecognitionVoice();
};

//##### 미디어 녹음기를 초기화하는 함수 #####
springai.voice.initMediaRecorder = function (handleVoice) {
  const mediaRecorder = new MediaRecorder(springai.voice.stream);
  springai.voice.mediaRecorder = mediaRecorder;

  mediaRecorder.ondataavailable = async (event) => {
    if (springai.voice.voice === true && event.data.size > 0 && springai.voice.chatting === false) {
      console.log("대화 시작");
      springai.voice.chatting = true;

      const webmBlob = event.data;
      const mp3Blob = await springai.voice.convertWebMToMP3(webmBlob);
      handleVoice(mp3Blob);
    } else {
      mediaRecorder.start();
      springai.voice.checkSilence();
    }
  };

  console.log("음성 녹화 시작");
  mediaRecorder.start();
  console.log("침묵 감시 시작");
  springai.voice.checkSilence();
};

// ##### 마이크 입력로부터 음성 인식을 하는 함수 #####
springai.voice.initRecognitionVoice = function () {
  springai.voice.voice = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  springai.voice.recognition = recognition;
  recognition.lang = 'ko-KR';
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = function () {};
  
  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    if (transcript.length > 0 && springai.voice.isKorean(transcript)) {
      console.log("한국어 음성 확인");
      springai.voice.voice = true;
    }
  };
  
  recognition.onend = function () {
    if (!springai.voice.voice) {
      recognition.start();
    }
  };

  console.log("음성 인식 시작");
  recognition.start();
};

// ##### 한글이 1개라도 포함되어 있는지 체크하는 함수 #####
springai.voice.isKorean = function (text) {
  const koreanRegex = /[가-힣]/;
  return koreanRegex.test(text);
};

// ##### 침묵이 지속되는지 체크하는 함수 #####
springai.voice.checkSilence = function () {
  const dataArray = new Uint8Array(springai.voice.analyser.fftSize);
  springai.voice.analyser.getByteTimeDomainData(dataArray);
  const normalized = Array.from(dataArray).map(v => v / 128 - 1);
  const rms = Math.sqrt(normalized.reduce((sum, v) => sum + v * v, 0) / normalized.length);

  if (rms < springai.voice.silenceThreshold) {
    if (!springai.voice.silenceStart) {
      springai.voice.silenceStart = Date.now();
    } else if ((Date.now() - springai.voice.silenceStart) > springai.voice.silenceDelay) {
      if (springai.voice.mediaRecorder.state === 'recording') {
        springai.voice.mediaRecorder.stop();
        springai.voice.recognition.stop();
      }
      springai.voice.silenceStart = null;
      return;
    }
  } else {
    springai.voice.silenceStart = null;
  }

  requestAnimationFrame(springai.voice.checkSilence);
};

// ##### WebM Blob을 MP3 Blob으로 변환 #####
springai.voice.convertWebMToMP3 = async function (webmBlob) {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuf = await audioCtx.decodeAudioData(arrayBuffer);

  const float32Data = audioBuf.getChannelData(0);
  const sampleRate = audioBuf.sampleRate;

  // ✅ window.lamejs 사용 (CDN에서 자동으로 전역 변수로 등록됨)
  const mp3Encoder = new window.lamejs.Mp3Encoder(1, sampleRate, 128);
  const samplesPerFrame = 1152;
  let mp3DataChunks = [];

  function floatTo16BitPCM(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  for (let i = 0; i < float32Data.length; i += samplesPerFrame) {
    const sliceF32 = float32Data.subarray(i, i + samplesPerFrame);
    const sliceI16 = floatTo16BitPCM(sliceF32);
    const mp3buf = mp3Encoder.encodeBuffer(sliceI16);
    if (mp3buf.length) mp3DataChunks.push(mp3buf);
  }
  const endBuf = mp3Encoder.flush();
  if (endBuf.length) mp3DataChunks.push(endBuf);

  return new Blob(mp3DataChunks, { type: 'audio/mp3' });
};

// ##### 스트리밍 음성 데이터를 재생하는 함수 #####
springai.voice.playAudioFormStreamingData = async function (response, audioPlayer) {
  try {
    const mediaSource = new MediaSource();
    audioPlayer.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', async () => {
      const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
      const reader = response.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          mediaSource.endOfStream();
          break;
        }
        await new Promise(resolve => {
          sourceBuffer.addEventListener('updateend', resolve, { once: true });
          sourceBuffer.appendBuffer(value);
        });
      }
    });
    audioPlayer.play();
  } catch (error) {
    console.log(error);
  }
};

// ##### 스피커 애니메이션 제어 함수 #####
springai.voice.controlSpeakerAnimation = function (speakerId, flag) {
  const element = document.getElementById(speakerId);
  if (!element) return;
  
  if (flag) {
    element.classList.add("speakerPulse");
  } else {
    element.classList.remove("speakerPulse");
  }
};

// 전역 window 객체에도 등록
window.springai = springai;

export default springai;
