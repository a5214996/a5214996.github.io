// =============================================================================
// freeze-frame.js
//
// Covers the <video> with the last good frame while the player recovers,
// so viewers see a still picture instead of a black screen.
//
// Standalone: no dependency on Shaka or on your recovery code.
//
// API (global):
//   FreezeFrame.attach(video, options?)   call once, after the <video> exists
//   FreezeFrame.freeze()                  call when recovery starts
//   FreezeFrame.unfreeze()                call when playback has resumed
//
// options (all optional):
//   intervalMs  how often a frame is captured while playing   (default 1000)
//   maxWidth    snapshots are downscaled to this width        (default 960)
// =============================================================================
(function () {
  'use strict';

  var video = null;
  var cfg = { intervalMs: 1000, maxWidth: 960 };

  var scratch = document.createElement('canvas');
  var scratchCtx = scratch.getContext('2d');
  var tiny = document.createElement('canvas');            // used to detect black frames
  tiny.width = 8;
  tiny.height = 8;
  var tinyCtx = tiny.getContext('2d', { willReadFrequently: true });
  var snap = document.createElement('canvas');            // last good frame
  var snapCtx = snap.getContext('2d');

  var hasSnap = false;
  var loggedOk = false;
  var timer = null;
  var coverEl = null;                                     // canvas currently covering the video

  function isBlack(canvas) {
    tinyCtx.drawImage(canvas, 0, 0, 8, 8);
    var px = tinyCtx.getImageData(0, 0, 8, 8).data;
    var sum = 0;
    for (var i = 0; i < px.length; i += 4) {
      sum += (px[i] + px[i + 1] + px[i + 2]) / 3;
    }
    return sum / 64 < 4;
  }

  // Captured BEFORE any failure: once the pipeline is destroyed the element can't be drawn.
  function takeSnapshot() {
    try {
      if (coverEl || !video || video.paused || video.readyState < 2 || !video.videoWidth) return;

      var scale = Math.min(1, cfg.maxWidth / video.videoWidth);
      var w = Math.round(video.videoWidth * scale);
      var h = Math.round(video.videoHeight * scale);
      scratch.width = w;
      scratch.height = h;
      scratchCtx.drawImage(video, 0, 0, w, h);
      if (isBlack(scratch)) return;                       // never overwrite a good frame with black

      snap.width = w;
      snap.height = h;
      snapCtx.drawImage(scratch, 0, 0);
      hasSnap = true;
      if (!loggedOk) {
        loggedOk = true;
        console.log('[freeze] snapshots working', w + 'x' + h);
      }
    } catch (e) { /* cosmetic only, never break playback */ }
  }

  function attach(videoEl, options) {
    if (video) return;                                    // already attached
    video = videoEl;
    if (options) {
      if (options.intervalMs) cfg.intervalMs = options.intervalMs;
      if (options.maxWidth) cfg.maxWidth = options.maxWidth;
    }
    timer = setInterval(takeSnapshot, cfg.intervalMs);
  }

  function freeze() {
    try {
      if (!video || !hasSnap || coverEl) return;
      coverEl = document.createElement('canvas');
      coverEl.width = snap.width;
      coverEl.height = snap.height;
      coverEl.getContext('2d').drawImage(snap, 0, 0);
      coverEl.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;' +
        'object-fit:contain;pointer-events:none;';
      // Right after <video>, so Shaka's controls and your text overlay stay on top
      video.insertAdjacentElement('afterend', coverEl);
    } catch (e) { /* ignore */ }
  }

  function unfreeze() {
    if (!coverEl) return;
    var el = coverEl;
    coverEl = null;
    var remove = function () { if (el.parentNode) el.parentNode.removeChild(el); };
    // Wait for a real new frame so there's no black flash
    if (video && video.requestVideoFrameCallback) {
      video.requestVideoFrameCallback(function () { setTimeout(remove, 100); });
    } else {
      setTimeout(remove, 400);
    }
    setTimeout(remove, 3000);                             // safety net (e.g. play() blocked)
  }

  window.FreezeFrame = { attach: attach, freeze: freeze, unfreeze: unfreeze };
})();