var fs      = require("fs");
var path    = require("path");
var cluster = require("cluster");
var exec    = require("child_process").execSync;
var uniq    = require("uniq");
var storage = path.join(process.env.HOME, ".when_master");
var sources = [];
var exited  = false;
var started = false;

// Ensure process storage exists.
if (!fs.existsSync(storage)) fs.mkdirSync(storage);

process
	.on("exit", exit)
	.on("SIGTERM", exit)
	.on("SIGINT", exit);

module.exports = function whenMaster (source) {
	if (!started) {
		started = true;
		init(source);
	}

	var processes = getAll(source);

	if (processes.indexOf(process.pid) === -1) {
		processes.push(process.pid);
		save(source, processes);
	}

	var isMaster = processes[0] === process.pid;
	if (isMaster && typeof fn === "function") fn();
	return isMaster;
};

function init (source) {
	sources = uniq(sources.concat(source));
	if (!fs.existsSync(path.join(storage, source))) save(source, [process.pid]);
	else {
		// Make sure existing processes are still online.
		var ids = (exec("ps ax | awk '{print $1}'") || "")
			.toString()
			.split("\n")
			.map(Number)
			.filter(Number);

		save(source, uniq(getAll(source)
			.filter(function (id) { return ~ids.indexOf(id); })
			.concat(process.pid)
		));
	}
}

function exit () {
	if (!exited) {
		exited = true;
		sources.forEach(function (source) {
			var processes = getAll(source);
			processes.splice(processes.indexOf(process.pid), 1);
			save(source, processes);
		});
	};
	process.exit();
}

function save (source, processes) {
	fs.writeFileSync(path.join(storage, source), JSON.stringify(processes));
}

function getAll (source) {
	try {
		return JSON.parse(fs.readFileSync(path.join(storage, source), "utf8")) || [];
	} catch (_) {
		return [];
	}
}
