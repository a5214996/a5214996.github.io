var channel = "lal420";
var stov = "modvideo";
var stop = "modpoll";
var wait = "";
var mobile = false;

function refreshChat(){
	var chat = document.getElementById("chat");
	$( '#chat' ).attr( 'src', function ( i, val ) { return val; });
}

function handleVisibilityChange() {
  if (document.hidden)
    document.title = "Hot Dudes";
  else 
    document.title = "Do not share";
}

function updateVideo() {
    $.ajax({
        url: "video.json?" + Date.now(),
        type: "GET",
        dataType: "json",
        success: function(responseTxt, statusTxt, xhr) {
            if (statusTxt == "success") {
                SetPlayer(responseTxt.host, responseTxt.channel);
                sessionStorage.setItem(stov, xhr.getResponseHeader("Last-Modified"));
            }
        },
        error: function(xhr, status, error) {
            var err = eval("(" + xhr.responseText + ")");
            alert(err.Message);
        }
    })
}


function refreshVideo(){
	updateVideo();
}

function updatePoll() {
    $.ajax({
        url: "poll.json?" + Date.now(),
        type: "GET",
        dataType: "json",
        success: function(responseTxt, statusTxt, xhr) {
            if (statusTxt == "success") {
                if (responseTxt.url) {
                    var start = new Date(xhr.getResponseHeader("Last-Modified"));
                    var end = new Date(start.getTime() + responseTxt.expires * 60 * 1000);
                    var now = Date.now();
                    var getpoll = end - now;
                    if (getpoll > 0) GetPoll(responseTxt.url)
                }
                sessionStorage[stop] = xhr.getResponseHeader("Last-Modified")
            }
        },
        error: function(xhr, status, error) {
            var err = eval("(" + xhr.responseText + ")");
            alert(err.Message);
        }
    })
}

function hideChat(){
	$('#side').toggle();

	if($('#side').is(":visible")){
		//$(".chatbutton:nth-child(2)").html('<i class="fa fa-times fa-lg"></i> Hide');
		$("#chatvo").html("hide chat");
		$("#main").css("width","calc(100% - 283px)");
	}else{
		//$(".chatbutton:nth-child(2)").html('<i class="fa fa-check fa-lg"></i> Show');
		$("#chatvo").html("show chat");
		$("#main").css("width","100%");
	}
	SetChat();
	updateVideo();
}

function GetPoll(url) {
    $.fancybox.open({
        width: 281,
        height: 340,
        autoSize: false,
        openEffec: 'fade',
        openSpeed: 150,
        topRatio: 0,
        leftRatio: 1,
        closeEffec: 'fade',
        closeSpeed: 150,
        href: url,
        type: 'iframe',
		closeBtn : false,
        margin: 0,
        padding: 0,
        helpers: {
            overlay: {
                css: {
                    'background': 'rgba(58, 42, 45, 0.0)',
                    'overflow': 'hidden',
                    'pointer-events': 'auto'
                }
            }
        }
    });
    $.fancybox.hideLoading()
}

function ajax30sInterval() {
    $.ajax({
        url: "video.json?" + Date.now(),
        type: "head",
        success: function(res, code, xhr) {
            if (xhr.getResponseHeader("Last-Modified").localeCompare(sessionStorage[stov]) != 0) {
                updateVideo();
            }
        }
    })
}

$(window).resize(function(){
	var iframe = document.getElementById("stream");
	var host = iframe.src.split('.');
	if(iframe != null && host[1].match(/^(streamifyplayer|adcast|castamp|iguide|dot|widestream|ssh)$/)){
		clearTimeout(wait);
		updateVideo();
		wait = setTimeout(updateVideo, 300);
	}
}); 

function SetPlayer(o, c) {
   if (c) {
        if (typeof(Storage) !== "undefined") {
            if (o.match(/^(streamify|broadcast|sawlive|castamp|dot|vidi|ustream|widestream|dailymotion|ssh)$/) && window.innerWidth > 600 && localStorage.getItem("warning") === null) {
                o = "warning";
                localStorage.setItem("warning", "1");
            }
        }

    } else {
        o = "offline"
    }
    $('#video-wrapper').html(GetPlayerEmbed(o, c))
}


function getRes(o){
	var res = new Object();
	var s = 0;
	
	if($('#side').is(':visible')){
		s = $('#side').width();
	}
	
	//reset for hide chat
	$(".video-container").css("top","0");
	$(".video-container").css("left","0");
	$(".video-container").css("-ms-transform","translateY(0%)");
	$(".video-container").css("-webkit-transform","translateY(0%)");
	$(".video-container").css("-moz-transform","translateY(0%)");
	$(".video-container").css("-o-transform","translateY(0%)");
	$(".video-container").css("transform","translateY(0%)");
	$(".video-container").css("-ms-transform","translateX(0%)");
	$(".video-container").css("-webkit-transform","translateX(0%)");
	$(".video-container").css("-moz-transform","translateX(0%)");
	$(".video-container").css("-o-transform","translateX(0%)");
	$(".video-container").css("transform","translateX(0%)");

	
	var w = Math.floor(window.innerWidth)-s;
	var h = Math.floor(w * .5625);
    var r = (window.innerHeight - $('#nav').height()) / (w);
	//console.log("w:" + w + " | h: " + h + " | r:" + r);
	
	//limit by height
	if(r < .5625){
		console.log("if");
		h = Math.floor(window.innerHeight)-50;
		w = Math.floor(h / .5625)
		$(".video-container").css("width",w+"px");
		$(".video-container").css("height",h+"px");
		$(".video-container").css("left","50%");
		$(".video-container").css("-ms-transform","translateX(-50%)");
		$(".video-container").css("-webkit-transform","translateX(-50%)");
		$(".video-container").css("-moz-transform","translateX(-50%)");
		$(".video-container").css("-o-transform","translateX(-50%)");
		$(".video-container").css("transform","translateX(-50%)");
	//limit by width 
	}else{
		//console.log("else");
		$(".video-container").css("width",w+"px");
		$(".video-container").css("height",h+"px");
		$(".video-container").css("top","50%");
		$(".video-container").css("-ms-transform","translateY(-50%)");
		$(".video-container").css("-webkit-transform","translateY(-50%)");
		$(".video-container").css("-moz-transform","translateY(-50%)");
		$(".video-container").css("-o-transform","translateY(-50%)");
		$(".video-container").css("transform","translateY(-50%)");
	}
		
	//console.log(w + " " + h);
	res["w"] = w;
	res["h"] = h;
	return res;
}

function GetPlayerEmbed(o, c) {
     var res = getRes(o);
     w = res["w"];
     h = res["h"];
	
     if(c.indexOf("1-edge") > -1)
          c = updateC(c);

	switch (o) {
	case 'warning':
		return '<h1 style="font-family: Helvetica,Tahoma;font-size:36px;text-align:center;position:absolute;top:50%;left:50%;margin-right:-50%;transform:translate(-50%, -50%);color:white;">PLEASE DO NOT SHARE<br/><br/><a href="https://www.ublock.org" style="color:#FB2" target="_blank">USE ADBLOCK</a>. We receive ZERO REVENUE from ads<br/><br/><a href="#" onclick="updateVideo();return false;" style="font-size:50px;color:#FB2"><b>OK</b></a></h1>';
	case 'refresh':
		return '<script>location.reload();</script>';
	case 'offline':
		return '<h1 style="font-size:36px;text-align:center;position:absolute;top:50%;left:50%;margin-right:-50%;transform:translate(-50%, -50%);color:white;">offline</h1>';
	case 'streamify':
		return '<iframe src="http://www.streamifyplayer.com/embedplayer/' + c + '/1/' + w + '/' + h + '" width=' + w + ' height=' + h + ' scrolling=no marginwidth="0" marginheight="0" resizable=true id=stream frameborder=0 allowtransparency=true allowfullscreen></iframe>';
	case 'broadcast':
		return '<iframe src=\"http://bro.adcast.tech/stream.php?id=' + c + '&width=' + w + '&height=' + h + '\" width=' + w + ' height=' + h + ' resizable=true id=stream frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>';
	case 'ustream':
		return '<iframe src="https://www.ustream.tv/embed/' + c + '?html5ui&showtitle=false" width=100% height=100% resizable=true id=stream frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>';
	case 'youtube':
		return '<iframe src="https://www.youtube.com/embed/' + c + '?autoplay=1" width=100% height=100% resizable=true id=stream frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>';
	case 'jwplayer':
		return '<script type="text/javascript">jwplayer.key="IFe5rS/dnOPqPbx0UE+Z83SFW53jfYkODVyjpGb7ErU=";</script><div id="jw">Loading the player ...</div><script type="text/javascript">jwplayer("jw").setup({primary: "flash", height: "100%",width: "100%",autostart: true,file: "' + c + '",analytics: {enabled: false,cookies: false},});</script>';
	case 'rtmp':
		return '<script type="text/javascript">jwplayer.key="IFe5rS/dnOPqPbx0UE+Z83SFW53jfYkODVyjpGb7ErU=";</script><div id="jw">Loading the player ...</div><script type="text/javascript">jwplayer("jw").setup({primary: "flash", height: "100%",width: "100%",autostart: true,type:"rtmp",rtmp: {bufferlength:3,},file: "' + c + '",analytics: {enabled: false,cookies: false},});</script>';
	case 'clappr':
		return `<div id="player"></div><script>var player = new Clappr.Player({source: "${c}", mute: true, autoPlay: true, parentId: "#player", height: ${h}, width: "100%"});</script>`;
	case 'drive':
		return "<iframe src=\"https://drive.google.com/file/d/" + c + "/preview?autoplay=1\" width='100%' height='100%' resizable=true id=streamo frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>";
	case 'twitch':
		return `<div id="twitch-player"></div><script type="text/javascript">var options = {width: "100%",height: "100%",channel: "`+ c +`"}; var player = new Twitch.Player("twitch-player", options); player.setVolume(0.0);</script>`;
	case 'soundcloud':
		return "<iframe src=\"https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/" + c + "&amp;auto_play=true&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true\" width='100%' height='100%' resizable=true id=stream scrolling=no frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>";
	case 'hitbox':
		return "<iframe src=\"https://www.hitbox.tv/embed/" + c + "\" width='100%' height='100%' resizable=true id=stream  frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>";
	case 'vidi':
		return "<iframe src=\"http://vidi.tv/embed-player/" + c + "\" width='100%' height='100%' resizable=true id=stream frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>";
	case 'dot':
		return '<iframe src=\"http://dotstream.tv/player.php?streampage=' + c + '&width=' + w + '&height=' + h + '\"  width=100% height=100% resizable=true id=stream scrolling=no frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>';
	case 'sawlive':
		return "<iframe src='saw.html' scrolling=no id=stream allowfullscreen></iframe>"
	case 'iguide':
		return '<iframe src=\"http://www.iguide.to/embedplayer_new.php?width=' + w + '&height=' + h + '&c=' + c + '&autoplay=true\" width=' + w + ' height=' + h + ' resizable=true id=stream  frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>';
	case 'vaughnlive':
		return "<iframe src=\"http://www.vaughnlive.tv/embed/video/" + c + "\" width='100%' height='100%' resizable=\"true\" frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>";
	case 'castamp':
		return '<iframe src=\"http://www.castamp.com/embed.php?c=' + c + '&tk=01234567&vwidth=' + w + '&vheight=' + h + '\" width=' + w + ' height=' + h + ' resizable=true id=stream scrolling=no frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>';
	case 'streamup':
		return '<iframe src="http://www.streamup.com/' + c + '/embeds/video" width=100% height=100% resizable=true id=stream frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>'
	case 'widestream':
		return '<iframe src=\"http://www.widestream.io/embed-' + c +  ' \" width=' + w + ' height=' + h + ' resizable=true id=stream frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>';
	case 'dailymotion':
		return '<iframe src="http://www.dailymotion.com/embed/video/' + c + '?api=postMessage&id=player&syndication=lr:166445&autoplay=1&info=0&logo=0&related=0&social=0&theme=light" width=100% height=100% resizable=true id=stream frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>';
	case 'ssh':
		return '<iframe src="https://www.ssh101.com/securelive/index.php?id=' + c + '" width=100% height=100% resizable=true id=stream frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>';
	case 'telerium':
		return `<iframe src=\"https://telerium.tv/embed/" + c + ".html\" width='100%' height='100%' resizable=\"true\" frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>`;
	case 'angel':
			$('#ps').before("<hr/>");
			$('#ps').text("The Patreon link is not associated with Hot Dudes.");
            return "<iframe src=\"https://player.angelthump.com/?channel="+ c + "\" width='100%' height='100%' resizable=true id=stream  frameborder=0 scrolling=no allowtransparency=true allowfullscreen></iframe>";
	case 'angels':
			return `<h1 style="font-size:40px;text-align:center;position:absolute;top:50%;left:50%;margin-right:-50%;transform:translate(-50%, -50%);color:white;">
			Select a server:<br/>
			<a href="#" onclick="updateServer('e1');return false;" style="font-size:30px;color:#FFF"><b>US East 1</b></a> |
			<a href="#" onclick="updateServer('e2');return false;" style="font-size:30px;color:#FFF"><b>US East 2</b></a> |
			<a href="#" onclick="updateServer('w');return false;" style="font-size:30px;color:#FFF"><b>US West</b></a><br/>
			<a href="#" onclick="updateServer('eu1');return false;" style="font-size:30px;color:#FFF"><b>EU 1</b></a> |
			<a href="#" onclick="updateServer('eu2');return false;" style="font-size:30px;color:#FFF"><b>EU 2 </b></a> |
			<a href="#" onclick="updateServer('eu3');return false;" style="font-size:30px;color:#FFF"><b>EU 3</b></a> |
			<a href="#" onclick="updateServer('ru');return false;" style="font-size:30px;color:#FFF"><b>RU</b></a> |
			<a href="#" onclick="updateServer('sea');return false;" style="font-size:30px;color:#FFF"><b>SEA</b></a><br/>
			<span style="font-size:20px">Try a different server if you're lagging</span></h1>
			
			<!--<a href="https://www.patreon.com/join/angelthump" target="_blank"><img src="https://i.imgur.com/GXERebi.png" alt="Angelthump"></a>--></h1>`;
	}	
}

function updateServer(s) {
	$.ajax({
        url: "video.json?" + Date.now(),
        type: "GET",
        dataType: "json",
        success: function(responseTxt, statusTxt, xhr) {
            if (statusTxt == "success") {
				$('#video-wrapper').html(setServer(responseTxt.host, responseTxt.channel, s));
                sessionStorage.setItem(stov, xhr.getResponseHeader("Last-Modified"));
            }
        },
        error: function(xhr, status, error) {
            var err = eval("(" + xhr.responseText + ")");
            alert(err.Message);
        }
    })
}

function setServer(o, c, s) {
	var res = getRes(o);
	var w = res["w"];
	var h = res["h"];
		
	if(o == "angels"){
		switch(s){
			case 'w':
				c = c.replace("#", "sfo1");
				break;
			case 'e1':
				c = c.replace("#", "tor1");
				break;
			case 'e2':
				c = c.replace("#", "nyc1");
				break;
			case 'eu1':
				c = c.replace("#", "lon1");
				break;
			case 'eu2':
				c = c.replace("#", "fra1");
				break;
			case 'eu3':
				c = c.replace("#", "ams1");
				break;
			case 'ru':
				c = c.replace("#", "blr1");
				break;
			case 'sea':
				c = c.replace("#", "sgp1");
				break;
		}
		return `<div id="player"></div><script>var player = new Clappr.Player({source: "${c}", mute: true, autoPlay: true, parentId: "#player", height: ${h}, width: "100%"});</script>`;
	}
}

function SetChat() {
    var mode = "";
    /*if ($("#main").hasClass("dark")) {
        mode = "night"
    } else if ($(".chatbutton:nth-child(2)").index("show") > 0) {
        mode = "hide"
    } else {
        mode = "day"
    }*/
	
	if ($(".chatbutton:nth-child(2)").index("show") > 0) {
		mode = "hide"
	}else{
		mode = "night"
	}
    $('#chat-container').html(GetChatEmbed(channel, mode))
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

function loadVidOptions() {
	var VidOptions = document.querySelector('div.vidOptions'); 
	
	function closeVidOptions() {
		if ($('.vidOptions').hasClass('show')) {
		  $('#overlay-top').removeClass('show');
		$('.vidOptions').removeClass('show');
		}
	}

	function showVidOptions() {
		var iframe = document.getElementById("stream");
		var jww = document.getElementById("jw_wrapper");
		var jwp = document.getElementById("jw");
		if (!$('.vidOptions').hasClass('show') && (iframe !== null || jww !== null || jwp !== null) && !(window.innerWidth <= 800 && window.innerHeight <= 600)){
		  $('.vidOptions').addClass('show');
		}
	}

	$('.video-container').hover(showVidOptions, closeVidOptions);

}


function updateC(c){
    var con = Date.now();
	
    if(c.indexOf("1-edge") > -1 && mobile){
        ch = c.split("/")[4].split(".")[0];
        c = `${c.split('tv')[0]}tv/hls/${ch}/index.m3u8`
    }

    if(c.indexOf("1-edge") > -1)
          c = `${c}?token=public&con=${con}`

     if(c.indexOf("east") > -1)
          c = c.replace(/[4]/, Math.floor(Math.random() * 2)+4)
	
     return c;
}
	
function copyToClipboard(element) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(element).text()).select();
  document.execCommand("copy");
  $temp.remove();
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);

function SetMobile(){
    if( navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i)|| navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)){
            hideChat();
            mobile = true;
        }
}
/*
if(top!=self){
    top.location.replace(document.location);
    alert("For security reasons, framing is not allowed; click OK to remove the frames.")
}*/

$(document).ready(function(){
		//loadSettings();
        //loadVidOptions();
        SetMobile();
		SetChat();
		updateVideo();
		//updatePoll();
		setInterval(ajax30sInterval, 30000);
		//setInterval(SetChat, 1200000);
});
