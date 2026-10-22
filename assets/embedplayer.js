function guid() {
    function _p8(s) {
      var p = (Math.random().toString(16) + "000000000").substr(2, 8);
      return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
  }

  function onErrorEvent(event) {
    onError(event.detail);
  }

  function onError(error) {
    console.error('Error code', error.code, 'object', error);
  }


  let feeds = [];
  let current = 0;
  let feedMenu = null;

  function parseKeys(k) {
    try {
      while (typeof k === 'string') k = JSON.parse(k);
    } catch (e) {
      return null;
    }
    return k;
  }

  function loadFeeds() {
    try {
      feeds = JSON.parse(sessionStorage.getItem('s')) || [];
    } catch (e) {
      feeds = [];
    }
    if (!Array.isArray(feeds)) feeds = [];
    feeds = feeds.filter((f) => f && f.channel);

    if (!feeds.length) {
      const channel = sessionStorage.getItem('c');
      const keys = parseKeys(sessionStorage.getItem('k'));
      if (channel && keys) feeds = [{ label: 'Feed 1', channel: channel, keys: keys }];
    }

    feeds.forEach((f, n) => {
      f.label = f.label || 'Feed ' + (n + 1);
      f.keys = parseKeys(f.keys) || {};
    });

    const saved = parseInt(sessionStorage.getItem('i'), 10);
    current = saved >= 0 && saved < feeds.length ? saved : 0;
  }

  function loadFeed(player, feed) {
    player.configure({ drm: { clearKeys: feed.keys } });
    return player.load(feed.channel + '&sessionId=' + guid());
  }

  async function switchFeed(i) {
    const player = window.player;
    if (!player || i === current || !feeds[i]) return;

    const previous = current;
    current = i;
    sessionStorage.setItem('i', String(i));
    if (feedMenu) feedMenu.refresh();

    try {
      await loadFeed(player, feeds[i]);
    } catch (error) {
      // a newer switch interrupting this load is not a failure
      if (error && error.code === shaka.util.Error.Code.LOAD_INTERRUPTED) return;
      onError(error);
      current = previous;
      sessionStorage.setItem('i', String(previous));
      if (feedMenu) feedMenu.refresh();
    }
  }


  // Shaka 5.x expects SVG path data (24x24 viewBox) here, not a Material Icons name.
  // This is the Material "live_tv" icon.
  const FEED_ICON_PATH = 'M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.11-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z';

  class FeedSelection extends shaka.ui.SettingsMenu {
    constructor(parent, controls) {
      super(parent, controls, FEED_ICON_PATH);
      this.button.classList.add('feed-selection-button');
      this.menu.classList.add('feed-selection');
      this.button.setAttribute('aria-label', 'Feed');
      this.nameSpan.textContent = 'Feed';
      this.backSpan.textContent = 'Feed';
      feedMenu = this;
      this.refresh();
    }

    refresh() {

      this.button.classList.toggle('shaka-hidden', feeds.length < 2);
      this.currentSelection.textContent = feeds[current] ? feeds[current].label : '';

      const back = this.menu.querySelector('.shaka-back-to-overflow-button');
      Array.from(this.menu.children).forEach((c) => {
        if (c !== back) c.remove();
      });

      feeds.forEach((feed, i) => {
        const item = document.createElement('button');
        item.setAttribute('aria-selected', String(i === current));
        const label = document.createElement('span');
        label.textContent = (i === current ? '✓ ' : '') + feed.label;
        item.appendChild(label);
        item.addEventListener('click', () => switchFeed(i));
        this.menu.appendChild(item);
      });
    }
  }

  FeedSelection.Factory = class {
    create(rootElement, controls) {
      return new FeedSelection(rootElement, controls);
    }
  };

  shaka.ui.OverflowMenu.registerElement('feed', new FeedSelection.Factory());

  // ---------------------------------------------------------------------------

  async function initPlayer() {
    loadFeeds(); 

    const video = document.getElementById('video');
    const container = document.querySelector('.video-container');
    // Create the player first, then attach the media element (passing the element
    // to the Player constructor is deprecated).
    const player = new shaka.Player();
    await player.attach(video);
    const ui = new shaka.ui.Overlay(player, container, video);
    const controls = ui.getControls();

    window.player = player;
    window.ui = ui;

    // Audio re-sync after ad splices (defined in /assets/audio-resync.js)
    if (typeof initAudioResync === 'function') {
      initAudioResync(video, player);
    } else {
      console.warn('audio-resync.js is not loaded; skipping audio re-sync');
    }

    ui.configure({
      castReceiverAppId: '07AEE832',
      controlPanelElements: [
        'play_pause', 'mute', 'volume', 'time_and_duration', 'spacer',
		 'overflow_menu', 'cast', 'fullscreen'
      ],
      overflowMenuButtons: ['feed', 'quality', 'captions', 'language']
    });

    shaka.polyfill.installAll();
    player.addEventListener('error', onErrorEvent);
    controls.addEventListener('error', onErrorEvent);

    if (feeds.length) {
      player.configure({
        abr: {
          enabled: true
        },
        manifest: {
          disableThumbnails: true
        }
      });

	  // Loading
      try {
        await loadFeed(player, feeds[current]);
      } catch (error) {
        onError(error);
      }
    } else {
      console.error('No valid video data found in sessionStorage.');
    }
  }

  if (window.top.location.hostname === window.location.hostname) {
    document.addEventListener('shaka-ui-loaded', initPlayer);
  }