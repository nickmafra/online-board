class BoardRenderer {
	
	constructor(canvas, boardInfo, boardStateStorage) {
		this.canvas = canvas;
		this.boardInfo = boardInfo;
		this.boardStateStorage = boardStateStorage;
		this.boardState = boardStateStorage.loadParsedChange();
		this.fps = 50;
		this.lastUpdate = 0;
		this.maxDelay = 1000;
		this.minDelay = 200;
		this.stoped = false;
		this.updateId = null;
		this.pointer = {
			down: false,
			objIndex: -1,
			position: {x:0,y:0},
			lastPosition: {x:null,y:null},
			lastObjIndex: -1
		}
		this.lastAction = null;
		this.images = [];
		
		this.ctx = this.canvas.getContext("2d");
		this.canvas.addEventListener("mousedown", (event) => this.updatePointer(event, "down"));
		this.canvas.addEventListener("mousemove", (event) => this.updatePointer(event, "move"));
		this.canvas.addEventListener("mouseup", (event) => this.updatePointer(event, "up"));
		this.canvas.addEventListener("touchstart", (event) => this.updatePointer(event, "down"));
		this.canvas.addEventListener("touchmove", (event) => this.updatePointer(event, "move"));
		this.canvas.addEventListener("touchend", (event) => this.updatePointer(event, "up"));
		
	}

	start() {
		console.log("starting renderer...");
		this.loadImages();
		
		this.stoped = false;
		this.pointer.objIndex = -1;
		this.lastUpdate = 0;
		this.lastAction = null;
		this.boardStateStorage.lastState = null;
		this.lastChanged = false;
		this.update();
	}
	
	update() {
		if (this.stoped)
			return;
		
		var changed = false;
		var importantChange = false;
		var now = Date.now();
		var needUpdate = now - this.lastUpdate >= (this.lastChanged ? this.minDelay : this.maxDelay);
		var forceLoad = this.lastAction == "save" && !this.pointer.down;
		
		if (this.pointer.objIndex >= 0) {
			var objState = this.boardState.objects[this.pointer.objIndex];
			var objInfo = this.boardInfo.objects[this.pointer.objIndex];
			var asset = this.boardInfo.assets.filter(a => a.name == objInfo.asset)[0];
			var size = objInfo.hasOwnProperty("size") ? objInfo.size : asset.size;
			objState.position.x = Math.round(this.pointer.position.x - size.width / 2);
			objState.position.y = Math.round(this.pointer.position.y - size.height / 2);
		}
		if (this.pointer.objIndex != this.pointer.lastObjIndex) {
			importantChange = true;
			changed = true;
		}
		if (this.pointer.objIndex >= 0 && this.pointer.position.x != this.pointer.lastPosition.x || this.pointer.position.y != this.pointer.lastPosition.y) {
			changed = true;
		}
		
		if (importantChange || changed && needUpdate) {
			this.pointer.lastObjIndex = this.pointer.objIndex;
			this.pointer.lastPosition = this.pointer.position;
			this.lastUpdate = now;
			this.boardStateStorage.saveParsedChange(this.boardState);
			this.lastAction = "save";
		} else if (forceLoad || needUpdate) {
			this.lastUpdate = now;
			var stateChange = forceLoad
				? this.boardStateStorage.loadParsed()
				: this.boardStateStorage.loadParsedChange();
			if (!(stateChange === false)) {
				this.boardState = stateChange;
				changed = true;
			}
			this.lastAction = "load";
		}
		
		if (changed)
			this.draw();
		
		this.lastChanged = changed;
		this.updateId = setTimeout(() => this.update(), 1000 / this.fps);
	}
	
	stop() {
		console.log("stoping renderer...");
		if (this.updateId != null) {
			clearTimeout(this.updateId);
			this.updateId = null;
		}
		this.stoped = true;
	}
	
	loadImages() {
		this.images = [];
		for (var i = 0; i < this.boardInfo.assets.length; i++) {
			var asset = this.boardInfo.assets[i];
			if (asset.type == "image") {
				var img = new Image();
				img.onload = function(){};
				img.src = asset.src;
				this.images.push({
					name: asset.name,
					value: img
				});
			}
		}
	}
	
	draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if (this.boardInfo.params.hasOwnProperty("bgColor")) {
			this.ctx.fillStyle = this.boardInfo.params.bgColor;
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}
		
		for (var i = 0; i < this.boardInfo.objects.length; i++) {
			var objInfo = this.boardInfo.objects[i];
			var asset = this.boardInfo.assets.filter(a => a.name == objInfo.asset)[0];
			var objState = this.boardState.objects[i];
			if (asset.type == "image") {
				this.drawImage(objInfo, objState, asset);
			}
		}
	}
	
	drawImage(objInfo, objState, asset) {
		var image = this.images.filter(image => image.name == asset.name)[0];
		var size = objInfo.hasOwnProperty("size") ? objInfo.size : asset.size;
		var x = objState.position.x;
		if (!Number.isInteger(x)) x = 0;
		var y = objState.position.y;
		if (!Number.isInteger(y)) y = 0;
		
		this.ctx.drawImage(image.value, x, y, size.width, size.height);
	}
	
	updatePointer(event, type) {
		event.preventDefault();
		var isDesktop = event.touches === undefined;
		var eventPointer = isDesktop || event.touches.length == 0 ? event : event.touches[0];
		var x = eventPointer.pageX - this.canvas.offsetLeft - this.canvas.clientLeft;
		var y = eventPointer.pageY - this.canvas.offsetTop - this.canvas.clientTop;
		this.pointer.position = {"x":x,"y":y};
		if (type == "down") {
			this.pointer.down = true;
			this.pointer.objIndex = this.findObj(x, y);
		} else if (type == "up") {
			this.pointer.down = false;
			this.pointer.objIndex = -1;
		}
	}
	
	findObj(x, y) {
		for (var i = this.boardInfo.objects.length - 1; i >= 0; i--) {
			var objInfo = this.boardInfo.objects[i];
			var objState = this.boardState.objects[i];
			var asset = this.boardInfo.assets.filter(a => a.name == objInfo.asset)[0];
			var size = objInfo.hasOwnProperty("size") ? objInfo.size : asset.size;
			var relX = x - objState.position.x;
			var relY = y - objState.position.y;
			if (!objInfo.lock && relX >= 0 && relY >= 0 && relX <= size.width && relY <= size.height) {
				return i;
			}
		}
		return -1;
	}
};