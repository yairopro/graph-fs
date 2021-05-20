const path = require("path");
const fs = require("fs");
const WeakValueMap = require("weak-value");
const { lastItemOf, toString } = require("./utils");

module.exports = class Node {
	constructor(absolutePath) {
		// convert to array
		if (typeof absolutePath === "string") {
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

	/**
	 * @return {string} Absolute path without '/' at the end.
	 */
	get absolute() {
		return '/' + this.path.join('/');
	}

	/**
	 * @return {string} Absolute path with '/' at the end for directories.
	 */
	toString() {
		let absolute = this.absolute;
		if (this.is.directory)
			absolute += '/';
		return absolute;
	}

	/**
	 * @return {string} Full name of the node.
	 */
	get name() {
		return lastItemOf(this.path);
	}

	/**
	 * @return {boolean} If the node exists.
	 */
	get exists() {
		return fs.existsSync(this.absolute);
	}

	/**
	 * @return {Node} Parent node.
	 */
	get parent() {
		return this.resolve("..");
	}

	/**
	 * @return {{file: boolean, directory: boolean}} Object indicating what is the node.
	 */
	get is() {
		const exists = this.exists;
		const infos = exists && fs.lstatSync(this.absolute);
		return {
			file: infos && infos.isFile(),
			directory: infos && infos.isDirectory(),
		};
	}

	/**
	 * @param relative {string} Relative path from the current node.
	 * @return {Node} The node relative from the current one (even if it doesn't exists).
	 */
	resolve(relative) {
		const absolute = path.resolve(this.absolute, toString(relative));
		return new Node(absolute);
	}

	/**
	 * @param name {string} Name of the directory to create as child of current node.
	 * @return {Node} Node instance of the new created child directory.
	 */
	newDirectory(name) {
		const directory = this.resolve(name);

		if (directory.exists)
			throw new Error("Directory already exists.");

		fs.mkdirSync(directory.absolute);
		return directory;
	}

	/**
	 * @param fullName {string} Name of the file to create as child of current node.
	 * @param content {*} Content to write inside the file at its creation.
	 * @param options {WriteFileOptions | string = "utf8"}
	 * @return {Node} Node instance of the new created child file.
	 */
	newFile(fullName, content = "", options = "utf8") {
		const file = this.resolve(fullName);

		if (file.exists)
			throw new Error("File already exists.");

		fs.writeFileSync(file.absolute, content, options);

		return file;
	}

	/**
	 * @param options {{encoding: string, flag?: string} | string = "utf8"}
	 * @return {string} The entire content of the file.
	 */
	getContent(options = "utf8") {
		if (!this.is.file)
			throw new Error(`The node is not a file: ${this.toString()}`);

		return fs.readFileSync(this.absolute, options);
	}

	/**
	 * @return {Node[]} Children nodes of the current directory.
	 */
	get children() {
		const absolute = this.toString(); // needs '/' at end
		return fs.readdirSync(absolute)
			.map(name => this.resolve(name));
	}

	rename(to) {
		const newNode = this.parent.resolve(to);
		fs.renameSync(this.absolute, newNode.absolute);
		return newNode;
	}

	move(to) {
		return this.rename(to);
	}

	copy(to) {
		const dest = this.parent.resolve(to);

		if (this.is.file)
			fs.copyFileSync(this.absolute, dest.absolute);
		else if (this.is.directory) {
			dest.parent.newDirectory(dest.name);
			this.children.forEach(child => child.copy(path.resolve(dest.absolute, child.name)));
		}

		return dest;
	}

	/**
	 * Clear the content of the node:
	 * * file: clear content.
	 * * directory: delete children.
	 */
	clear() {
		if (!this.exists)
			throw new Error(`Node does not exist: ${this}`);

		const is = this.is;
		if (is.file)
			fs.writeFileSync(this.absolute, "", "utf8");

		else if (is.directory)
			this.children.forEach(child => child.delete());
	}

	/**
	 * Delete current node.
	 */
	delete() {
		if (!this.exists)
			return;

		const absolute = this.absolute;
		if (this.is.directory) {
			this.clear();
			fs.rmdirSync(absolute);
		} else
			fs.unlinkSync(absolute);
	}
};


const cache = new WeakValueMap();