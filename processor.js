class AudioProcessor extends AudioWorkletProcessor {
	constructor(options) {
		super(options);
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];  // 첫 번째 입력 포트
		const output = outputs[0];  // 첫 번째 출력 포트

		if (input.length > 0) {
			// 모든 채널을 그대로 출력으로 복사
			for (let channel = 0; channel < input.length; channel++) {
				const inputChannel = input[channel];
				const outputChannel = output[channel];

				// 입력 데이터를 출력으로 복사합니다.
				for (let i = 0; i < inputChannel.length; i++) {
					outputChannel[i] = inputChannel[i];
				}
			}

			// 첫번째 채널만 가지고 오디오 전사
			const inputChannel = input[0];

			if (inputChannel.some(sample => sample !== 0)) {
				this.port.postMessage(inputChannel);
			}
		}

		return true;
	}
}

registerProcessor('audio-processor', AudioProcessor);
