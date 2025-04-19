const channel = "lal420";
const stov = "modvideo";

document.addEventListener("visibilitychange", () => {
  document.title = document.hidden ? "Hot Dudes" : "Do not share";
});

function refreshVideo() {
  updateVideo();
}

function updateVideo() {
  $.ajax({
    url: `video.json?${Date.now()}`,
    type: "GET",
    dataType: "json",
    success: (response, status, xhr) => {
      SetPlayer(response.host, response.channel);
      sessionStorage.setItem(stov, xhr.getResponseHeader("Last-Modified"));
    },
    error: (xhr) => {
      try {
        const err = JSON.parse(xhr.responseText);
        alert(err.Message);
      } catch {
        console.error("Invalid response from video.json");
      }
    }
  });
}

function hideChat() {
  const $side = $('#side');
  $side.toggle();

  if ($side.is(":visible")) {
    $("#chatvo").html("hide chat");
    $("#main").css("width", "calc(100% - 283px)");
  } else {
    $("#chatvo").html("show chat");
    $("#main").css("width", "100%");
  }

  SetChat();
  updateVideo();
}

function ajax30sInterval() {
  $.ajax({
    url: `video.json?${Date.now()}`,
    type: "HEAD",
    success: (_, __, xhr) => {
      if (xhr.getResponseHeader("Last-Modified") !== sessionStorage.getItem(stov)) {
        updateVideo();
      }
    }
  });
}

function SetPlayer(o, c) {
  if (!c) {
    o = "offline";
  } else if (
    typeof Storage !== "undefined" &&
    /streamify|broadcast|sawlive|castamp|dot|vidi|ustream|widestream|dailymotion|ssh/.test(o) &&
    window.innerWidth > 600 &&
    !localStorage.getItem("warning")
  ) {
    o = "warning";
    localStorage.setItem("warning", "1");
  }

  $('#video-wrapper').html(GetPlayerEmbed(o, c));
}

function getRes() {
  const sideWidth = $('#side').is(':visible') ? $('#side').width() : 0;
  const w = Math.floor(window.innerWidth - sideWidth);
  const h = Math.floor(w * 0.5625);
  return { w, h };
}

function GetPlayerEmbed(o, c) {
  const { w, h } = getRes();

  if (c.includes("1-edge")) c = updateC(c);
  if (o === "offline") document.getElementById("b").style.display = "none";

  switch (o) {
    case "warning":
      return `<h1 style="font-family: Helvetica,Tahoma;font-size:36px;text-align:center;position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);color:white;">
        PLEASE DO NOT SHARE<br/><br/>
        <a href="https://www.ublock.org" style="color:#FB2" target="_blank">USE ADBLOCK</a><br/><br/>
        <a href="#" onclick="updateVideo();return false;" style="font-size:50px;color:#FB2"><b>OK</b></a>
      </h1>`;
    case "offline":
      return '<div id="o"><a href="https://discord.gg/quackpack" target="_blank"><img src="discord.png" style="height:32px"></a></div>';
    case "youtube":
      return `<iframe src="https://www.youtube.com/embed/${c}?autoplay=1" width="100%" height="100%" id="stream" frameborder="0" allowfullscreen></iframe>`;
    case "clappr":
      return `<div id="player"></div><script>
        new Clappr.Player({
          source: "${c}",
          mute: true,
          autoPlay: true,
          plugins: [DashShakaPlayback, QualitySelector],
          parentId: "#player",
          height: ${h},
          width: "100%"
        });
      </script>`;
    case "twitch":
      return `<div id="twitch-player"></div><script>
        new Twitch.Player("twitch-player", {
          width: "100%",
          height: "100%",
          channel: "${c}"
        }).setVolume(0.0);
      </script>`;
	case "angels":
      return `<h1 style="font-size:40px;text-align:center;position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);color:white;">
        Select a server:<br/>
        <a href="#" onclick="updateServer('e');return false;" style="font-size:30px;color:#FFF"><b>US East</b></a> |
        <a href="#" onclick="updateServer('w');return false;" style="font-size:30px;color:#FFF"><b>US West</b></a><br/>
        <a href="#" onclick="updateServer('eu1');return false;" style="font-size:30px;color:#FFF"><b>EU 1</b></a> |
        <a href="#" onclick="updateServer('eu2');return false;" style="font-size:30px;color:#FFF"><b>EU 2</b></a> |
        <a href="#" onclick="updateServer('sea');return false;" style="font-size:30px;color:#FFF"><b>SEA</b></a><br/>
        <span style="font-size:20px">Try a different server if you're lagging</span>
      </h1>`;
    default:
      return `<iframe src="${c}" width="100%" height="100%" id="stream" frameborder="0" allowfullscreen></iframe>`;
  }
}

function updateC(c) {
  const con = Date.now();
  if (c.includes("1-edge") && mobile) {
    const ch = c.split("/")[4].split(".")[0];
    c = `${c.split('tv')[0]}tv/hls/${ch}/index.m3u8`;
  }
  if (c.includes("1-edge")) c += `?token=public&con=${con}`;
  if (c.includes("east")) c = c.replace(/[4]/, Math.floor(Math.random() * 2) + 4);
  return c;
}

function updateServer(region) {
  $.ajax({
    url: `video.json?${Date.now()}`,
    type: "GET",
    dataType: "json",
    success: (response, _, xhr) => {
      $('#video-wrapper').html(setServer(response.host, response.channel, region));
      sessionStorage.setItem(stov, xhr.getResponseHeader("Last-Modified"));
    },
    error: (xhr) => {
      try {
        const err = JSON.parse(xhr.responseText);
        alert(err.Message);
      } catch {
        console.error("Invalid JSON from server switch");
      }
    }
  });
}

function setServer(o, c, s) {
  const { h } = getRes();
  if (o === "angels") {
    const map = {
      w: "sfo1",
      e: "nyc1",
      eu1: "fra1",
      eu2: "ams1",
      sea: "sgp1"
    };
    c = c.replace("#", map[s]);
    return `<div id="player"></div><script>
      new Clappr.Player({
        source: "${c}",
        mute: true,
        autoPlay: true,
        parentId: "#player",
        height: ${h},
        width: "100%"
      });
    </script>`;
  }
}

function SetChat() {
  const mode = $("#chatvo").text().includes("show") ? "hide" : "night";
  $('#chat-container').html(GetChatEmbed(channel, mode));
}

function GetChatEmbed(channel, mode) {
    switch (mode) {
        case 'night':
            return '<script id="cid0020000080393759078" data-cfasync="false" async src="//st.chatango.com/js/gz/emb.js" style="width: 100%;height: 100%;">{"handle":"' + channel + '","arch":"js","styles":{"a":"000000","b":100,"c":"444444","d":"FFFFFF","e":"000000","f":100,"g":"444444","h":"000000","i":100,"j":"444444","k":"444444","l":"000000","m":"444444","n":"444444","p":11,"q":"000000","r":0,"t":0,"v":0,"ab":1,"sbc":"444444","sba":100,"surl":0,"allowpm":1,"v":0,"w":0,"showhdr":0,"showx":0}}</script>';
		/*return '<iframe src="https://www.twitch.tv/lal420/chat?darkpopout=" frameborder="0" scrolling="no" height="100%" width="100%"></iframe>'*/
        case 'day':
            return '<script id="cid0020000080393759078" data-cfasync="false" async src="//st.chatango.com/js/gz/emb.js" style="width: 100%;height: 100%;">{"handle":"' + channel + '","arch":"js","styles":{"a":"3c2569","b":100,"c":"FFFFFF","d":"FFFFFF","e":"FFFFFF","f":100,"g":"000000","h":"FFFFFF","i":100,"j":"000000","k":"000000","l":"3c2569","m":"FFFFFF","n":"FFFFFF","p":11,"q":"000000","r":0,"t":0,"v":0,"ab":0,"sbc":"3c2569","sba":100,"surl":0,"allowpm":1,"v":0,"w":0,"showhdr":0,"showx":0}}</script>';
        case 'hide':
            return ''
    }
}

$(document).ready(() => {
  SetChat();
  updateVideo();
  setInterval(ajax30sInterval, 30000);
});
