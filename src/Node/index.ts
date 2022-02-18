import { toString } from "../utils";
import path from "path";
import fs, { WriteFileOptions } from "fs";
const WeakValueMap = require("weak-value");
const { last, flatten, pipe, map, filter } = require('ramda');

export default class Node {
	path: string[] = [];

	constructor(absolutePathArg: string | string[]) {
		let absolutePath: string[];

		// convert to array
		if (typeof absolutePathArg === "string") {
			absolutePath = absolutePathArg.split('/');

			// remove empty string at start
			if (!absolutePath[0])
				absolutePath = absolutePath.slice(1);
			// remove empty string at end
			const lastNodeName = last(absolutePath);
			if (!lastNodeName)
				absolutePath = absolutePath.slice(0, -1);
		}
		else
			absolutePath = absolutePathArg;

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
	get absolute(): string {
		return '/' + this.path.join('/');
	}

	/**
	 * @return {string} Absolute path with '/' at the end for directories.
	 */
	toString(): string {
		let absolute = this.absolute;
		if (this.is.directory)
			absolute += '/';
		return absolute;
	}

	/**
	 * @return {string} Full name of the node.
	 */
	get name(): string {
		return last(this.path);
	}

	get extension(): string | undefined {
		if (this.is.file) {
			const splittedName = this.name.split('.');
			if (splittedName.length > 1)
				return last(splittedName);
			return "";
		}
	}

	/**
	 * @return {boolean} If the node exists.
	 */
	get exists(): boolean {
		return fs.existsSync(this.absolute);
	}

	/**
	 * @return {Node} Parent node.
	 */
	get parent(): Node | undefined {
		const parent = this.resolve("..");
		if (parent !== this)
			return parent;
	}

	/**
	 * An object that indicates the node's type.
	 */
	get is(): { file: boolean, directory: boolean } {
		const infos = this.exists ? fs.lstatSync(this.absolute) : undefined;
		return {
			file: infos?.isFile() || false,
			directory: infos?.isDirectory() || false,
		};
	}

	/**
	 * Similar to path.resolve() but returns a node rather than a string.
	 */
	resolve(relative: string): Node {
		relative = toString(relative) as string;
		const absolute = path.resolve(this.absolute, relative);
		return new Node(absolute);
	}

	resolveSibling(relative: string): Node {
		return (this.parent || this).resolve(relative);
	}

	/**
	 * Creates a sub-directory. 
	 * If it already exists, it doesn't do anything.
	 */
	newDirectory(name: string): Node {
		const directory = this.resolve(name);

		if (!directory.exists)
			fs.mkdirSync(directory.absolute);

		return directory;
	}

	/**
	 * Create a sub-file. Throw an error if it already exists.
	 * @param fullName Name of the file to create as child of current node.
	 * @param content Content to write inside the file at its creation.
	 * @param options Encoding. Default "utf8".
	 * @return {Node} Node instance of the new created child file.
	 */
	newFile(fullName: string, content: string | NodeJS.ArrayBufferView = "", options: WriteFileOptions = "utf8"): Node {
		const file = this.resolve(fullName);

		if (file.exists)
			throw new Error("File already exists.");

		fs.writeFileSync(file.absolute, content, options);

		return file;
	}

	/**
	 * Returns the content of a file.
	 * Throw an error if the node isn't an existing file.
	 */
	getContent(options: BufferEncoding = "utf8"): string {
		if (!this.is.file)
			throw new Error(`The node is not a file: ${this.toString()}`);

		return fs.readFileSync(this.absolute, options);
	}

	/**
	 * Children nodes of the current node.
	 * Returns undefined if the node isn't an existing directory.
	 */
	get children(): Node[] | undefined {
		if (this.is.directory) {
			const absolute = this.toString(); // needs '/' at end
			return fs.readdirSync(absolute)
				.map(name => this.resolve(name));
		}
	}

	get descendants(): Node[] | undefined {
		if (this.children)
			return pipe(
				map((child: Node) => [child, child.descendants]),
				flatten,
				filter(Boolean),
			)(this.children) as Node[];
	}

	rename(to: string): Node {
		const newNode = this.resolveSibling(to);
		fs.renameSync(this.absolute, newNode.absolute);
		return newNode;
	}

	/**
	 * Move the node to the destination.
	 * - If the destination doesn't exist, it copies to it.
	 * - If the destination is a file, it throws an error unless overwrite paremeter is true.
	 * - If the destination is a folder, it will to copy inside of it keeping the name. 
	 * 		If the sub-node already exists, it throws an error unless overwrite paremeter is true.
	 * @param to Destination node or path.
	 * @param overwrite Overwrite the existing destination if true.
	 * @returns The destination node.
	 */
	move(to: string | Node, overwrite?: boolean): Node {
		const destination = to instanceof Node ? to : this.resolveSibling(to);

		return moveOrCopy(
			this, destination,
			overwrite,
			terminal => this.rename(terminal.toString())
		);
	}

	/**
	 * Copy the node to the destination.
	 * - If the destination doesn't exist, it copies to it.
	 * - If the destination is a file, it throws an error unless overwrite paremeter is true.
	 * - If the destination is a folder, it will to copy inside of it keeping the name. 
	 * 		If the sub-node already exists, it throws an error unless overwrite paremeter is true.
	 * @param to Destination node or path.
	 * @param overwrite Overwrite the existing destination if true.
	 * @returns The destination node.
	 */
	copy(to: string | Node, overwrite?: boolean): Node {
		const destination: Node = to instanceof Node ? to : this.resolveSibling(to);

		return moveOrCopy(
			this, destination,
			overwrite,
			terminal => {
				if (this.is.file) {
					terminal.parent?.asDirectoryRecursively();
					fs.copyFileSync(this.absolute, terminal.toString());
				}
				else {
					terminal.asDirectoryRecursively();
					this.children?.forEach(child =>
						child.copy(terminal.resolve(child.name))
					);
				}
			}
		);
	}

	/**
	 * Clear the content of the node:
	 * * for a file: clear content.
	 * * for a directory: delete its descendants.
	 */
	clear(): Node {
		if (this.is.file)
			fs.writeFileSync(this.absolute, "", "utf8");
		else if (this.children) {
			this.delete();
			this.asDirectoryRecursively();
		};

		return this;
	}

	/**
	 * Delete current node.
	 */
	delete(): void {
		if (this.exists)
			fs.rmSync(this.toString(), { recursive: true, force: true });
	}

	/**
	 * Force to write the content into the node.
	 * If the node doesn't exist, it will create all the path to it.
	 * If the node already exists, it will erase its content.
	 * @returns The current node.
	 */
	overwrite(content: string | Buffer = "", options: WriteFileOptions = "utf8"): Node {
		if (!this.parent)
			throw new Error('Cannot overwrite root directory.');

		this.delete();
		this.parent.asDirectoryRecursively();
		this.parent.newFile(this.name, content, options);

		return this;
	}

	/**
	 * Creates the node as a directory, with all its ascendants.
	 * Usefull to make sure a directory exists before adding content to it.
	 */
	asDirectoryRecursively() {
		if (!this.exists)
			fs.mkdirSync(this.toString(), { recursive: true });
		else if (this.is.file)
			throw new Error('Node already exists as a file: ' + this.toString());

		return this;
	}
}


const cache: any = new WeakValueMap();

function createCollisionError(destination: Node | string): Error {
	return new Error(`Destination file already exists. Set 2nd parameter to true to overwrite.\nDestination: ${destination}`);
}

function moveOrCopy(
	origin: Node,
	destination: Node,
	overwrite: boolean | undefined,
	run: (node: Node) => void,
): Node {
	function handleCollision(finalDestination: Node) {
		if (finalDestination.exists) {
			if (!overwrite)
				throw createCollisionError(finalDestination);
			finalDestination.delete();
		}
	}

	if (destination.is.directory) { // move inside the existing directory
		const subDestination = destination.resolve(origin.name);
		handleCollision(subDestination);
		run(subDestination);
		return subDestination;
	}
	else { // move and rename the file
		handleCollision(destination);
		run(destination);
		return destination;
	}
}