console.log("확장 프로그램 실행됨")

async function fetchAndCache(url) {
	try {
		const cache = await caches.open("onnx");
		let cachedResponse = await cache.match(url);
		if (cachedResponse == undefined) {
			await cache.add(url);
			cachedResponse = await cache.match(url);
			log(`${url} (network)`);
		} else {
			log(`${url} (cached)`);
		}
		const data = await cachedResponse.arrayBuffer();
		return data;
	} catch (error) {
		log(`${url} (network)`);
		return await fetch(url).then(response => response.arrayBuffer());
	}
}

async function loadModels() {
	// ================== RESNET50 ==================
    // const decoderBuffer = await (await fetch('whisper_onnx/resnet50-v2-7.onnx')).arrayBuffer()
	// const decoder = await ort.InferenceSession.create(decoderBuffer, { executionProviders: ["wasm"] });

	// ================== TINY ==================
	// const decoderBuffer = await (await fetch('whisper_onnx/tiny/tiny.en-decoder.int8.onnx')).arrayBuffer()
	// const decoder = await ort.InferenceSession.create(decoderBuffer, { executionProviders: ["wasm"] });

	// const encoderBuffer = await (await fetch('whisper_onnx/tiny/tiny.en-encoder.int8.onnx')).arrayBuffer()
	// const encoder = await ort.InferenceSession.create(encoderBuffer, { executionProviders: ["wasm"] });

	// ================== LARGE-V2 ==================
	const decoderBuffer = await (await fetch('whisper_onnx/large-v2/large-v2-decoder.onnx')).arrayBuffer()
	const decoder = await ort.InferenceSession.create(decoderBuffer, { executionProviders: ["wasm"] });

	const encoderBuffer = await (await fetch('whisper_onnx/large-v2/large-v2-encoder.onnx')).arrayBuffer()
	const encoder = await ort.InferenceSession.create(encoderBuffer, { executionProviders: ["wasm"] });

	console.log("모델 로딩 완료됨")
}
loadModels();
console.log("확장 프로그램 종료")