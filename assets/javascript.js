document.addEventListener("visibilitychange", () => {
  document.title = document.hidden ? "Hot Dudes" : "Do not share";
});

function setVideo(refresh = false) {
  console.log("setVideo called");
  $.getJSON(`video.json?${Date.now()}`, (res) => {
	console.log("getJSON called");
    const v = sessionStorage.getItem('v');
    if (refresh || res.version !== v) {
      setPlayer(res.host, res.channel);
      sessionStorage.setItem('v', res.version || '00');
      if (res?.keys) sessionStorage.setItem('videoData', JSON.stringify(res));
    }
  });
}

function refreshVideo() {
  setVideo(true);
}

function setPlayer(host, channel) {
  const playerType = !host ? "offline" : host;
  $('#video-wrapper').html(getPlayerEmbed(playerType, channel));
}

function getRes() {
  const sideWidth = $('#side').is(':visible') ? $('#side').width() : 0;
  const width = Math.floor(window.innerWidth - sideWidth);
  return { width, height: Math.floor(width * 0.5625) }; // Maintain 16:9 aspect ratio
}

function getPlayerEmbed(host, channel) {
  const { width, height } = getRes();

  if (host === "offline") document.getElementById("b").style.display = "none";

  switch (host) {
    case "offline":
      return getOfflineEmbed();
	case 'ok':
      return `<iframe src="//ok.ru/videoembed/${channel}?autoplay=1" width="100%" height="100%" allow="autoplay" resizable="true" id="stream" frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen></iframe>`;
	case "embed":
	  return `<iframe src="embed.html" width="100%" height="100%" id="stream" frameborder="0" allowfullscreen></iframe>`
    case "youtube":
      return `<iframe src="https://www.youtube.com/embed/${channel}?autoplay=1" width="100%" height="100%" id="stream" frameborder="0" allowfullscreen></iframe>`;
    case "clappr":
      return `<div id="player"></div><script>
        new Clappr.Player({
          source: "${channel}",
          mute: true,
          autoPlay: true,
          plugins: [DashShakaPlayback, QualitySelector],
          parentId: "#player",
          height: ${height},
          width: "100%"
        });
      </script>`;
    case "twitch":
      return `<div id="twitch-player"></div><script>
        new Twitch.Player("twitch-player", {
          width: "100%",
          height: "100%",
          channel: "${channel}"
        }).setVolume(0.0);
      </script>`;
    case "angel":
      return `<div class="banner"><img src="/assets/banner.png"></div><iframe src="https://player.angelthump.com/?channel=${channel}" width="100%" height="100%" resizable="true" id="stream" frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen></iframe>`;
    case "angels":
      return getServerSelectionEmbed();
    case 'redirect':
	  return `<script>window.location.href = "/${channel}/";</script>`;
    default:
      return `<iframe src="${channel}" width="100%" height="100%" id="stream" frameborder="0" allowfullscreen></iframe>`;
  }
}

function getOfflineEmbed() {
  return '<div id="o"><a href="https://discord.gg/quackpack" target="_blank"><img src="/assets/discord.png"></a></div>';
}

function getServerSelectionEmbed() {
  return `<h1 style="font-size:40px;text-align:center;position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);color:white;">
    Select a server:<br/>
    <a href="#" onclick="updateServer('e');return false;" style="font-size:30px;color:#FFF"><b>US East</b></a> |
    <a href="#" onclick="updateServer('w');return false;" style="font-size:30px;color:#FFF"><b>US West</b></a><br/>
    <a href="#" onclick="updateServer('eu1');return false;" style="font-size:30px;color:#FFF"><b>EU 1</b></a> |
    <a href="#" onclick="updateServer('eu2');return false;" style="font-size:30px;color:#FFF"><b>EU 2</b></a> |
    <a href="#" onclick="updateServer('sea');return false;" style="font-size:30px;color:#FFF"><b>SEA</b></a><br/>
    <span style="font-size:20px">Try a different server if you're lagging</span>
  </h1>`;
}

function updateServer(region) {
  $.ajax({
    url: `video.json?${Date.now()}`,
    type: "GET",
    dataType: "json",
    success: (response, _, xhr) => {
      $('#video-wrapper').html(setServer(response.host, response.channel, region));
      sessionStorage.setItem(lastModifiedKey, xhr.getResponseHeader("Last-Modified"));
    },
    error: (xhr) => {
        console.error("Invalid JSON from server switch");
    }
  });
}

function setServer(host, channel, region) {
  const { height } = getRes();
  if (host === "angels") {
    const serverMap = {
      w: "sfo1",
      e: "nyc1",
      eu1: "fra1",
      eu2: "ams1",
      sea: "sgp1"
    };
    channel = channel.replace("#", serverMap[region]);
    return `<div id="player"></div><script>
      new Clappr.Player({
        source: "${channel}",
        mute: true,
        autoPlay: true,
        parentId: "#player",
        height: ${height},
        width: "100%"
      });
    </script>`;
  }
}

function getChatEmbed() {
    return `<script id="cid0020000080393759078" data-cfasync="false" async src="//st.chatango.com/js/gz/emb.js" style="width: 100%;height: 100%;">
	{
		"handle":"lal420",
		"arch":"js",
		"styles":{
			"a":"000000",
			"b":100,
			"c":"444444",
			"d":"FFFFFF",
			"e":"000000",
			"f":100,
			"g":"444444",
			"h":"000000",
			"i":100,
			"j":"444444",
			"k":"444444",
			"l":"000000",
			"m":"444444",
			"n":"444444",
			"p":11,
			"q":"000000",
			"r":0,
			"t":0,
			"v":0,
			"ab":1,
			"sbc":"444444",
			"sba":100,
			"surl":0,
			"allowpm":1,
			"v":0,"w":0,
			"showhdr":0,
			"showx":0
		}
	}
	</script>`;
}

function setChat() {
  $('#chat-container').html(getChatEmbed());
}

// chat wont reload!
function toggleChat() {
  const $side = $('#side');
  const isVisible = $side.toggle().is(":visible");
  $('#chatvo').html(isVisible ? "hide chat" : "show chat");
}

function popoutChat() {
  window.open("/chat", "_blank");
  if ($('#side').is(":visible")) {
    toggleChat();
  }
}

$(document).ready(() => {
  setChat();
  setVideo();
  setInterval(() => setVideo(), 5000);
});
