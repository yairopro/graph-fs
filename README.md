# graph-fs
Allow to browse files like a graph where each file or directory is a node.


```
const file = new Node("/path/to/file.ext");
const directory = new Node(["path", "to", "directory"]);

const sameFile = new Node("/path/to/file.ext");
sameFile === file; // true

file.is.file; // true
file.is.directory; // false

file.exists; // boolean

directory.absolute; // "/path/to/directory"
directory.toString(); // "/path/to/directory/"
file.toString(); // "/path/to/file.ext"
file.name; // "file.ext"

file.parent // Node("/path/to/")
file.resolve("..") // Node("/path/to/")

directory.children; // Node[]
file.getContent([options = "utf8"]); // string or buffer

const newfile = directory.newFile("newFile.ext", [string content]);
const newDirectory = directory.newDirectory("new-directory");

directory.clear() // delete nodes inside
directory.delete() // delete directory
```
