const CONFIG_URL = new URL("video.json", window.parent.location.href).href;

    const API_HOST = "api.angelthump.com";
    const EDGES = {
      ams: "ams1.angelthump.com",
      fra: "fra1.angelthump.com",
      nyc: "nyc1.angelthump.com",
      sfo: "sfo1.angelthump.com",
      sgp: "sgp1.angelthump.com",
    };
    const REGIONS = [
      ["sfo", "San Francisco"],
      ["nyc", "New York"],
      ["ams", "Amsterdam"],
      ["fra", "Frankfurt"],
      ["sgp", "Singapore"],
    ];

    const stage = document.getElementById("stage");
    const video = document.getElementById("player");
    const statusEl = document.getElementById("status");
    let player = null;
    let sessionId = null;
    window.currentRegion = "";

    // ---- Server entry in Shaka's overflow (⋮) menu ----------------------
    const SERVER_ICON =
      "M160-160v-240h640v240H160ZM240-240h80v-80h-80v80ZM160-560v-240h640v240H160ZM240-640h80v-80h-80v80Z";

    class ServerMenu extends shaka.ui.SettingsMenu {
      constructor(parent, controls) {
        super(parent, controls, SERVER_ICON);
        this.button.classList.add("server-button");
        this.menu.classList.add("server-menu");

        this.items_ = new Map();
        for (const [region, label] of REGIONS) {
          const button = document.createElement("button");
          button.type = "button";
          const span = document.createElement("span");
          span.textContent = `${region.toUpperCase()} · ${label}`;
          button.appendChild(span);
          this.menu.appendChild(button);
          this.items_.set(region, { button });
          this.eventManager.listen(button, "click", () => this.choose_(region));
        }

        this.eventManager.listen(document, "server-changed", () => this.refresh_());
        this.updateLocalizedStrings();
        this.refresh_();
      }

      updateLocalizedStrings() {
        this.button.ariaLabel = "Server";
        this.nameSpan.textContent = "Server";
        this.backSpan.textContent = "Server";
        this.backButton.ariaLabel = "Back";
      }

      choose_(region) {
        window.playRegion(region);
        if (typeof this.controls.hideSettingsMenus === "function") {
          this.controls.hideSettingsMenus();
        }
      }

      refresh_() {
        const current = window.currentRegion;
        this.button.style.display = current ? "" : "none"; // hidden until the stream is online
        for (const [region, { button }] of this.items_) {
          if (region === current) button.setAttribute("aria-selected", "true");
          else button.removeAttribute("aria-selected");
        }
        this.currentSelection.textContent = current ? current.toUpperCase() : "";
      }
    }

    ServerMenu.Factory = class {
      create(rootElement, controls) {
        return new ServerMenu(rootElement, controls);
      }
    };
    shaka.ui.OverflowMenu.registerElement("server", new ServerMenu.Factory());

    // ---- Stream lookup ---------------------------------------------------
    async function loadChannel() {
      const res = await fetch(CONFIG_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`video.json returned ${res.status}`);
      const config = await res.json();
      const channel = String(config.channel || "").trim().toLowerCase();
      if (!/^[a-z0-9_]{1,32}$/.test(channel)) throw new Error("Bad channel in video.json");
      return channel;
    }

    async function findSessionId(channel) {
      const res = await fetch(
        `https://${API_HOST}/v3/streams?username=${encodeURIComponent(channel)}`
      );
      if (!res.ok) throw new Error(`Lookup returned ${res.status}`);
      const streams = await res.json();
      const stream = streams.find((s) => s.type === "live");
      if (!stream) return null;
      const username = stream.user.username;
      return `${btoa(stream.createdAt + username)}_${username}`;
    }

    // ---- Playback --------------------------------------------------------
    function startPlayback() {
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }

    async function playRegion(region) {
      if (!sessionId || !EDGES[region]) return;
      window.currentRegion = region;
      localStorage.setItem("region", region);
      document.dispatchEvent(new Event("server-changed"));
      statusEl.textContent = "";

      const url = `https://${EDGES[region]}/hls/${sessionId}/index.m3u8`;
      try {
        await player.load(url);
        startPlayback();
      } catch (err) {
        if (err && err.code === shaka.util.Error.Code.LOAD_INTERRUPTED) return; // switched again
        console.error("Load failed", err);
        statusEl.textContent = `${region.toUpperCase()} failed — try another server`;
      }
    }
    window.playRegion = playRegion;

    // ---- Refresh when a stream that WAS playing goes offline --------------
	const MAX_REFRESHES = 20;
	let refreshCount = 0;

	function callRefreshVideo() {
	  if (refreshCount >= MAX_REFRESHES) return;
		if (typeof refreshVideo === "function") {
		  refreshCount++;
		  return refreshVideo();
		}
		if (window.parent && typeof window.parent.refreshVideo === "function") {
		  refreshCount++;
		  return window.parent.refreshVideo();
		}
	}

    // ---- Startup ---------------------------------------------------------
    async function main() {
      shaka.polyfill.installAll();
      if (!shaka.Player.isBrowserSupported()) {
        statusEl.textContent = "This browser can't play this stream.";
        return;
      }

      player = new shaka.Player();
      await player.attach(video);

      const ui = new shaka.ui.Overlay(player, stage, video);
      ui.configure({
        castReceiverAppId: "07AEE832",
        controlPanelElements: [
          "play_pause", "mute", "volume", "time_and_duration", "spacer",
          "overflow_menu", "cast", "fullscreen"
        ],
		overflowMenuButtons: ["server"]
      });
	let wasPlaying = false;
	video.addEventListener("playing", () => { wasPlaying = true; });
	player.addEventListener("error", (e) => {
	  console.error("Player error", e.detail);
	  if (!wasPlaying || (e.detail && e.detail.code === shaka.util.Error.Code.LOAD_INTERRUPTED)) return;
	  wasPlaying = false;
	  callRefreshVideo();
	});

      let channel;
      try {
        channel = await loadChannel();
      } catch {
        statusEl.textContent = "Couldn't read video.json.";
        return;
      }

      try {
        sessionId = await findSessionId(channel);
      } catch {
        statusEl.textContent = "Couldn't reach the stream service.";
        return;
      }
      if (!sessionId) {
        statusEl.textContent = "Stream not found. Refresh to look again";
        return;
      }

      const saved = localStorage.getItem("region");
      playRegion(EDGES[saved] ? saved : "sfo");
    }

    window.addEventListener("DOMContentLoaded", main);