let encoder, decoder;

const extractFeaturesFromAudio = async (audioData, sampleRate) => {
    if (sampleRate !== 16000) {
        audioData = resampleAudio(audioData, sampleRate, 16000); // 16kHz로 리샘플링
    }

    // 멜 스펙트로그램 계산
    const frameSize = 800; // 25ms
    const hopSize = 320; // 10ms
    const nfft = 1024;
    const melBins = 80;

    const melSpectrogram = [];
    for (let i = 0; i + frameSize < audioData.length; i += hopSize) {
        const frame = audioData.slice(i, i + frameSize);
        const fft = new FFT(nfft);
        const spectrum = fft.forward(frame);
        const melSpectrum = melFilterBank(spectrum, sampleRate, nfft, melBins);
        melSpectrogram.push(melSpectrum);
    }

    const features = torch.tensor(melSpectrogram).transpose(0, 1).unsqueeze(0);

    // 패딩 및 크기 조정
    const targetLength = 3000;
    if (features.shape[2] > targetLength) {
        features = features.slice(0, 0, targetLength - 50).padEnd(50, 0);
    } else {
        features = features.padEnd(targetLength, 0);
    }

    return features;
}

function readFileAsArrayBuffer(file) {
    console.log(file)
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function resampleAudio(audioData, srcRate, targetRate) {
    const ratio = targetRate / srcRate;
    const newLength = Math.round(audioData.length * ratio);
    const newData = new Float32Array(newLength);

    let accumulator = 0;
    let srcIndex = 0;
    let dstIndex = 0;

    while (dstIndex < newLength) {
        const nextSrcIndex = Math.floor(((dstIndex + 1) * srcRate) / targetRate);
        const weightSum = nextSrcIndex - srcIndex;

        for (let i = srcIndex; i < nextSrcIndex; i++) {
            const weight = 1 - (i - srcIndex) / weightSum;
            accumulator += audioData[i] * weight;
        }

        newData[dstIndex] = accumulator;
        accumulator = 0;
        srcIndex = nextSrcIndex;
        dstIndex++;
    }

    return newData;
}

function melFilterBank(spectrum, sampleRate, nfft, melBins) {
    // 멜 필터뱅크 로직 구현
    return melSpectrum;
}

// 인코더 모델 실행 
const runEncoder = async (features) => {
    const n_layer_cross_k = encoder.run(features, encoder.outputNames[0]);
    const n_layer_cross_v = encoder.run(features, encoder.outputNames[1]);

    return [n_layer_cross_k, n_layer_cross_v];
}

// 디코더 모델 실행
const runDecoder = async (tokens, encoder, decoder) => {
    // 캐시 초기화
    const [n_layer_self_k_cache, n_layer_self_v_cache] = getInitialCache(decoder);

    let offset = 0;
    let results = [];

    while (true) {
        const [logits, n_layer_self_k_cache, n_layer_self_v_cache] = decoder.run([
            decoder.outputNames[0],
            decoder.outputNames[1],
            decoder.outputNames[2]
        ], {
            tokens,
            n_layer_self_k_cache,
            n_layer_self_v_cache,
            n_layer_cross_k,
            n_layer_cross_v,
            offset
        });

        offset += tokens.length;

        const maxTokenId = getMaxTokenId(logits, decoder);
        results.push(maxTokenId);

        if (maxTokenId === decoder.eotToken) {
            break;
        }

        tokens = [maxTokenId];
    }

    return results;
}

// 언어 감지 (다국어 모델의 경우)
const detectLanguage = async (encoder, decoder) => {
    // 특징 추출
    const dummyFeatures = await extractDummyFeatures();

    const [n_layer_cross_k, n_layer_cross_v] = await runEncoder(dummyFeatures, encoder);

    // 언어 토큰 확인하여 언어 감지
    const langTokens = getAllLanguageTokens(decoder);
    const langLogits = decoder.run(decoder.startSequence, n_layer_cross_k, n_layer_cross_v);

    const detectedLangId = getMaxValueIndex(langLogits, langTokens);

    return decoder.getLangFromId(detectedLangId);
}

// 모델 실행 및 출력 렌더링
const transcribe = async (audioBuffer, sampleRate, isMultilingual) => {
    const features = await extractFeaturesFromAudio(audioBuffer, sampleRate);

    const [n_layer_cross_k, n_layer_cross_v] = await runEncoder(features, encoder);

    let language;
    if (isMultilingual) {
        language = await detectLanguage(encoder, decoder);
    }

    const tokens = await runDecoder(getInitialSequence(decoder, language), encoder, decoder);

    const text = decodeTokens(tokens, decoder.tokenTable);

    renderOutput(text);
}

async function loadModels() {
	model = "medium.en"
	model_dir = "whisper_onnx/" + model

	const opt = {
		executionProviders: ["wasm"]
	};

	// ================== TINY ==================
	const encoderBuffer = await (await fetch(model_dir + '/' + model + '-encoder.int8.onnx')).arrayBuffer()
	encoder = await ort.InferenceSession.create(encoderBuffer, opt);

	const decoderBuffer = await (await fetch(model_dir + '/' + model + '-decoder.int8.onnx')).arrayBuffer()
	decoder = await ort.InferenceSession.create(decoderBuffer, opt);
	
	console.log("모델 로딩 완료됨")
}

var reader = new FileReader();
reader.onload = function(e) {
    audioContext.decodeAudioData(e.target.result, function(audioData) {
        let audio;
        if (audioData.numberOfChannels === 2) {
            const SCALING_FACTOR = Math.sqrt(2);

            let left = audioData.getChannelData(0);
            let right = audioData.getChannelData(1);

            audio = new Float32Array(left.length);
            for (let i = 0; i < audioData.length; ++i) {
                audio[i] = SCALING_FACTOR * (left[i] + right[i]) / 2;
            }
        } else {
            // If the audio is not stereo, we can just use the first channel:
            audio = audioData.getChannelData(0);
        }
        console.log("오디오 로딩 완료")

        transcribe(audio, audioData.sampleRate, true)
    }, function(e) {
        console.log("오디오 파일 분석 중 오류 발생:", e);
    });
};

var audioContext = new (window.AudioContext || window.webkitAudioContext)();

document.getElementById('audioUpload').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }

    reader.readAsArrayBuffer(file);
});

loadModels()