"use strict"
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
const getPaths = require("./getPaths");
const forEachBail = require("./forEachBail");
const assign = require("object-assign");

class SymlinkPlugin {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}

	apply(resolver) {
		let target = this.target;
		resolver.plugin(this.source, function(request, callback) {
			let _this = this;
			let fs = _this.fileSystem;
			let pathsResult = getPaths(request.path);
			let pathSeqments = pathsResult.seqments;
			let paths = pathsResult.paths;

			let containsSymlink = false;
			forEachBail(paths.map(function(_, i) {
				return i;
			}), function(idx, callback) {
				fs.readlink(paths[idx], function(err, result) {
					if(!err && result) {
						pathSeqments[idx] = result;
						containsSymlink = true;
						// Shortcut when absolute symlink found
						if(/^(\/|[a-zA-z]:($|\\))/.test(result))
							return callback(null, idx);
					}
					callback();
				});
			}, function(err, idx) {
				if(!containsSymlink) return callback();
				let resultSeqments = typeof idx === "number" ? pathSeqments.slice(0, idx + 1) : pathSeqments.slice();
				let result = resultSeqments.reverse().reduce(function(a, b) {
					return _this.join(a, b);
				});
				let obj = assign({}, request, {
					path: result
				});
				resolver.doResolve(target, obj, "resolved symlink to " + result, callback);
			});
		});
	};
}

module.exports = SymlinkPlugin;
