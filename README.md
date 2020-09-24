# 🚀 graph-fs
Allow to browse files like a graph where each file or directory is a node.

```javascript
const {Node} = require("graph-fs");
```

**Instantiate**
```javascript
const directory = new Node("/path/to/directory");

const file = directory.resolve('file.ext');
const sameFile = new Node("/path/to/directory/file.ext");

sameFile === file; // true (same instance)
```

**Get infos**
```javascript
myFile.exists; // boolean

myFile.is.file; // true
myFile.is.directory; // false

myDirectory.is.directory; // true
myDirectory.is.file; // false
```

**Path & name**
```javascript
myDirectory.toString(); // "/path/to/directory/"
myDirectory.absolute; // "/path/to/directory"
myDirectory.name; // "directory"

myFile.toString(); // "/path/to/file.ext"
myFile.absolute; //   "/path/to/file.ext"
myFile.name; // "file.ext"
```

**Navigate**
```javascript
const parent = file.parent
const sameParent = file.resolve("..")
parent === sameParent // true
```

**Read**
```javascript
directory.children; // Node[] of files and directories
file.getContent([options = "utf8"]); // string
```

**Create**
```javascript
directory.newFile("newFile.ext", [content]); // Node instance
directory.newDirectory("new-directory"); // Node instance
```

**Rename**
```javascript
const changedDir = directory.rename('changed'); // Node instance
directory.exists; // false
changedDir.exists; // true
```

**Copy**
```javascript
const me2 = directory.copy('me2'); // Node instance
directory.exists; // true
me2.exists; // true
```

**Move**
```javascript
const newLocation = directory.move('newLocation'); // Node instance
directory.exists; // false
newLocation.exists; // true
```


**Clean**
```javascript
directory.clear() // delete all what's inside the directory
directory.delete() // delete the directory
```
