// 
// MaxPatch to Pd Converter
// written by Timo Hoogland, 2020
// 
// MIT License
// 

const fs = require('fs-extra');
const path = require('path');

if (process.argv[2] === undefined){
	console.error("Please provide a .maxpat file as argument");
	return;
} else {
	let f = process.argv[2];
	if (f.match(/.*\.maxpat$/) === null){
		console.error("Please provide a .maxpat file as argument");
		return;
	} else {
		convertPd(process.argv[2]);
	}
}

function convertPd(file) {
	// string for output text
	let pd = "";
	// read the maxpatch
	let patch = fs.readJsonSync(file);
	// window settings
	let window = patch.patcher.rect;
	// all objects in patch
	let objects = patch.patcher.boxes;
	// all connections between objects
	let lines = patch.patcher.lines;
	// storage for object connection id's
	let connections = [];
	
	// canvas line
	pd = "#N canvas " + window.join(" ") + " 10;";
	
	// all objects
	objects.forEach((obj) => {
		let pos = obj.box.patching_rect.slice(0, 2).join(" ");
		let type = obj.box.maxclass;
		connections.push(obj.box.id);
		
		pd += "\n#X";
		
		if (type === 'number' || type === 'flonum'){
			pd += " floatatom " + pos + " 8 " + "0 0 0" + " - - -, " + "f 8";
		} else if (type === 'message'){
			pd += " msg " + pos + " " + obj.box.text;
		} else if (type === 'newobj'){
			pd += " obj " + pos + " " + obj.box.text;
		} else if (type === 'toggle'){
			pd += " obj " + pos + " tgl 15 0 empty empty empty 17 7 0 10 -262144 -1 -1 0 1";
		} else if (type === 'button'){
			pd += " obj " + pos + " bng 15 250 50 0 empty empty empty 17 7 0 10 -262144 -1 -1";
		}
		
		pd += ";";
	});
	
	// all connections
	lines.forEach((ln) => {
		let connect = [];
		connect.push(connections.indexOf(ln.patchline.source[0]));
		connect.push(ln.patchline.source[1]);
		connect.push(connections.indexOf(ln.patchline.destination[0]));
		connect.push(ln.patchline.destination[1]);
		
		pd += "\n#X";
		pd += " connect " + connect.join(" ") + ";";
	});
	
	// write output file
	let fInfo = path.parse(file);
	let outFile = path.join(fInfo.dir, fInfo.name + '.pd');
	fs.writeFile(outFile, pd);
}

/*
let pdMapping = {
	'number' : {
		'name' : 'floatatom'
	},
	'message' : {
		'name' : 'msg'
	},
	'newobj' : {
		'name' : 'obj'
	},
	'toggle' : {
		'name' : 'tgl'
	},
	'button' : {
		'name' : 'bng'
	}
}*/