const { Node } = require("../src");
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
	generatedDirectory = currentDirectory.newDirectory(getRandomName());

	expect(generatedDirectory.exists).toBe(true);
});

test('Node.prototype.newFile(string, [string])', () => {
	const CONTENT = "OK";
	const generatedFile = generatedDirectory.newFile("mock", CONTENT);

	expect(generatedFile.getContent()).toBe(CONTENT);
	expect(() => cwd.getContent())
		.toThrowError();
});

test('Node.prototype.asDirectoryRecursively()', () => {
	const cDir = generatedDirectory.resolve('a/b/c')
		.asDirectoryRecursively();

	expect(cDir.exists).toBe(true);
	expect(cDir.is.directory).toBe(true);

	generatedDirectory.resolve('a').delete(); // clean
});

test('Node.prototype.overwrite(string)', () => {
	const CONTENT = "OK2";

	// test for alsready existant file
	const existantFile = generatedDirectory.resolve("mock");
	existantFile.overwrite(CONTENT);
	expect(existantFile.getContent()).toBe(CONTENT);

	// test for non existant path
	const nonExistantFile = generatedDirectory.resolve("non existant/file");
	nonExistantFile.overwrite(CONTENT);
	expect(nonExistantFile.getContent()).toBe(CONTENT);

	nonExistantFile.parent.delete(); // clean for next test node.children
});

test('Node.prototype.children', () => {
	expect(generatedDirectory.children)
		.toEqual([
			new Node(generatedDirectory.toString() + 'mock')
		]);
});

test("Node.prototype.rename(string)", () => {
	expect(generatedDirectory.exists).toBe(true);
	const newDirectory = generatedDirectory.rename(getRandomName());

	expect(generatedDirectory.exists).toBe(false);
	expect(newDirectory.exists).toBe(true);

	generatedDirectory = newDirectory;
});

test('Node.prototype.copy()', () => {
	const copyDir = generatedDirectory.copy(getRandomName());

	expect(copyDir.exists).toBe(true); // Check existence
	generatedDirectory.children.forEach(child => {
		const copyChild = copyDir.resolve(child.name);
		expect(copyChild.exists).toBe(true); // Check children existence
		if (child.is.file) // Check children contents
			expect(child.getContent()).toBe(copyChild.getContent());
	});

	copyDir.delete(); // clean
	expect(copyDir.exists).toBe(false);
});

test('Node.prototype.clear', () => {
	const child = generatedDirectory.children[0]; // keep ref to deleted child

	child.clear();
	expect(child.getContent())
		.toBe("");

	generatedDirectory.clear();
	expect(generatedDirectory.children)
		.toEqual([]);

	expect(() => child.clear())
		.toThrowError();
});

test('Node.prototype.delete()', () => {
	generatedDirectory.delete();
	expect(generatedDirectory.exists)
		.toBe(false);
});


// ----- utility ----
let last;
function getRandomName() {
	while (last === Date.now());
	return String(last = Date.now());
}
