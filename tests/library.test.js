/**
 * @file library.test.js
 * Unit Test Suite for MOODIFY V1.5 Personal Library ("My Universe") & Deduplication.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LibraryService } from '../src/services/library/libraryService.js';

describe('MOODIFY V1.5 Library Engine & Deduplication', () => {
  test('Adds track to library and prevents duplicate additions by ID', async () => {
    const service = new LibraryService();
    service.localTracks = [];

    const trackA = {
      id: 'sp-101',
      providerTrackId: '101',
      title: 'Neon Skyline',
      artist: 'Kavinsky',
      album: 'Outrun',
      duration: 210,
      mood: 'cyberpunk'
    };

    const addedFirst = await service.addTrackToLibrary(trackA, 'playlist-1');
    assert.strictEqual(addedFirst, true);
    assert.strictEqual(service.localTracks.length, 1);

    // Re-adding same providerTrackId should return false and NOT duplicate
    const addedSecond = await service.addTrackToLibrary(trackA, 'playlist-2');
    assert.strictEqual(addedSecond, false);
    assert.strictEqual(service.localTracks.length, 1);
  });

  test('Deduplicates tracks by normalized title::artist composite key', async () => {
    const service = new LibraryService();
    service.localTracks = [];

    const track1 = {
      id: 'sp-orig',
      providerTrackId: 'orig-id',
      title: 'Midnight City',
      artist: 'M83',
      album: 'Hurry Up, We\'re Dreaming',
      duration: 240
    };

    const trackDuplicateDifferentId = {
      id: 'sp-remaster',
      providerTrackId: 'diff-id-remaster',
      title: '  Midnight city  ',
      artist: 'm83',
      album: 'Greatest Hits',
      duration: 240
    };

    await service.addTrackToLibrary(track1);
    const addedDup = await service.addTrackToLibrary(trackDuplicateDifferentId);

    assert.strictEqual(addedDup, false);
    assert.strictEqual(service.localTracks.length, 1);
  });

  test('Maintains multiple playlist source relationships for a single track', async () => {
    const service = new LibraryService();
    service.localTracks = [];
    service.localSources = [];

    const track = {
      id: 'track-shared',
      providerTrackId: 'shared-id',
      title: 'Starboy',
      artist: 'The Weeknd',
      duration: 230
    };

    await service.addTrackToLibrary(track, 'pl-favorites');
    await service.addTrackToLibrary(track, 'pl-workout');

    assert.strictEqual(service.localTracks.length, 1);
    assert.ok(service.localSources.includes('track-shared::pl-favorites'));
    assert.ok(service.localSources.includes('track-shared::pl-workout'));
  });

  test('Sorts library tracks by Title, Artist, and Duration', () => {
    const service = new LibraryService();
    service.localTracks = [
      { id: '1', title: 'Zebra', artist: 'Beach House', duration: 180, addedAt: '2026-10-01' },
      { id: '2', title: 'Alpha', artist: 'Zedd', duration: 300, addedAt: '2026-10-02' },
      { id: '3', title: 'Beta', artist: 'Air', duration: 120, addedAt: '2026-10-03' }
    ];

    const byTitle = service.getLibraryTracks({ sortBy: 'title' });
    assert.strictEqual(byTitle[0].title, 'Alpha');
    assert.strictEqual(byTitle[2].title, 'Zebra');

    const byArtist = service.getLibraryTracks({ sortBy: 'artist' });
    assert.strictEqual(byArtist[0].artist, 'Air');
    assert.strictEqual(byArtist[2].artist, 'Zedd');

    const byDuration = service.getLibraryTracks({ sortBy: 'duration' });
    assert.strictEqual(byDuration[0].duration, 300);
    assert.strictEqual(byDuration[2].duration, 120);
  });

  test('Removes track from library', async () => {
    const service = new LibraryService();
    service.localTracks = [
      { id: 'rem-1', title: 'To Delete', artist: 'Artist' }
    ];

    await service.removeTrack('rem-1');
    assert.strictEqual(service.localTracks.length, 0);
  });

  test('Validates and rejects non-track Spotify links in individual import', async () => {
    const service = new LibraryService();

    // Playlist URL
    await assert.rejects(
      async () => service.importTrackByUrlOrUri('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'),
      /playlist link/
    );

    // Album URL
    await assert.rejects(
      async () => service.importTrackByUrlOrUri('https://open.spotify.com/album/4LH4d3cOWNNXdsqFd4G7By'),
      /album link/
    );

    // Artist URL
    await assert.rejects(
      async () => service.importTrackByUrlOrUri('https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02'),
      /artist link/
    );

    // Invalid URL
    await assert.rejects(
      async () => service.importTrackByUrlOrUri('https://notspotify.com/song/12345'),
      /Invalid Spotify track format/
    );
  });

  test('Phase 4 Scenario: Deduplicates shared track across multiple playlists while preserving both sources', async () => {
    const service = new LibraryService();
    service.localTracks = [];
    service.localSources = [];
    service.localPlaylists = [
      { id: 'pl-A', providerPlaylistId: 'A', name: 'Playlist A' },
      { id: 'pl-B', providerPlaylistId: 'B', name: 'Playlist B' }
    ];

    // Scenario A: Import Playlist A containing Track X
    const trackX = {
      id: 'spotify-track-X',
      providerTrackId: 'track-X-id',
      title: 'Midnight Sun',
      artist: 'Solar Fields',
      album: 'Movements',
      duration: 320
    };
    const addedXA = await service.addTrackToLibrary(trackX, 'A', 'Playlist A');
    assert.strictEqual(addedXA, true);
    assert.strictEqual(service.localTracks.length, 1);

    // Scenario B: Import Playlist B containing Track X and Track Y
    const trackXInPlaylistB = {
      id: 'spotify-track-X',
      providerTrackId: 'track-X-id',
      title: 'Midnight Sun',
      artist: 'Solar Fields',
      album: 'Movements',
      duration: 320
    };
    const trackY = {
      id: 'spotify-track-Y',
      providerTrackId: 'track-Y-id',
      title: 'Starlight',
      artist: 'Muse',
      album: 'Black Holes',
      duration: 240
    };

    const addedXB = await service.addTrackToLibrary(trackXInPlaylistB, 'B', 'Playlist B');
    const addedYB = await service.addTrackToLibrary(trackY, 'B', 'Playlist B');

    // Expected:
    // Track X exists once
    assert.strictEqual(addedXB, false, 'Track X should not be duplicated');
    assert.strictEqual(addedYB, true, 'Track Y is new and should be added');
    assert.strictEqual(service.localTracks.length, 2, 'Total unique tracks must be exactly 2');

    // Track X has two source playlist relationships
    const sourcesX = service.getSourcePlaylistsForTrack('spotify-track-X');
    assert.ok(sourcesX.includes('Playlist A'));
    assert.ok(sourcesX.includes('Playlist B'));

    // Track Y has one source playlist relationship
    const sourcesY = service.getSourcePlaylistsForTrack('spotify-track-Y');
    assert.strictEqual(sourcesY.length, 1);
    assert.ok(sourcesY.includes('Playlist B'));

    // Reimporting Playlist A does not create duplicate tracks or sources
    const reimportedXA = await service.addTrackToLibrary(trackX, 'A', 'Playlist A');
    assert.strictEqual(reimportedXA, false);
    assert.strictEqual(service.localTracks.length, 2);
  });
});
