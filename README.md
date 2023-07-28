
![plot](./graph-fs.png)

Please, star on github if you like this package. ⭐️

---

```typescript
const {Node} = require("graph-fs");
```

**Instantiate**
```typescript
const directory = new Node("/path/to/directory");
const file = directory.resolve('file.ext');

const sameFile = new Node("/path/to/directory/file.ext");

sameFile === file; // true (same instance)
```

**Get infos**
```typescript
myFile.exists; // boolean

myFile.is.file; // true
myFile.is.directory; // false
```

**Path, name & extension**
```typescript
const file = new Node(__filename);
file.toString(); // "/path/to/file.js"
file.basename; // "file.js"
file.extension; // "js"
```

**Navigate**
```typescript
const parent = file.parent;
const notes = file.resolve("notes.txt");
const children = directory.children; // children Node[]
const descendants = directory.getDescendants; // All descendants nodes flattened
```

**Read**
```typescript
const content = file.getContent(); // accepts fs options as parameter
```

**Create**
```typescript
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
```typescript
// create a new file
const newFile = directory.newFile("newFile.ext", [content]);

// force to write a file, even if it or its parents, still don't exist. It will create the full path to it.
file.overwrite(contentString);
```

**Rename**
```typescript
const changedDir = directory.rename('changed'); // Node instance
directory.exists; // false
changedDir.exists; // true
```

**Copy**
```typescript
const me2 = directory.copy('me2'); // Node instance
directory.exists; // true
me2.exists; // true
```

**Move**
```typescript
const newLocation = directory.move('newLocation'); // Node instance
directory.exists; // false
newLocation.exists; // true
```


**Clean**
```typescript
directory.clear() // delete all what's inside the directory
directory.delete() // delete the directory
```


Breaking changes from v0 to v1:  
	- `.path` is a string.
	- `.name` is now `.basename`.
	- `.descendants` is now `.getDescendants()`
	- `.asDirectoryRecursively()` is now `.asDirectory()`
