console.log("확장 프로그램 실행됨")

import * as ort from "./ort/esm/ort.webgpu.min.js";
ort.env.wasm.wasmPaths = "./ort/esm/";
ort.env.wasm.numThreads=1

// import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0-esmtest.20240513-a16cd2bd21/dist/ort.webgpu.min.js";
// ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0-esmtest.20240513-a16cd2bd21/dist/";

ort.env.logLevel = "error";
function log(i) {
    console.log(i)
}

const kSampleRate = 16000;
const kIntervalAudio_ms = 1000;
const kSteps = kSampleRate * 3;
const kDelay = 100;
const kModel = "whisper_onnx/whisper_cpu_int8_cpu-cpu_model.onnx";

// ort session
let sess;

// wrapper around onnxruntime and model
class Whisper {
    constructor(url, cb) {
        ort.env.logLevel = "error";
        this.sess = null;

        // semi constants that we initialize once and pass to every run() call
        this.min_length = Int32Array.from({ length: 1 }, () => 1);
        this.max_length = Int32Array.from({ length: 1 }, () => 448);
        this.num_return_sequences = Int32Array.from({ length: 1 }, () => 1);
        this.length_penalty = Float32Array.from({ length: 1 }, () => 1.);
        this.repetition_penalty = Float32Array.from({ length: 1 }, () => 1.);
        this.attention_mask = Int32Array.from({ length: 1 * 80 * 3000 }, () => 0);

        const opt = {
            executionProviders: ["wasm"],
            logSeverityLevel: 3,
            logVerbosityLevel: 3,
        };
        ort.InferenceSession.create(url, opt).then((s) => {
            this.sess = s;
            cb();
        }, (e) => { cb(e); })
    }

    async run(audio_pcm, beams = 1) {
        // clone semi constants into feed. The clone is needed if we run with ort.env.wasm.proxy=true
        const feed = {
            "audio_pcm": audio_pcm,
            "max_length": new ort.Tensor(new Int32Array(this.max_length), [1]),
            "min_length": new ort.Tensor(new Int32Array(this.min_length), [1]),
            "num_beams": new ort.Tensor(Int32Array.from({ length: 1 }, () => beams), [1]),
            "num_return_sequences": new ort.Tensor(new Int32Array(this.num_return_sequences), [1]),
            "length_penalty": new ort.Tensor(new Float32Array(this.length_penalty), [1]),
            "repetition_penalty": new ort.Tensor(new Float32Array(this.repetition_penalty), [1]),
            // "attention_mask": new ort.Tensor(new Int32Array(this.attention_mask), [1, 80, 3000]),
        }

        return this.sess.run(feed);
    }
}

// ONNX Runtime 초기화 및 모델 로드
log("loading model");
sess = new Whisper(kModel, (e) => {
    if (e === undefined) {
        log(`${kModel} loaded, ${ort.env.wasm.numThreads} threads`);
    } else {
        log(`Error: ${e}`);
    }
});

// audio buffer
let audioBuffer = [];

// process audio buffer
async function processBufferedAudio(audioData) {
    audioBuffer.push(...Object.values(audioData));

    if (audioBuffer.length >= kSteps) {
        const audio = new Float32Array(audioBuffer);

        // run inference for 3 sec
        const ret = await sess.run(new ort.Tensor(audio, [1, audio.length]));
        console.log(`${ret.str.data[0]}\n`)
    }
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'processAudio') {
        const { audioData } = message;
        processBufferedAudio(audioData)
    }
    return true;
});

