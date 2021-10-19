var boardStateStorage = null;
var renderer = null;

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}

function load() {
	//var appKey = "2kii042t";
	var appKey = findGetParameter("appKey");
	if (appKey == null || appKey == "") {
		appKey = "tcob" + Math.floor(Math.random() * 1000000);
		window.location.href = window.location.href + (window.location.search || '?') + "appKey=" + appKey;
	}
	boardStateStorage = new BoardStorage(appKey, "boardState");
	boardStateStorage.serialize = serialize;
	boardStateStorage.deserialize = deserialize;
	
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            afterLoadBoardInfo(JSON.parse(xmlHttp.responseText));
    }
    xmlHttp.open("GET", "boardInfo.json", true); // true for asynchronous
    xmlHttp.send(null);
}

function afterLoadBoardInfo(boardInfo) {
	var canvas = document.getElementById('canvas');
	
	renderer = new BoardRenderer(canvas, boardInfo, boardStateStorage);
	renderer.delay = 200;
	renderer.start();
}

function deserialize(rawState) {
	if (rawState == null || rawState == "") {
		// default state
		rawState = "195,448;389,379;260,377;131,377;66,444;510,384;449,316;320,321;195,318;65,321;446,444;322,447;509,128;384,128;259,130;130,131;512,-1;444,66;382,2;320,65;257,1;194,68;127,3;66,64;|";
	}
	console.log("rawState: " + rawState);
	var parts = rawState.split("|");
	var pieces = parts[0].split(";");
	var hands = parts.length < 2 ? [] : parts[1].split(";");
	
	var state = {
		objects: [],
		hands: []
	};
	state.objects.push({
		"asset": "bg",
		"position": {x:64,y:0}
	});
	for (var i = 0; i < 24; i++) {
		var asset = i < 12 ? "w" : "b";
		var x = 0;
		var y = 0;
		if (i < pieces.length) {
			var info = pieces[i].split(",");
			x = parseInt(info[0]);
			y = parseInt(info[1]);
		}
		var obj = {
			"asset": asset,
			"position": {x:x,y:y}
		};
		state.objects.push(obj);
	}
	console.log("boardState: " + JSON.stringify(state));
	return state;
}

function serialize(state) {
	var rawState = "";
	for (var i = 1; i < 25; i++) {
		var obj = state.objects[i];
		rawState += obj.position.x + "," + obj.position.y + ";";
	}
	rawState += "|";
	for (var i = 0; i < state.hands.length; i++) {
		var hand = state.hands[i];
		rawState += hand.position.x + "," + hand.position.y + ";";
	}
	return rawState;
}