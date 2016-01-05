var fs      = require("fs");
var path    = require("path");
var cluster = require("cluster");
var exec    = require("child_process").execSync;
var uniq    = require("uniq");
var storage = path.join(__dirname, "__master");
var exited  = false;

if (!fs.existsSync(storage)) save([process.pid]);
else {
	// Make sure existing processes are still online.
	var ids = exec("ps ax | awk '{print $1}'")
		.toString()
		.split("\n")
		.map(Number)
		.filter(Number);

	save(uniq(getAll()
		.filter(function (id) { return ~ids.indexOf(id); })
		.concat(process.pid)
	));
}

process
	.on("exit", exit)
	.on("SIGTERM", exit)
	.on("SIGINT", exit);

module.exports = function whenMaster (fn) {
	var processes = getAll();

	if (processes.indexOf(process.pid) === -1) {
		processes.push(process.pid);
		save(processes);
	}

	var isMaster = processes[0] === process.pid;
	if (isMaster && typeof fn === "function") fn();
	return isMaster;
};

function exit () {
	if (exited) return;
	exited = true;
	var processes = getAll();
	processes.splice(processes.indexOf(process.pid), 1);
	save(processes);
}

function save (processes) {
	fs.writeFileSync(storage, JSON.stringify(processes));
}

function getAll () {
	return JSON.parse(fs.readFileSync(storage, "utf8") || "[]");
}
