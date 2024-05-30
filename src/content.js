async function getYoutubePlayerElement() {
    // 유튜브 비디오 요소를 가져옵니다.

	const xpath = "//*[@id='movie_player']/div[1]/video";
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
	const videoElement = result.singleNodeValue

	if (videoElement) {
		console.log('YouTube player element found:', videoElement);
	} else {
		console.log('YouTube player element not found.');
		return
	}

    // 오디오 컨텍스트를 생성합니다.
    audioContext = new AudioContext();

    // 유튜브 비디오의 오디오 스트림을 소스로 사용합니다.
    sourceNode = audioContext.createMediaElementSource(videoElement);

    // AudioWorklet을 로드합니다.
    await audioContext.audioWorklet.addModule('processor.js');

    // AudioWorkletNode를 생성합니다.
    audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');

    // 소스 노드를 AudioWorkletNode에 연결하고, 이를 컨텍스트의 출력에 연결합니다.
    sourceNode.connect(audioWorkletNode).connect(audioContext.destination);

    // 오디오 데이터 처리를 위한 이벤트 리스너를 추가합니다.
    audioWorkletNode.port.onmessage = (event) => {
        const audioData = event.data;
        processAudio(audioData);
    };
}

// 유튜브 페이지 로드 완료 시 getYoutubePlayerElement 함수 호출
window.addEventListener('load', getYoutubePlayerElement);
