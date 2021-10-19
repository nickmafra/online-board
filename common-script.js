var boardStateStorage = null;
var renderer = null;
var boardInfo = null;
var qtPieces = null;

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
	console.log("loading...");
	var appKey = findGetParameter("appKey");
	if (appKey == null || appKey == "") {
		appKey = "tcob" + Math.floor(Math.random() * 1000000);
		window.location.href = window.location.href + (window.location.search == "" ? "?" : "&") + "appKey=" + appKey;
	}
	boardStateStorage = new BoardStorage(appKey, "boardState");
	boardStateStorage.serialize = serialize;
	boardStateStorage.deserialize = deserialize;
	
	var boardInfoRef = findGetParameter("boardInfo");
	if (boardInfoRef == null || boardInfoRef == "")
		boardInfoRef = "boardInfo.json";
	
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			boardInfo = JSON.parse(xmlHttp.responseText);
			if (!boardInfo.hasOwnProperty("params")) {
				boardInfo.params = {}
			}
			if (!boardInfo.params.hasOwnProperty("tileMultiplier")) {
				boardInfo.params.tileMultiplier = 1;
			}
            afterLoadBoardInfo();
		}
    }
    xmlHttp.open("GET", boardInfoRef, true); // true for asynchronous
    xmlHttp.send(null);
}

function afterLoadBoardInfo() {
	var canvas = document.getElementById('canvas');
	
	qtPieces = boardInfo.objects.length - 1; // 0 is bg
	renderer = new BoardRenderer(canvas, boardInfo, boardStateStorage);
	renderer.start();
}

function deserialize(rawState) {
	if (rawState == null || rawState == "") {
		return JSON.parse(JSON.stringify(boardInfo.defaultState));
	}
	var tileMultiplier = boardInfo.params.tileMultiplier;
	var parts = rawState.split("|");
	var pieces = parts[0].split(";");
	var hands = parts.length < 2 ? [] : parts[1].split(";");
	
	var state = {
		objects: [],
		hands: hands
	};
	state.objects.push(boardInfo.defaultState.objects[0]); // bg
	for (var i = 0; i < qtPieces; i++) {
		var asset = i < 12 ? "w" : "b";
		var x = 0;
		var y = 0;
		if (i < pieces.length) {
			var info = pieces[i].split(",");
			x = tileMultiplier * parseInt(info[0]);
			y = tileMultiplier * parseInt(info[1]);
		}
		var obj = {
			"asset": asset,
			"position": {x:x,y:y}
		};
		state.objects.push(obj);
	}
	return state;
}

function serialize(state) {
	var tileMultiplier = boardInfo.params.tileMultiplier;
	var rawState = "";
	for (var i = 1; i < qtPieces + 1; i++) {
		var obj = state.objects[i];
		var x = Math.round(obj.position.x / tileMultiplier);
		var y = Math.round(obj.position.y / tileMultiplier);
		rawState += x + "," + y + ";";
	}
	/*rawState += "|";
	for (var i = 0; i < state.hands.length; i++) {
		var hand = state.hands[i];
		rawState += (hand.position.x / tileMultiplier) + "," + (hand.position.y / tileMultiplier) + ";";
	}*/
	return rawState;
}

function resetState() {
	boardStateStorage.saveParsed(boardInfo.defaultState);
}