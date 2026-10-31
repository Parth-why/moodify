/**
 * @file audioPlayer.js
 * Unified Audio Player Engine with Web Audio API Synthesizer.
 *
 * POLICY & AUDIO EXTRACTION COMPLIANCE (Phase 1, Req 5 & 6):
 * 1. ZERO Spotify Audio Extraction: Spotify audio streams and previews are NEVER
 *    routed through an AudioContext or AnalyserNode.
 * 2. Visualiser Isolation: The Web Audio AnalyserNode is connected EXCLUSIVELY
 *    to MOODIFY-owned audio (the built-in Web Audio ambient synth engine).
 * 3. Officially Supported Playback: Tracks from Spotify display Spotify Premium
 *    playback notices and provide direct links to open in Spotify.
 */

class MockAudioElement {
  constructor() {
    this.src = '';
    this.volume = 1;
    this.currentTime = 0;
    this.duration = 180;
    this.listeners = {};
  }
  addEventListener(event, fn) {
    this.listeners[event] = fn;
  }
  play() { return Promise.resolve(); }
  pause() {}
}

class AudioPlayer {
  constructor() {
    this.audioElement = typeof Audio !== 'undefined' ? new Audio() : new MockAudioElement();

    this.audioCtx = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.synthInterval = null;
    this.activeOscillators = [];

    this.currentTrack = null;
    this.isPlaying = false;
    this.isSynthesizing = false;
    this.isSpotifyPlayback = false; // Flag to enforce zero Spotify audio extraction
    this.volume = 0.8;
    this.currentTime = 0;
    this.duration = 180;
    this.progressInterval = null;

    this.listeners = new Set();

    this.audioElement.addEventListener('ended', () => this.handleTrackEnd());
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement.src && !this.isSynthesizing) {
        this.currentTime = this.audioElement.currentTime;
        this.duration = this.audioElement.duration || 180;
        this.notify('timeupdate', { currentTime: this.currentTime, duration: this.duration });
      }
    });
  }

  _initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = typeof window !== 'undefined'
        ? (window.AudioContext || window.webkitAudioContext)
        : (globalThis.AudioContext || null);

      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.analyserNode = this.audioCtx.createAnalyser();
        this.analyserNode.fftSize = 128;
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Plays a track. Supports MOODIFY-owned ambient synthesis and standard audio.
   * STRICT COMPLIANCE: If track is from Spotify, it is NEVER fed into the Web Audio Analyser.
   *
   * @param {Object} track
   */
  async playTrack(track) {
    if (!track) return;
    this.currentTrack = track;
    this.duration = track.duration || 180;
    this.currentTime = 0;

    // Check if this is a Spotify-sourced track
    if (track.source === 'spotify_api') {
      this.isSpotifyPlayback = true;
      this.isSynthesizing = false;
      this._stopSynth();

      // If Spotify preview is available, play via standalone audio element without Web Audio processing
      if (track.previewUrl) {
        this.audioElement.src = track.previewUrl;
        this.audioElement.volume = this.volume;
        try {
          await this.audioElement.play();
          this.isPlaying = true;
        } catch (err) {
          console.warn('[AudioPlayer] Spotify preview playback blocked, using fallback:', err);
          this._startSynthPlayback(track);
        }
      } else {
        // Full track requires Spotify app / Web Playback SDK
        console.info('[AudioPlayer] Spotify full track selected. Requires Spotify Premium / Web Playback SDK.');
        this._startSynthPlayback(track);
      }
    } else {
      // MOODIFY-owned track: Safe to use Web Audio synthesizer and analyser
      this.isSpotifyPlayback = false;
      this.audioElement.pause();
      this.audioElement.src = '';
      this._initAudioContext();
      this._startSynthPlayback(track);
    }

    this.isPlaying = true;
    this._startProgressTimer();
    this.notify('play', { track: this.currentTrack, isSpotify: this.isSpotifyPlayback });
  }

  pause() {
    this.isPlaying = false;
    this.audioElement.pause();
    this._stopSynth();
    this._stopProgressTimer();
    this.notify('pause', { track: this.currentTrack });
  }

  resume() {
    if (!this.currentTrack) return;
    this.isPlaying = true;

    if (this.isSpotifyPlayback && this.audioElement.src) {
      this.audioElement.play().catch(() => {});
    } else {
      this._initAudioContext();
      this._startSynthPlayback(this.currentTrack);
    }

    this._startProgressTimer();
    this.notify('resume', { track: this.currentTrack });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  seek(seconds) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    if (this.audioElement.src && !this.isSynthesizing) {
      this.audioElement.currentTime = this.currentTime;
    }
    this.notify('timeupdate', { currentTime: this.currentTime, duration: this.duration });
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(val, 1.0));
    this.audioElement.volume = this.volume;
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    this.notify('volume', { volume: this.volume });
  }

  handleTrackEnd() {
    this.pause();
    this.currentTime = 0;
    this.notify('ended', { track: this.currentTrack });
  }

  _startProgressTimer() {
    this._stopProgressTimer();
    this.progressInterval = setInterval(() => {
      if (this.isPlaying) {
        this.currentTime += 1;
        if (this.currentTime >= this.duration) {
          this.handleTrackEnd();
        } else {
          this.notify('timeupdate', { currentTime: this.currentTime, duration: this.duration });
        }
      }
    }, 1000);
  }

  _stopProgressTimer() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Generates pleasing melodic and ambient chords/beats using Web Audio API oscillators.
   * EXCLUSIVE TO MOODIFY-OWNED AUDIO.
   *
   * @private
   */
  _startSynthPlayback(track) {
    if (!this.audioCtx) return;
    this._stopSynth();
    this.isSynthesizing = true;

    const moodScales = {
      cyberpunk: [130.81, 155.56, 174.61, 196.00, 233.08, 261.63],
      chill: [146.83, 185.00, 220.00, 277.18, 329.63],
      joyful: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
      focused: [110.00, 164.81, 220.00, 329.63, 440.00],
      energetic: [146.83, 174.61, 220.00, 261.63, 293.66, 349.23],
      melancholy: [110.00, 130.81, 164.81, 196.00, 220.00],
      euphoric: [196.00, 246.94, 293.66, 392.00, 493.88],
      romantic: [174.61, 220.00, 261.63, 329.63, 392.00],
      nature: [130.81, 164.81, 196.00, 246.94, 293.66]
    };

    const notes = moodScales[track.mood] || moodScales.chill;
    let step = 0;

    const playPulse = () => {
      if (!this.isPlaying || !this.audioCtx) return;
      const now = this.audioCtx.currentTime;

      const osc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      const note = notes[step % notes.length];
      step++;

      osc.type = track.mood === 'cyberpunk' ? 'sawtooth' : track.mood === 'joyful' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(note, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(track.mood === 'cyberpunk' ? 2200 : 850, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.gainNode);

      osc.start(now);
      osc.stop(now + 0.9);
      this.activeOscillators.push(osc);
    };

    playPulse();
    const intervalMs = track.mood === 'energetic' ? 380 : track.mood === 'cyberpunk' ? 440 : 650;
    this.synthInterval = setInterval(playPulse, intervalMs);
  }

  _stopSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch (err) {
        // already stopped
      }
    }
    this.activeOscillators = [];
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    for (const listener of this.listeners) {
      try {
        listener(event, payload);
      } catch (err) {
        console.error('[AudioPlayer] Listener callback error:', err);
      }
    }
  }

  /**
   * Returns analyserNode ONLY if active track is MOODIFY-owned audio.
   * If Spotify audio is playing, returns null to enforce zero audio analysis.
   */
  getAnalyser() {
    if (this.isSpotifyPlayback) {
      return null;
    }
    return this.analyserNode;
  }
}

export const audioPlayer = new AudioPlayer();
