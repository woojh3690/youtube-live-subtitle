async function getYoutubePlayerElement() {
    // 유튜브 비디오 요소를 가져옵니다.
    const xpath = "//*[@id='movie_player']/div[1]/video";
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const videoElement = result.singleNodeValue;

    if (videoElement) {
        console.log('YouTube player element found:', videoElement);
    } else {
        console.log('YouTube player element not found.');
        return;
    }

    // 유튜브 비디오 컨트롤 바에 새로운 버튼 추가
    addTranscribeButton(videoElement);
}

function addTranscribeButton(videoElement) {
    const controls = document.querySelector('.ytp-right-controls');
    if (!controls) return;

    const button = document.createElement('button');
    button.innerHTML = 'Transcribe';
    button.style.cursor = 'pointer';
    button.className = 'ytp-button';
	button.onclick = () => {
        console.log('Transcribe button clicked');
        initAudioContext(videoElement);
    };
    controls.insertBefore(button, controls.firstChild);
}

async function initAudioContext(videoElement) {
    try {
        console.log('Initializing AudioContext...');
        if (!(videoElement instanceof HTMLVideoElement)) {
            throw new Error('Provided element is not an HTMLVideoElement');
        }

        // 오디오 컨텍스트를 생성합니다.
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext created:', audioContext);

        console.log('Creating MediaElementSource...');
        const sourceNode = audioContext.createMediaElementSource(videoElement);
        console.log('MediaElementSource created:', sourceNode);

        // AudioWorklet을 로드합니다.
        console.log('Loading AudioWorklet module...');
        await audioContext.audioWorklet.addModule(chrome.runtime.getURL('processor.js'));
        console.log('AudioWorklet module loaded');

        // AudioWorkletNode를 생성합니다.
        console.log('Creating AudioWorkletNode...');
        const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
        console.log('AudioWorkletNode created:', audioWorkletNode);

        sourceNode.connect(audioWorkletNode).connect(audioContext.destination);
        console.log('Audio nodes connected');

        // 오디오 데이터 처리를 위한 이벤트 리스너를 추가합니다.
        audioWorkletNode.port.onmessage = (event) => {
            const audioData = event.data;
            chrome.runtime.sendMessage({ action: 'processAudio', audioData: audioData });
        };

        console.log('AudioContext initialized');
    } catch (error) {
        console.error('Error initializing AudioContext:', error);
    }
}

// 유튜브 페이지 로드 완료 시 getYoutubePlayerElement 함수 호출
const observer = new MutationObserver(() => {
    if (document.readyState === 'complete') {
        getYoutubePlayerElement();
        observer.disconnect();
    }
});

observer.observe(document, { childList: true, subtree: true });
