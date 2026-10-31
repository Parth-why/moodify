/**
 * @file moodifyCatalog.js
 * MOODIFY Independent Music Library & Curated Catalog.
 *
 * POLICY COMPLIANCE (Spotify Developer Policy Section II):
 * This catalog is independently created and classified by MOODIFY.
 * It contains zero Spotify audio features, zero Spotify-derived models,
 * and zero scraped Spotify content.
 *
 * Tracks utilize synthesized Web Audio tone profiles and licensed/free previews,
 * ensuring MOODIFY's core mood matching functions autonomously without dependency
 * on Spotify content or algorithmic derivation.
 */

import { MoodCategories } from '../ai/types.js';

export const MOODIFY_CATALOG = [
  // CYBERPUNK
  {
    id: 'moodify-cp-1',
    title: 'Neon Skyline Run',
    artist: 'Vector Shift',
    album: 'Synthetic Dreams 2088',
    mood: MoodCategories.CYBERPUNK,
    userMoodTags: ['cyberpunk', 'futuristic', 'night drive'],
    cover: '/albums/cyberpunk.jpg',
    duration: 194,
    source: 'moodify_native',
    audioTone: 'synthwave',
    description: 'Pulsing analog arpeggios, driving kick drums, and dystopian night highways.'
  },
  {
    id: 'moodify-cp-2',
    title: 'Digital Grid Horizon',
    artist: 'Kroma Void',
    album: 'Zero Protocol',
    mood: MoodCategories.CYBERPUNK,
    userMoodTags: ['cyberpunk', 'darksynth', 'electronic'],
    cover: '/albums/cyberpunk.jpg',
    duration: 215,
    source: 'moodify_native',
    audioTone: 'darksynth',
    description: 'High-voltage basslines and atmospheric cyber textures.'
  },

  // CHILL / LO-FI
  {
    id: 'moodify-cl-1',
    title: 'Midnight Coffee Steam',
    artist: 'Aura Bloom',
    album: 'Raindrops & Tape Cassettes',
    mood: MoodCategories.CHILL,
    userMoodTags: ['chill', 'lo-fi', 'study', 'relax'],
    cover: '/albums/lofi.jpg',
    duration: 168,
    source: 'moodify_native',
    audioTone: 'lofi',
    description: 'Warm vinyl crackle, gentle Rhodes electric piano, and mellow hip-hop drums.'
  },
  {
    id: 'moodify-cl-2',
    title: 'Twilight Study Desk',
    artist: 'Quiet Hours',
    album: 'Late Window Silhouettes',
    mood: MoodCategories.CHILL,
    userMoodTags: ['chill', 'ambient', 'focus'],
    cover: '/albums/lofi.jpg',
    duration: 182,
    source: 'moodify_native',
    audioTone: 'lofi',
    description: 'Downtempo beats, soothing acoustic strums, and peaceful rain ambiance.'
  },

  // JOYFUL / POP
  {
    id: 'moodify-jy-1',
    title: 'Golden Horizon Sun',
    artist: 'Solaria',
    album: 'Summer Driftwaves',
    mood: MoodCategories.JOYFUL,
    userMoodTags: ['joyful', 'happy', 'uplifting', 'summer'],
    cover: '/albums/joyful.jpg',
    duration: 204,
    source: 'moodify_native',
    audioTone: 'pop',
    description: 'Uplifting funk bassline, sunny guitar licks, and radiant feel-good brass.'
  },
  {
    id: 'moodify-jy-2',
    title: 'Breeze on Pacific Crest',
    artist: 'Daylight Echo',
    album: 'Radiant Morning',
    mood: MoodCategories.JOYFUL,
    userMoodTags: ['joyful', 'bright', 'morning'],
    cover: '/albums/joyful.jpg',
    duration: 176,
    source: 'moodify_native',
    audioTone: 'pop',
    description: 'Sparkling melodies with infectious handclaps and positive vibes.'
  },

  // FOCUSED / AMBIENT
  {
    id: 'moodify-fc-1',
    title: 'Starlight Celestial Orbit',
    artist: 'Aetheria',
    album: 'Cosmic Meditation Engine',
    mood: MoodCategories.FOCUSED,
    userMoodTags: ['focused', 'ambient', 'coding', 'meditation'],
    cover: '/albums/focus.jpg',
    duration: 240,
    source: 'moodify_native',
    audioTone: 'ambient',
    description: 'Binaural-inspired synth pads, delicate bell harmonics, and steady cerebral flow.'
  },
  {
    id: 'moodify-fc-2',
    title: 'Neural Architecture',
    artist: 'Deep State Labs',
    album: 'Infinite Flow State',
    mood: MoodCategories.FOCUSED,
    userMoodTags: ['focused', 'deep work', 'minimal'],
    cover: '/albums/focus.jpg',
    duration: 260,
    source: 'moodify_native',
    audioTone: 'ambient',
    description: 'Repetitive hypnotic sequencing designed for deep uninterrupted coding sessions.'
  },

  // ENERGETIC / WORKOUT
  {
    id: 'moodify-en-1',
    title: 'Velocity Apex',
    artist: 'HyperDrive',
    album: 'Kinetic Overload',
    mood: MoodCategories.ENERGETIC,
    userMoodTags: ['energetic', 'workout', 'cardio', 'intense'],
    cover: '/albums/cyberpunk.jpg',
    duration: 190,
    source: 'moodify_native',
    audioTone: 'edm',
    description: 'Heavy 4-on-the-floor electro drops, distorted synth leads, and peak workout drive.'
  },

  // MELANCHOLY
  {
    id: 'moodify-ml-1',
    title: 'Velvet Rain on Glass',
    artist: 'Isla Grey',
    album: 'Echoes in the Hallway',
    mood: MoodCategories.MELANCHOLY,
    userMoodTags: ['melancholy', 'sad', 'reflective', 'rain'],
    cover: '/albums/lofi.jpg',
    duration: 210,
    source: 'moodify_native',
    audioTone: 'piano',
    description: 'Intimate felted piano chords, subtle cello swells, and gentle rainy resonance.'
  },

  // EUPHORIC
  {
    id: 'moodify-eu-1',
    title: 'Stardust Festival',
    artist: 'Nova Collective',
    album: 'Anthems for the Infinite',
    mood: MoodCategories.EUPHORIC,
    userMoodTags: ['euphoric', 'festival', 'dance', 'celebration'],
    cover: '/albums/joyful.jpg',
    duration: 228,
    source: 'moodify_native',
    audioTone: 'edm',
    description: 'Massive celebratory chord drops, shimmering vocal chops, and peak mainstage joy.'
  },

  // ROMANTIC
  {
    id: 'moodify-rm-1',
    title: 'Candlelight & Silk',
    artist: 'Julian Vance',
    album: 'Velvet Nocturne',
    mood: MoodCategories.ROMANTIC,
    userMoodTags: ['romantic', 'soul', 'intimate', 'night'],
    cover: '/albums/lofi.jpg',
    duration: 198,
    source: 'moodify_native',
    audioTone: 'lofi',
    description: 'Smooth neo-soul chords, warm muted trumpet, and gentle finger-snaps.'
  },

  // NATURE / ZEN
  {
    id: 'moodify-nt-1',
    title: 'Moss & Whispering Pines',
    artist: 'Komorebi Sanctuary',
    album: 'Forest Bathing Walk',
    mood: MoodCategories.NATURE,
    userMoodTags: ['nature', 'zen', 'organic', 'peaceful'],
    cover: '/albums/focus.jpg',
    duration: 275,
    source: 'moodify_native',
    audioTone: 'ambient',
    description: 'Organic wooden flute, bubbling brook acoustics, and serene morning breeze.'
  }
];
