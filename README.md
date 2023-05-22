# ❄️ graph-fs
Browse files and directories like in a graph.

Leave a star on github please if you like this package 🙏🏻


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
```

**Path & name**
```javascript
myFile.basename; // "file.ext"
myFile.toString(); // "/path/to/file.ext"
```

**Navigate**
```javascript
const parent = file.parent;
const notes = file.resolve("notes.txt");
const children = directory.children; // children Node[]
const descendants = directory.getDescendants; // All descendants nodes flattened
```

**Read**
```javascript
const content = file.getContent(); // accepts fs options as parameter
```

**Create**
```javascript
 // create a new directory
const newDirectory = directory.newDirectory("new-directory");

// create a directory recursively
const target = dir.resolve('this/path/does/not/exists');
target.exists; // false
target.asDirectory();
target.exists; // true
target.is.directory; // true
```

**Write**
```javascript
// create a new file
const newFile = directory.newFile("newFile.ext", [content]);

// force to write a file, even if it or its parents, still don't exist. It will create the full path to it.
file.overwrite(contentString);
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


Breaking changes from v0 to v1:  
	- `.path` is a string.
	- `.name` is now `.basename`.
	- `.descendants` is now `.getDescendants()`
	- `.asDirectoryRecursively()` is now `.asDirectory()`
