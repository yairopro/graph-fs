# graph-fs
Allow to browse files like a graph where each file or directory is a node.

```
const {Node} = require("graph-fs");
```

**Instantiate**
```
const file = new Node("/path/to/file.ext");
const directory = new Node(["path", "to", "directory"]);

const sameFile = new Node("/path/to/file.ext");
sameFile === file; // true (same instance)
```

**Get infos**
```
file.exists; // boolean
file.is.file; // true
file.is.directory; // false
```

**Path & name**
```
directory.absolute; // "/path/to/directory"
directory.toString(); // "/path/to/directory/"
file.toString(); // "/path/to/file.ext"
file.name; // "file.ext"
```

**Navigate**
```
const parent = file.parent // Node("/path/to/")
const directory = file.resolve("..") // idem
parent === directory // true
```

**Read**
```
directory.children; // Node[]
file.getContent([options = "utf8"]); // string
```

**Create**
```
directory.newFile("newFile.ext", [content]); // Node instance
directory.newDirectory("new-directory"); // Node instance
```

**Rename**
```
const changedDir = directory.rename('changed'); // Node instance
directory.exists; // false
changedDir.exists; // true
```

**Copy**
```
const me2 = directory.copy('me2'); // Node instance
directory.exists; // true
me2.exists; // true
```

**Move**
```
const newLocation = directory.move('newLocation'); // Node instance
directory.exists; // false
newLocation.exists; // true
// (Just the same as rename() behind.. 🤫)
```


**Clean**
```
directory.clear() // delete nodes inside
directory.delete() // delete directory
```
