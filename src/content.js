console.log("yt-live-sub.js started")

document.addEventListener('DOMContentLoaded', function () {
    const xpath = "//*[@id='movie_player']/div[1]/video";
    let video = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (video) {
        const processedAudioChunks = new Set(); // 처리된 오디오 청크의 시작 시간을 저장할 Set

        function formatTime(time) {
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        function checkBuffer() {
            const chunkDuration = 5; // 청크 단위 (초)
            if (video.buffered.length > 0) {
                // 전체 버퍼 범위를 순회
                for (let i = 0; i < video.buffered.length; i++) {
                    const start = video.buffered.start(i);
                    const end = video.buffered.end(i);

                    // 현재 버퍼 구간 내에서 5초 단위 청크를 확인
                    for (let chunkStart = start; chunkStart + chunkDuration <= end; chunkStart += chunkDuration) {
                        // 청크의 시작 시간을 5초 단위로 정규화
                        const normalizedChunkStart = Math.floor(chunkStart / chunkDuration) * chunkDuration;
                        if (!processedAudioChunks.has(normalizedChunkStart)) {
                            // 처리되지 않은 새로운 청크를 처리
                            processedAudioChunks.add(normalizedChunkStart);
                            console.log(`Processed new audio chunk: ${formatTime(normalizedChunkStart)} ~ ${formatTime(normalizedChunkStart + chunkDuration)}`);
                        }
                    }
                }
            }
        }

        setInterval(checkBuffer, 1000);
    } else {
        console.log("Video element not found.");
    }
});
