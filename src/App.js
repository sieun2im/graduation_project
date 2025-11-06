import './App.css';
import Main from './components/main'
function App() {
    useEffect(() => {
    function openFullscreen() {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { // Safari
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { // IE11
        elem.msRequestFullscreen();
      }
    }

    // 화면 클릭할 때 전체화면 실행
    document.documentElement.addEventListener('click', openFullscreen);

    // 컴포넌트 언마운트 시 이벤트 제거
    return () => {
      document.documentElement.removeEventListener('click', openFullscreen);
    };
  }, []);
  return (
    <div className="app">
      <Main/>
    </div>
  );
}

export default App;