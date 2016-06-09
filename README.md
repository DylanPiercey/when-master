# When Master

Utility to request a master role in a multi server cluster.

# Why
This works well in pm2 or other environments where we want one process to do something, but not necessarily the master.
It works by creating a temporary file that stores the pid of the first process to call the function.

# Installation

#### Npm
```console
npm install when-master
```

# Usage
```js
var whenMaster = require("when-master");

// In process A
whenMaster("appA"); //-> true

// In process B
whenMaster("appA"); //-> false
whenMaster("appB"); //-> true

// Later in process A
whenMaster("appB"); //-> false

// In process B after process A exits
whenMaster("appA"); //-> true
```
