import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, renameSync, WriteFileOptions, writeFileSync, rmSync } from "fs";
import { basename, extname, resolve, sep } from "path";
import { toString } from "../utils";
const WeakValueMap = require("weak-value")


export default class Node {
	path: string;

	constructor(absolutePath: string | string[]) {
		const pathAsArray = Array.isArray(absolutePath) ? absolutePath
			: [absolutePath];

		this.path = resolve(...pathAsArray);

		const cached = cache.get(this.path);
		if (cached)
			return cached;

		cache.set(this.path, this);
	}

	/**
	 * @return {string} Absolute path without '/' at the end.
	 * @deprecated Use toString().
	 */
	get absolute(): string {
		return this.path;
	}

	/**
	 * @return {string} Absolute path with '/' at the end for directories.
	 */
	toString(): string {
		let absolute = this.path;
		if (this.is.directory)
			absolute += sep;

		return absolute;
	}

	/**
	 * @return {string} Full name of the node.
	 */
	get basename(): string {
		return basename(this.path);
	}

	/**
	 *  @return The last part of the basename after the last dot, or undefined if there's no dot in the basename.
	 */
	get extension(): string | undefined {
		return extname(this.path) || undefined;
	}

	/**
	 * @return True if the node exists.
	 */
	get exists(): boolean {
		return existsSync(this.path);
	}

	/**
	 * @return Parent node.
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
		try {
			const infos = lstatSync(this.path);
			return {
				file: infos.isFile(),
				directory: infos.isDirectory(),
			};
		}
		catch (_) {
			return {
				file: false,
				directory: false,
			};
		}
	}

	/**
	 * Similar to path.resolve() but returns a node rather than a string.
	 */
	resolve(relative: string): Node {
		const relativePath = toString(relative);
		const absolute = resolve(this.path, relativePath!);
		return new Node(absolute);
	}

	resolveSibling(relativePath: string): Node | undefined {
		return this.parent?.resolve(relativePath);
	}

	/**
	 * Creates a sub-directory.
	 * If it already exists, it doesn't do anything.
	 */
	newDirectory(name: string): Node {
		const directory = this.resolve(name);
		mkdirSync(directory.path, { recursive: true });
		return directory;
	}

	/**
	 * Create a sub-file. Throw an error if it already exists.
	 * @param name Name of the file to create as child of current node.
	 * @param content Content to write inside the file at its creation.
	 * @param options Encoding. Default "utf8".
	 * @return {Node} Node instance of the new created child file.
	 */
	newFile(
		name: string,
		content: string | NodeJS.ArrayBufferView = "",
		options: WriteFileOptions = "utf8"
	): Node {
		const file = this.resolve(name);

		if (file.exists)
			throw new Error("File already exists.");

		writeFileSync(file.path, content, options);
		return file;
	}

	/**
	 * Returns the content of a file.
	 * Throw an error if the node isn't an existing file.
	 */
	getContent(options: BufferEncoding = "utf8"): string {
		return readFileSync(this.path, options);
	}

	/**
	 * Children nodes of the current node.
	 * Returns undefined if the node isn't an existing directory.
	 */
	get children(): Node[] | undefined {
		if (this.is.directory) {
			return readdirSync(this.path)
				.map(name => this.resolve(name));
		}
	}

	getDescendants(): Node[] {
		return this.children
			?.map((child: Node) => [child, child.getDescendants()])
			.flat(Infinity)
			.filter(Boolean) as Node[];
	}

	rename(to: string): Node {
		const newNode = this.resolveSibling(to);
		if (!newNode)
			throw new Error(`Unable to rename ${this}`);

		renameSync(this.path, newNode.path);
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
		if (!destination)
			throw new Error(`Unable to move ${this}`);

		return moveOrCopy(
			this, destination,
			overwrite,
			terminal => this.rename(terminal.path)
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
		const destination = to instanceof Node ? to : this.resolveSibling(to);
		if (!destination)
			throw new Error(`Unable to copy ${this}`);

		return moveOrCopy(
			this, destination,
			overwrite,
			terminal => {
				if (this.is.file) {
					terminal.parent?.asDirectory();
					copyFileSync(this.path, terminal.path);
				}
				else {
					terminal.asDirectory();
					this.children?.forEach(child =>
						child.copy(terminal.resolve(child.basename))
					);

					// @since — v16.7.0
					// @experimental
					// fs.cpSync(this.path, terminal.path)
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
			writeFileSync(this.path, "", "utf8");
		else {
			this.delete();
			this.asDirectory();
		}

		return this;
	}

	/**
	 * Delete current node.
	 */
	delete(): this {
		rmSync(this.path, { recursive: true, force: true });
		return this;
	}

	/**
	 * Force to write the content into the node.
	 * If the node doesn't exist, it will create all the path to it.
	 * If the node already exists, it will erase its content.
	 * @returns The current node.
	 */
	overwrite(
		content: string | Buffer = "",
		options: WriteFileOptions = "utf8"
	): Node {
		if (!this.parent)
			throw new Error("Cannot overwrite root directory.");

		this.parent.asDirectory();
		writeFileSync(this.path, content, options)

		return this;
	}

	/**
	 * Creates the node as a directory, with all its ascendants.
	 * Useful to make sure a directory exists before adding content to it.
	 */
	asDirectory() {
		mkdirSync(this.path, { recursive: true });
		return this;
	}

	cat = this.getContent.bind(this)
	mv = this.move.bind(this)
	cp = this.copy.bind(this)
	rm = this.delete.bind(this)
	mkdir = this.newDirectory.bind(this)
	ls = () => this.children


	// ---
	static root: Node;
}

// -----

const cache = new WeakValueMap();
// Node constructor is dependant on the cache, so its has to be initialized first (above)
Node.root = new Node(sep);


// ---
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
		const subDestination = destination.resolve(origin.basename);
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