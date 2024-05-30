// content.js
<script src="ort/ort.webgpu.min.js"></script>

function getYoutubePlayerElement() {
	const player = document.getElementById('movie_player');
	if (player) {
	  console.log('YouTube player element found:', player);
	  // 원하는 동작 수행
	  // 예: 플레이어의 재생을 멈춤
	  player.pauseVideo();
	} else {
	  console.log('YouTube player element not found.');
	}
  }
  
  // 유튜브 페이지 로드 완료 시 getYoutubePlayerElement 함수 호출
  window.addEventListener('load', getYoutubePlayerElement);
  