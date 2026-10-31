/**
 * @file IMoodSenseService.js
 * Interface contract for MoodSense Vision AI Services (Camera-based facial expression estimation).
 *
 * Any future computer vision model (e.g. MediaPipe FaceMesh, TensorFlow.js Face-API,
 * ONNX Runtime Web, or Edge Vision models) MUST implement this interface.
 *
 * PRIVACY GUARANTEE:
 * Implementations must NEVER persist video streams, raw image frames, facial landmarks,
 * or expression logs. All processing must occur ephemerally in client memory.
 */

/* eslint-disable no-unused-vars */

export class IMoodSenseService {
  /**
   * Starts real-time expression analysis from an HTMLVideoElement.
   *
   * @param {HTMLVideoElement} videoElement - Live video stream element
   * @param {HTMLCanvasElement} [overlayCanvas] - Optional canvas for ephemeral landmark visualization HUD
   * @param {(result: import('../types.js').MoodSenseResult) => void} onUpdate - Callback invoked per analyzed frame/sample
   * @param {Object} [options]
   * @param {number} [options.sampleRateMs=200] - Interval between inference passes (default 200ms)
   * @returns {void}
   */
  startAnalysis(videoElement, overlayCanvas, onUpdate, options = {}) {
    throw new Error('IMoodSenseService.startAnalysis() must be implemented by subclass.');
  }

  /**
   * Halts active analysis immediately, wipes transient overlay canvases, and cancels inference loops.
   *
   * @returns {void}
   */
  stopAnalysis() {
    throw new Error('IMoodSenseService.stopAnalysis() must be implemented by subclass.');
  }

  /**
   * Performs a single one-shot expression estimation on a static image or canvas frame.
   *
   * @param {HTMLCanvasElement | ImageData | HTMLVideoElement} frameSource - Ephemeral frame source
   * @returns {Promise<import('../types.js').MoodSenseResult>}
   */
  async estimateMood(frameSource) {
    throw new Error('IMoodSenseService.estimateMood() must be implemented by subclass.');
  }

  /**
   * Checks whether vision estimation dependencies / camera inputs are supported in this environment.
   *
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error('IMoodSenseService.isAvailable() must be implemented by subclass.');
  }

  /**
   * Returns metadata about the active vision model.
   *
   * @returns {{ provider: string, modelName: string, isSimulated: boolean, version: string }}
   */
  getModelInfo() {
    throw new Error('IMoodSenseService.getModelInfo() must be implemented by subclass.');
  }
}
