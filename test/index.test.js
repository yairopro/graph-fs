const {Node} = require("../src");
const cwd = new Node(process.cwd());

test('new Node(string)', () =>
	expect(new Node("/a/b/c"))
		.toBeDefined()
);

test('new Node(array)', () =>
	expect(new Node(['a', 'b', 'c']))
		.toBeDefined()
);

test('Node singleton by path', () =>
	expect(new Node("/a/b/c"))
		.toBe(new Node(['a', 'b', 'c']))
);

test('Node.prototype.toString()', () =>
	expect(cwd.toString())
		.toBe(process.cwd() + '/')
);

test('Node.prototype.name', () => {
	const testFile = __filename.split('/').slice(-1)[0];
	expect(new Node(__filename).name)
		.toBe(testFile)
});

test('Node.prototype.exists', () => {
	const currentFile = new Node(__filename);
	expect(currentFile.exists).toBe(true);

	const falseFile = new Node(__filename + "/impossible.file");
	expect(falseFile.exists).toBe(false);
});

test('Node.prototype.parent', () => {
	const currentFile = new Node(__filename);
	const currentDirectory = currentFile.parent;

	expect(currentDirectory)
		.toBe(new Node(__dirname))
});

test('Node.prototype.is', () => {
	const currentFile = new Node(__filename);
	const currentDirectory = new Node(__dirname);

	expect(currentFile.is.file).toBe(true);
	expect(currentFile.is.directory).toBe(false);
	expect(currentDirectory.is.file).toBe(false);
	expect(currentDirectory.is.directory).toBe(true);
});

test('Node.prototype.resolve(string)', () => {
	const currentFile = new Node(__filename);
	const currentDirectory = currentFile.parent;

	expect(currentFile.resolve(".."))
		.toBe(currentDirectory);
});


let generatedDirectory;
test('Node.prototype.newDirectory(string)', () => {
	const currentDirectory = new Node(__dirname);

	const subDirectoryName = String(Date.now());
	generatedDirectory = currentDirectory.newDirectory(subDirectoryName);

	expect(generatedDirectory.exists).toBe(true);
});

test('Node.prototype.newFile(string, [string])', () => {
	const content = "OK";
	const generatedFile = generatedDirectory.newFile("mock", content);

	expect(generatedFile.getContent()).toBe(content);
	expect(() => cwd.getContent())
		.toThrowError();
});

test('Node.prototype.children', () => {
	expect(generatedDirectory.children)
		.toEqual([
			new Node(generatedDirectory.toString() + 'mock')
		]);
});

test('Node.prototype.clear', () => {
	generatedDirectory.clear();
	expect(generatedDirectory.children)
		.toEqual([]);
});

test('Node.prototype.delete()', () => {
	generatedDirectory.delete();
	expect(generatedDirectory.exists)
		.toBe(false);
});

