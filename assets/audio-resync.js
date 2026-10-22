// ---------------------------------------------------------------------------
  // Audio re-sync after ad splices
  // ---------------------------------------------------------------------------
  // On some PCs the audio ends up late after an ad break, and a seek to the current
  // time makes the browser re-sync its audio renderer (confirmed by hand). Ad splices
  // show up in the playlist as runs of segments whose EXTINF is not the usual length,
  // so find where each run ends and re-sync just after playback passes it.
  // Run window.resyncAudio() in the console to do it by hand.
  const RESYNC_DELAY_MS = 1500;   // let the post-splice audio reach the renderer first
  let spliceTimes = [];           // presentation times (s) where a run of odd-length segments ends
  let resyncing = false;

  function fadeVolume(to, ms, done) {
    const from = video.volume;
    const steps = 5;
    let i = 0;
    const id = setInterval(() => {
      i++;
      video.volume = from + (to - from) * i / steps;
      if (i >= steps) {
        clearInterval(id);
        if (done) done();
      }
    }, ms / steps);
  }

  function resyncAudio(reason) {
    if (resyncing || video.paused || video.seeking || video.readyState < 3) return;
    console.log('[resync]', reason || 'manual', 'at', video.currentTime.toFixed(2));
    // The seek restarts the audio output, which clicks if it lands mid-sound:
    // fade out, seek, fade back in. Nothing to fade if already muted.
    const original = video.volume;
    if (video.muted || original === 0) {
      video.currentTime = video.currentTime;
      return;
    }
    resyncing = true;
    fadeVolume(0, 60, () => {
      video.currentTime = video.currentTime;
      setTimeout(() => {
        fadeVolume(original, 120, () => { resyncing = false; });
      }, 150);
    });
  }
  window.resyncAudio = resyncAudio;

  function findSplices(text) {
    // The time base is only known for playlists that start at media sequence 0 (EVENT)
    if (!/#EXT-X-MEDIA-SEQUENCE:0\s/.test(text)) return;
    const durations = [];
    const re = /#EXTINF:([\d.]+)/g;
    let m;
    while ((m = re.exec(text))) durations.push(parseFloat(m[1]));
    if (durations.length < 3) return;

    const counts = {};
    for (const d of durations) {
      const k = d.toFixed(3);
      counts[k] = (counts[k] || 0) + 1;
    }
    const usual = parseFloat(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]);

    const found = [];
    let t = 0;
    let odd = false;
    durations.forEach((d, i) => {
      const isOdd = i > 0 && Math.abs(d - usual) > 0.02;   // the first segment is a partial one
      if (odd && !isOdd) found.push(t);                    // t is the end of the previous, odd, segment
      t += d;
      odd = isOdd;
    });
    spliceTimes = found;
    spliceTimes.playlistSeconds = t;
  }

  try {
    player.getNetworkingEngine().registerResponseFilter((type, response) => {
      if (type !== shaka.net.NetworkingEngine.RequestType.MANIFEST) return;
      try {
        const text = new TextDecoder().decode(response.data);
        if (text.includes('#EXTINF')) findSplices(text);
      } catch (e) {
        console.warn('[resync] playlist scan failed', e);
      }
    });
  } catch (e) {
    console.warn('[resync] could not hook the playlist responses', e);
  }

  // One-off check that the playlist timeline lines up with the player's: these two
  // numbers should be within a few tens of seconds of each other.
  player.addEventListener('loaded', () => {
    setTimeout(() => {
      console.log('[resync]', spliceTimes.length, 'splices found; playlist',
                  (spliceTimes.playlistSeconds || 0).toFixed(1), 's, seekRange.end',
                  player.seekRange().end.toFixed(1), 's');
    }, 3000);
  });

  let lastPlayheadTime = 0;
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    if (t > lastPlayheadTime && t - lastPlayheadTime < 2) {   // normal playback, not a seek
      for (const s of spliceTimes) {
        if (lastPlayheadTime < s && t >= s) {
          setTimeout(() => resyncAudio('after splice at ' + s.toFixed(1)), RESYNC_DELAY_MS);
          break;
        }
      }
    }
    lastPlayheadTime = t;
  });
  
  const RESYNC_DELAY_MS = 1500;   // let the post-splice audio reach the renderer first
  let spliceTimes = [];           // presentation times (s) where a run of odd-length segments ends
  let resyncing = false;

  function fadeVolume(to, ms, done) {
    const from = video.volume;
    const steps = 5;
    let i = 0;
    const id = setInterval(() => {
      i++;
      video.volume = from + (to - from) * i / steps;
      if (i >= steps) {
        clearInterval(id);
        if (done) done();
      }
    }, ms / steps);
  }

  function resyncAudio(reason) {
    if (resyncing || video.paused || video.seeking || video.readyState < 3) return;
    console.log('[resync]', reason || 'manual', 'at', video.currentTime.toFixed(2));
    // The seek restarts the audio output, which clicks if it lands mid-sound:
    // fade out, seek, fade back in. Nothing to fade if already muted.
    const original = video.volume;
    if (video.muted || original === 0) {
      video.currentTime = video.currentTime;
      return;
    }
    resyncing = true;
    fadeVolume(0, 60, () => {
      video.currentTime = video.currentTime;
      setTimeout(() => {
        fadeVolume(original, 120, () => { resyncing = false; });
      }, 150);
    });
  }
  window.resyncAudio = resyncAudio;

  function findSplices(text) {
    // The time base is only known for playlists that start at media sequence 0 (EVENT)
    if (!/#EXT-X-MEDIA-SEQUENCE:0\s/.test(text)) return;
    const durations = [];
    const re = /#EXTINF:([\d.]+)/g;
    let m;
    while ((m = re.exec(text))) durations.push(parseFloat(m[1]));
    if (durations.length < 3) return;

    const counts = {};
    for (const d of durations) {
      const k = d.toFixed(3);
      counts[k] = (counts[k] || 0) + 1;
    }
    const usual = parseFloat(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]);

    const found = [];
    let t = 0;
    let odd = false;
    durations.forEach((d, i) => {
      const isOdd = i > 0 && Math.abs(d - usual) > 0.02;   // the first segment is a partial one
      if (odd && !isOdd) found.push(t);                    // t is the end of the previous, odd, segment
      t += d;
      odd = isOdd;
    });
    spliceTimes = found;
    spliceTimes.playlistSeconds = t;
  }

  try {
    player.getNetworkingEngine().registerResponseFilter((type, response) => {
      if (type !== shaka.net.NetworkingEngine.RequestType.MANIFEST) return;
      try {
        const text = new TextDecoder().decode(response.data);
        if (text.includes('#EXTINF')) findSplices(text);
      } catch (e) {
        console.warn('[resync] playlist scan failed', e);
      }
    });
  } catch (e) {
    console.warn('[resync] could not hook the playlist responses', e);
  }

  // One-off check that the playlist timeline lines up with the player's: these two
  // numbers should be within a few tens of seconds of each other.
  player.addEventListener('loaded', () => {
    setTimeout(() => {
      console.log('[resync]', spliceTimes.length, 'splices found; playlist',
                  (spliceTimes.playlistSeconds || 0).toFixed(1), 's, seekRange.end',
                  player.seekRange().end.toFixed(1), 's');
    }, 3000);
  });

  let lastPlayheadTime = 0;
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    if (t > lastPlayheadTime && t - lastPlayheadTime < 2) {   // normal playback, not a seek
      for (const s of spliceTimes) {
        if (lastPlayheadTime < s && t >= s) {
          setTimeout(() => resyncAudio('after splice at ' + s.toFixed(1)), RESYNC_DELAY_MS);
          break;
        }
      }
    }
    lastPlayheadTime = t;
  });