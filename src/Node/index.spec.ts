import Node from './index'
import {sep as separator} from "path"

const testingDirectoryName = '_testingDirectory';
const testingDirectory = new Node(process.cwd()).resolve(testingDirectoryName);

beforeAll(() => testingDirectory.asDirectory().clear())
afterAll(() => testingDirectory.delete());


test('Node constructor', () => {
	const currentDir = new Node(__dirname);
	expect(currentDir).toBeDefined();

	expect(new Node(__dirname)).toBe(currentDir);
});

test('Node.prototype.toString()', () =>
	expect(testingDirectory.toString())
		.toBe(testingDirectory.path + separator)
);

test('Node.prototype.name', () => {
	expect(testingDirectory.basename)
		.toBe(testingDirectoryName);
});

test('Node.prototype.exists', () => {
	expect(testingDirectory.exists).toBe(true);

	const nonExistingFile = new Node('a/b/c');
	expect(nonExistingFile.exists).toBe(false);
});

test('Node.prototype.parent', () => {
	const currentFile = new Node(__filename);
	const currentDirectory = new Node(__dirname);

	expect(currentFile.parent)
		.toBe(currentDirectory);

	expect(Node.root.parent).toBe(undefined);
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


test('Node.prototype.newDirectory(string)', () => {
	const generatedDirectory = testingDirectory.newDirectory('Node.prototype.newDirectory');
	expect(generatedDirectory.exists).toBe(true);
});

test('Node.prototype.newFile(string, [string])', () => {
	const CONTENT = "OK";
	const generatedFile = testingDirectory.newFile("Node.prototype.newFile", CONTENT);

	expect(generatedFile.getContent()).toBe(CONTENT);
	expect(() => testingDirectory.getContent())
		.toThrowError();
});

test('Node.prototype.asDirectory()', () => {
	const cDir = testingDirectory.resolve('Node.prototype.asDirectory/a/b/c')
		.asDirectory();

	expect(cDir.exists).toBe(true);
	expect(cDir.is.directory).toBe(true);
});

test('Node.prototype.overwrite(string)', () => {
	const CONTENT = "No";

	// test on non existing file
	const file = testingDirectory.resolve("Node.prototype.overwrite");
	expect(file.exists).toBe(false);
	file.overwrite(CONTENT);
	expect(file.getContent()).toBe(CONTENT);

	// test on existing file
	const CONTENT2 = "Yes";
	file.overwrite(CONTENT2);
	expect(file.getContent()).toBe(CONTENT2);
});

test('Node.prototype.children', () => {
	const dir = testingDirectory.newDirectory('Node.prototype.children');
	expect(dir.children)
		.toEqual([]);

	const child1 = dir.newDirectory('1');
	const child2 = dir.newDirectory('2');
	const child3 = dir.newFile('3');

	expect(dir.children)
		.toEqual([child1, child2, child3]);
});

test("Node.prototype.rename(string)", () => {
	const dir = testingDirectory.newDirectory('Node.prototype.rename');

	// rename directory
	const a = dir.newDirectory('a');
	const b = a.rename('b');
	expect(a.exists).toBe(false);
	expect(b.exists).toBe(true);
	expect(b.basename).toBe('b');

	// rename file
	const f1 = dir.newFile('f1');
	const f2 = dir.rename('f2');
	expect(f1.exists).toBe(false);
	expect(f2.exists).toBe(true);
	expect(f2.basename).toBe('f2');
});

test('Node.prototype.copy()', () => {
	const dir = testingDirectory.newDirectory('Node.prototype.copy');

	// copy file
	const file1 = dir.newFile('1', String(Date.now()));
	const file2 = file1.copy('2');
	expect(file2.exists).toBe(true);
	expect(file2.getContent()).toBe(file1.getContent());

	// copy file overwrite
	file1.overwrite(String(Date.now() + 1));
	expect(() => file1.copy('2')).toThrowError();
	file1.copy('2', true);
	expect(file2.getContent()).toBe(file1.getContent());

	// copy file in dir
	const dirA = dir.newDirectory('a');
	const subFile2 = file1.copy(dirA);
	expect(subFile2.parent).toBe(dirA);
	expect(subFile2.getContent()).toBe(file1.getContent());

	// copy dir
	dirA.newDirectory('sub').newFile(String(Date.now()));
	const dirB = dirA.copy('b');
	expect(dirB.exists).toBe(true);

	expect(getFilesTable(dirB)).toEqual(getFilesTable(dirA));

	// copy dir in dir
	const dirC = dir.newDirectory('c');
	dirA.copy(dirC);
	expect(
		getFilesTable(dirC.resolve(dirA.basename))
	).toEqual(getFilesTable(dirA));

	// overwrite dir to  file
	const fileD = dir.newFile('d');
	expect(() => dirA.copy(fileD)).toThrowError();
	dirA.copy(fileD, true);
	expect(getFilesTable(fileD)).toEqual(getFilesTable(dirA));
});

test('Node.prototype.clear', () => {
	const dir = testingDirectory.newDirectory('Node.prototype.clear');
	const subDir = dir.newDirectory('a');
	const subFile = subDir.newFile('f', '__');

	subFile.clear();
	expect(subFile.getContent()).toBe('');

	expect(subDir.children).toEqual([subFile]);
	subDir.clear();
	expect(subFile.exists).toBe(false);
	expect(subDir.children).toEqual([]);
});

test('Node.prototype.delete()', () => {
	const dir = testingDirectory.newDirectory('Node.prototype.delete');
	const subDir = dir.newDirectory('a');
	const file1 = subDir.newFile('1', '__');
	const file2 = subDir.newFile('2', '__');

	expect(file1.exists).toBe(true);
	file1.delete();
	expect(file1.exists).toBe(false);

	expect(subDir.children).toEqual([file2]);
	subDir.delete();
	expect(file2.exists).toBe(false);
	expect(subDir.exists).toBe(false);
});



/**
 * Returns a table of all descendant files.
 * [path from dir, content][]
 */
function getFilesTable(dir: Node): [string, string][] | undefined {
	return dir.getDescendants()?.filter(child => child.is.file)
		.map(file => {
			const path = file.path.slice(dir.path.length);
			return [path, file.getContent()];
		});
}