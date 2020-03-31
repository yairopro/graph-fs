const Path = require("path");
const FileSystem = require("fs");
const {lastItemOf} = require("./utils");

module.exports = class Node {
	static get cwd(){
		const cwd = process.cwd();
		return new this(cwd);
	}

	constructor(absolutePath) {
		// convert to array
		if (typeof absolutePath === "string"){
			absolutePath = absolutePath.split('/');

			// remove empty string at start
			if (!absolutePath[0])
				absolutePath = absolutePath.slice(1);
			// remove empty string at end
			const lastNodeName = lastItemOf(absolutePath);
			if (!lastNodeName)
				absolutePath = absolutePath.slice(0, -1);
		}

		const absolutePathString = absolutePath.join('/');
		const cached = cache.get(absolutePathString);
		if (cached)
			return cached;

		this.path = absolutePath;
		cache.set(absolutePathString, this);
	}

	get absolute(){
		return '/' + this.path.join('/');
	}

	toString(){
		let absolute = this.absolute;
		if (this.is.directory)
			absolute += '/';
		return absolute;
	}

	get name(){
		const {path} = this;
		return lastItemOf(path);
	}

	get exists(){
		return FileSystem.existsSync(this.absolute);
	}

	get parent(){
		if (this.path.length > 1){
			const parentPath = this.path.slice(0, -1);
			return new Node(parentPath);
		}
	}

	get is(){
		const exists = this.exists;
		const absolute = this.absolute;
		return {
			file:  exists && FileSystem.lstatSync(absolute).isFile(),
			directory:  exists && FileSystem.lstatSync(absolute).isDirectory(),
		};
	}


	resolve(relative) {
		const absolute = Path.resolve(this.absolute, relative);
		return new Node(absolute);
	}

	newDirectory(name){
		const directory = this.resolve(name);

		if (directory.exists)
			throw new Error("Directory already exists.");

		FileSystem.mkdirSync(directory.absolute);
		return directory;
	}

	newFile(fullName, content = ""){
		const file = this.resolve(fullName);

		if (file.exists)
			throw new Error("File already exists.");

		content = content ? String(content) : "";
		FileSystem.writeFileSync(file.absolute, content);

		return file;
	}

	getContent(options = "utf8"){
		if (!this.is.file)
			throw new Error(`The node is not a file: ${this.toString()}`);

		return FileSystem.readFileSync(this.absolute, options);
	}

	get children() {
		const absolute = this.toString(); // needs '/' at end
		return FileSystem.readdirSync(absolute)
			.map(name => this.resolve(name));
	}

	clear(){
		const is = this.is;
		if (is.file){
			//TODO
		}

		else if (is.directory)
			this.children.forEach(child => child.delete());
	}

	delete(){
		if (!this.exists)
			return;

		const absolute = this.absolute;
		if (this.is.directory) {
			this.clear();
			FileSystem.rmdirSync(absolute);
		} else
			FileSystem.unlinkSync(absolute);
	}
};

const WeakValueMap = require("weakvaluemap");
const cache = new WeakValueMap();
