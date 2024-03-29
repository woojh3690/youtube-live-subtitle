console.log("확장 프로그램 실행됨")

model = "medium.en"
model_dir = "whisper_onnx/" + model

async function loadModels() {

	const opt = {
		executionProviders: ["wasm"]
	};

	// ================== TINY ==================
	const decoderBuffer = await (await fetch(model_dir + '/' + model + '-decoder.int8.onnx')).arrayBuffer()
	const decoder = await ort.InferenceSession.create(decoderBuffer, opt);

	const encoderBuffer = await (await fetch(model_dir + '/' + model + '-encoder.int8.onnx')).arrayBuffer()
	const encoder = await ort.InferenceSession.create(encoderBuffer, opt);
	
	console.log("모델 로딩 완료됨")
}

loadModels()

console.log("확장 프로그램 종료")