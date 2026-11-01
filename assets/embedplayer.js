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

const FEED_ICON_PATH = 'M158 -802h368a138 138 0 0 1 138 138v368a138 138 0 0 1 -138 138h-368a138 138 0 0 1 -138 -138v-368a138 138 0 0 1 138 -138ZM158 -710a46 46 0 0 0 -46 46v368a46 46 0 0 0 46 46h368a46 46 0 0 0 46 -46v-368a46 46 0 0 0 -46 -46ZM572 -572A46 46 0 0 1 597.3 -613.4L806.6 -718A92 92 0 0 1 940 -635.2V-324.8A92 92 0 0 1 806.6 -242L597.3 -346.6A46 46 0 0 1 572 -388ZM664 -416.8L848 -324.8V-635.2L664 -543.2Z';

class FeedSelection extends shaka.ui.SettingsMenu {
  constructor(parent, controls) {
    super(parent, controls, FEED_ICON_PATH);
    this.button.classList.add('feed-selection-button', 'shaka-tooltip');
    this.menu.classList.add('feed-selection');
    this.button.setAttribute('aria-label', 'Feeds');

    const back = this.menu.querySelector('.shaka-back-to-overflow-button');
    if (back) back.style.display = 'none';

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
      label.textContent = feed.label + (i === current ? ' ✓' : '');
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

shaka.ui.Controls.registerElement('feed', new FeedSelection.Factory());

  // ---------------------------------------------------------------------------

  async function initPlayer() {
    loadFeeds(); 

    const video = document.getElementById('video');
    const container = document.querySelector('.video-container');

    const player = new shaka.Player();
    await player.attach(video);
    const ui = new shaka.ui.Overlay(player, container, video);
    const controls = ui.getControls();

    window.player = player;
    window.ui = ui;

    // Audio re-sync after ad splices
    if (typeof initAudioResync === 'function') {
      initAudioResync(video, player);
    } else {
      console.warn('audio-resync.js is not loaded; skipping audio re-sync');
    }

    ui.configure({
      castReceiverAppId: '07AEE832',
      controlPanelElements: [
        'play_pause', 'mute', 'volume', 'time_and_duration', 'spacer',
		 'feed', 'overflow_menu', 'cast', 'fullscreen'
      ],
      overflowMenuButtons: ['quality', 'captions', 'language']
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

      try {
        await loadFeed(player, feeds[current]);
        console.log('The video has now been loaded!');
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