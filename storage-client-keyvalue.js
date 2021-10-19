class BoardStorage {
	
	constructor(appKey, itemKey) {
		this.appKey = appKey;
		this.itemKey = itemKey;
		this.loadUrl = "https://keyvalue.immanuel.co/api/KeyVal/GetValue/" + appKey + "/" + itemKey;
		this.saveUrl = "https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/" + appKey + "/" + itemKey + "/";
		
		this.lastState = null;
	}
	
	load() {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open("GET", this.loadUrl, false);
		xmlHttp.send(null);
		var response = xmlHttp.responseText;
		return response.substring(1, response.length - 1);
	}
	
	save(state) {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open("POST", this.saveUrl + state, false);
		xmlHttp.send(null);
	}
	
	loadChange() {
		var lastState = this.lastState;
		var state = this.load();
		this.lastState = state;
		return state == lastState ? false : state;
	}
	
	loadParsed() {
		return this.deserialize(this.load());
	}
	
	saveChange(state) {
		if (state == this.lastState) {
			return false;
		}
		this.lastState = state;
		this.save(state);
		return true;
	}
	
	saveParsed(state) {
		this.save(this.serialize(state));
	}
	
	loadParsedChange() {
		var change = this.loadChange();
		return change === false ? false : this.deserialize(change);
	}
	
	saveParsedChange(state) {
		return this.saveChange(this.serialize(state));
	}
	
	serialize = null
	deserialize = null
}