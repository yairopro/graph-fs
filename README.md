# graph-fs
Allow to browse files like a graph where each file or directory is a node.

```
const {Node} = require("graph-fs");
```

```
const file = new Node("/path/to/file.ext");
const directory = new Node(["path", "to", "directory"]);

const sameFile = new Node("/path/to/file.ext");
sameFile === file; // true (same instance)
```

```
file.exists; // boolean
file.is.file; // true
file.is.directory; // false
```

```
directory.absolute; // "/path/to/directory"
directory.toString(); // "/path/to/directory/"
file.toString(); // "/path/to/file.ext"
file.name; // "file.ext"
```

```
const parent = file.parent // Node("/path/to/")
const directory = file.resolve("..") // idem
parent === directory // true
```

```
directory.children; // Node[]
file.getContent([options = "utf8"]); // string
```

```
directory.newFile("newFile.ext", [content]); // Node instance
directory.newDirectory("new-directory"); // Node instance
```

```
directory.clear() // delete nodes inside
directory.delete() // delete directory
```
