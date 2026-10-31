/**
 * @file audioVisualizer.js
 * Real-Time Canvas Audio Visualizer for Moodify.
 *
 * Renders glowing audio spectrum bars synced to playback and active mood palette.
 */

import { audioPlayer } from './audioPlayer.js';

export class AudioVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.animationId = null;
    this.isRunning = false;
    this.primaryColor = '#67D5F5';
    this.secondaryColor = '#A78BFA';
    this.bufferLength = 32;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  setColors(primary, secondary) {
    this.primaryColor = primary;
    this.secondaryColor = secondary;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._render();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  _render() {
    if (!this.isRunning) return;

    const analyser = audioPlayer.getAnalyser();
    const isPlaying = audioPlayer.isPlaying;

    if (analyser && isPlaying) {
      analyser.getByteFrequencyData(this.dataArray);
    } else {
      // Idle resting wave
      for (let i = 0; i < this.bufferLength; i++) {
        this.dataArray[i] = isPlaying ? 40 + Math.sin(Date.now() * 0.005 + i * 0.3) * 30 : 6;
      }
    }

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    const barCount = 28;
    const barSpacing = 3;
    const totalSpacing = (barCount - 1) * barSpacing;
    const barWidth = (w - totalSpacing) / barCount;

    for (let i = 0; i < barCount; i++) {
      const dataIdx = Math.floor((i / barCount) * this.dataArray.length);
      const val = this.dataArray[dataIdx] || 0;
      const barHeight = Math.max(3, (val / 255) * h * 0.92);
      const x = i * (barWidth + barSpacing);
      const y = h - barHeight;

      const grad = this.ctx.createLinearGradient(0, h, 0, y);
      grad.addColorStop(0, this.primaryColor);
      grad.addColorStop(1, this.secondaryColor);

      this.ctx.fillStyle = grad;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = this.primaryColor;

      // Rounded top bars
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      this.ctx.fill();
    }

    this.ctx.shadowBlur = 0; // reset
    this.animationId = requestAnimationFrame(() => this._render());
  }
}
