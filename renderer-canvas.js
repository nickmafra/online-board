class BoardRenderer {
	
	constructor(canvas, boardInfo, boardStateStorage) {
		this.canvas = canvas;
		this.canvasLeft = canvas.offsetLeft + canvas.clientLeft;
		this.canvasTop = canvas.offsetTop + canvas.clientTop;
		this.boardInfo = boardInfo;
		this.boardStateStorage = boardStateStorage;
		this.boardState = boardStateStorage.loadParsedChange();
		this.delay = 200;
		this.interval = null;
		this.stoped = false;
		this.pointer = {
			down: false,
			objIndex: -1,
			position: {x:0,y:0},
			lastPosition: {x:null,y:null}
		}
		this.images = [];
		
		this.ctx = this.canvas.getContext("2d");
		this.canvas.addEventListener("mousedown", (event) => this.updatePointer(event, "mousedown"));
		this.canvas.addEventListener("mousemove", (event) => this.updatePointer(event, "mousemove"));
		this.canvas.addEventListener("mouseup", (event) => this.updatePointer(event, "mouseup"));
		
	}

	start() {
		this.loadImages();
		
		if (this.interval == null) {
			this.interval = setInterval(() => this.update(), this.delay);
		}
		this.stoped = false;
		return true;
	}
	
	update() {
		if (this.stoped)
			return;
		
		var changed = false;
		
		if (this.pointer.objIndex >= 0) {
			var objState = this.boardState.objects[this.pointer.objIndex];
			var objInfo = this.boardInfo.objects[this.pointer.objIndex];
			var asset = this.boardInfo.assets.filter(a => a.name == objInfo.asset)[0];
			var size = objInfo.hasOwnProperty("size") ? objInfo.size : asset.size;
			objState.position.x = this.pointer.position.x - size.width / 2;
			objState.position.y = this.pointer.position.y - size.height / 2;
		}
		if (this.pointer.down && this.pointer.position.x != this.pointer.lastPosition.x || this.pointer.position.y != this.pointer.lastPosition.y) {
			this.pointer.lastPosition = this.pointer.position;
			changed = true;
		}
		
		if (changed) {
			this.boardStateStorage.saveParsedChange(this.boardState);
		} else {
			var stateChange = this.boardStateStorage.loadParsedChange();
			if (!(stateChange === false)) {
				this.boardState = stateChange;
				changed = true;
			}
		}
		
		if (changed)
			this.draw();
	}
	
	stop() {
		if (this.interval != null) {
			clearInterval(this.interval);
			this.interval = null;
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
		var x = event.pageX - this.canvasLeft;
        var y = event.pageY - this.canvasTop;
		this.pointer.position = {"x":x,"y":y};
		if (type == "mousedown") {
			this.pointer.down = true;
			this.pointer.objIndex = this.findObj(x, y);
			console.log("on mousedown pointer: " + JSON.stringify(this.pointer));
		} else if (type == "mouseup") {
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