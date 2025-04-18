﻿const channel = "lal420";
const lastModifiedKey = "modvideo";

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
    success: (response, _, xhr) => {
      setPlayer(response.host, response.channel);
      sessionStorage.setItem(lastModifiedKey, xhr.getResponseHeader("Last-Modified"));
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

function toggleChat() {
  const $side = $('#side');
  const isVisible = $side.is(":visible");

  $side.toggle();
  $("#chatvo").text(isVisible ? "show chat" : "hide chat");
  $("#main").css("width", isVisible ? "100%" : "calc(100% - 283px)");

  setChat();
  updateVideo();
}

function checkForVideoUpdate() {
  $.ajax({
    url: `video.json?${Date.now()}`,
    type: "HEAD",
    success: (_, __, xhr) => {
      if (xhr.getResponseHeader("Last-Modified") !== sessionStorage.getItem(lastModifiedKey)) {
        updateVideo();
      }
    }
  });
}

function setPlayer(host, channel) {
  const playerType = !channel ? "offline" : host;
  $('#video-wrapper').html(getPlayerEmbed(playerType, channel));
}

function getRes() {
  const sideWidth = $('#side').is(':visible') ? $('#side').width() : 0;
  const width = Math.floor(window.innerWidth - sideWidth);
  return { width, height: Math.floor(width * 0.5625) };
}

function getPlayerEmbed(host, channel) {
  const { width, height } = getRes();

  if (channel && channel.includes("1-edge")) channel = updateChannel(channel);

  if (host === "offline") document.getElementById("b").style.display = "none";

  switch (host) {
    case "offline":
      return getOfflineEmbed();
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
      return `<iframe src="https://player.angelthump.com/?channel=${channel}" width="100%" height="100%" resizable="true" id="stream" frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen></iframe>`;
   case "angels":
      return getServerSelectionEmbed();
    default:
      return `<iframe src="${channel}" width="100%" height="100%" id="stream" frameborder="0" allowfullscreen></iframe>`;
  }
}

function getOfflineEmbed() {
  return '<div id="o"><a href="https://discord.gg/quackpack" target="_blank"><img src="discord.png" style="height:32px"></a></div>';
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

function updateChannel(channel) {
  const con = Date.now();
  if (channel.includes("1-edge") && mobile) {
    const ch = channel.split("/")[4].split(".")[0];
    channel = `${channel.split('tv')[0]}tv/hls/${ch}/index.m3u8`;
  }
  if (channel.includes("1-edge")) channel += `?token=public&con=${con}`;
  if (channel.includes("east")) channel = channel.replace(/[4]/, Math.floor(Math.random() * 2) + 4);
  return channel;
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
      try {
        const err = JSON.parse(xhr.responseText);
        alert(err.Message);
      } catch {
        console.error("Invalid JSON from server switch");
      }
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

function setChat() {
  const mode = $("#chatvo").text().includes("show") ? "hide" : "night";
  $('#chat-container').html(getChatEmbed(channel, mode));
}

function getChatEmbed(channel, mode) {
  if (mode === 'night') {
    return `<script id="cid0020000080393759078" data-cfasync="false" async src="//st.chatango.com/js/gz/emb.js" style="width: 100%;height: 100%;">` +
      `{"handle":"${channel}","arch":"js","styles":{"a":"000000","b":100,"c":"444444","d":"FFFFFF","e":"000000","f":100,"g":"444444","h":"000000","i":100,"j":"444444","k":"444444","l":"000000","m":"444444","n":"444444","p":11,"q":"000000","r":0,"t":0,"v":0,"ab":1,"sbc":"444444","sba":100,"surl":0,"allowpm":1,"v":0,"w":0,"showhdr":0,"showx":0}}` +
      '</script>';
  }
  return ''; 
}

$(document).ready(() => {
  setChat();
  updateVideo();
  setInterval(checkForVideoUpdate, 30000);
});
