console.log("확장 프로그램 실행됨")

model = "large-v2"
model_dir = "whisper_onnx/" + model

async function fetchDataFunction(filename) {
	const arryData = await fetch(model_dir + '/' + filename)
		.then(response => response.arrayBuffer());
	return arryData
}

async function loadModels(externalData) {
	// ================== RESNET50 ==================
    // const decoderBuffer = await (await fetch('whisper_onnx/resnet50-v2-7.onnx')).arrayBuffer()
	// const decoder = await ort.InferenceSession.create(decoderBuffer, { executionProviders: ["wasm"] });

	// ================== TINY ==================
	// const decoderBuffer = await (await fetch('whisper_onnx/tiny/tiny.en-decoder.int8.onnx')).arrayBuffer()
	// const decoder = await ort.InferenceSession.create(decoderBuffer, { executionProviders: ["wasm"] });

	// const encoderBuffer = await (await fetch('whisper_onnx/tiny/tiny.en-encoder.int8.onnx')).arrayBuffer()
	// const encoder = await ort.InferenceSession.create(encoderBuffer, { executionProviders: ["wasm"] });

	// ================== LARGE-V2 ==================
	const opt = {
		executionProviders: ["wasm"],
		externalData: externalData
	};

	console.log(opt)

	const decoderBuffer = await (await fetch(model_dir + '/large-v2-decoder.onnx')).arrayBuffer()
	const decoder = await ort.InferenceSession.create(decoderBuffer, opt);

	// const encoderBuffer = await (await fetch('whisper_onnx/large-v2/large-v2-encoder.onnx')).arrayBuffer()
	// const encoder = await ort.InferenceSession.create(encoderBuffer, { executionProviders: ["wasm"] });

	console.log("모델 로딩 완료됨")
}

fetch('whisper_onnx/' + model + '.txt')
    .then(response => response.text())
    .then(text => {
        const lines = text.trim().split('\r\n');
        const externalData = lines.map(line => ({
            data: fetchDataFunction(line),
            path: line
        }));
        loadModels(externalData);
    })
    .catch(error => console.error('filelist.txt를 불러오는 중 오류가 발생했습니다.', error));

console.log("확장 프로그램 종료")