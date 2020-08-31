// 
// MaxPatch to Pd Converter
// written by Timo Hoogland, 2020
// 
// MIT License
// 

const fs = require('fs-extra');
const path = require('path');

const patchTemplate = require('./data/maxpat.json')
let pat = { ...patchTemplate }

const mapping = {
	'text' : {
		'maxclass' : 'comment',
	},
	'msg' : {
		'maxclass' : 'message',
	},
	'floatatom' : {
		'maxclass' : 'flonum',
	},
	'tgl' : {
		'maxclass' : 'toggle',
	},
	'bng' : {
		'maxclass' : 'bang',
	},
	'vsl' : {
		'maxclass' : 'slider',
		'orientation' : 1
	},
	'hsl' : {
		'maxclass' : 'slider',
		'orientation' : 2
	}
}

const maxObject = {
	"box" : {
		"id" : "",
		"maxclass" : "comment",
		// "numinlets" : 1,
		// "numoutlets" : 0,
		"patching_rect" : [ 45.0, 45.0, 150.0, 20.0 ],
		"text" : ""
	}
}

const processPd = {
	'canvas' : (line) => {
		// process the canvas
		// console.log('process:', line.type);
		let rect = [ ...line.position, ...line.arguments ];
		pat.patcher.rect = rect.slice(0, 4);
	},
	'text' : (line) => {
		// process the objects
		// console.log('process:', line.type);
		let obj = { ...maxObject };
		obj.box.maxclass = mapping[line.type];
		obj.box.patching_rect = line.position;
		obj.box.text = line.arguments.join(" ");
		obj.box.id = line.id;

		pat.patcher.boxes.push(obj);
	}
}

if (process.argv[2] === undefined){
	console.error("Please provide a .maxpat file as argument");
	// convertPd();
} else {
	let f = process.argv[2];
	if (f.match(/.*\.maxpat$/) === null){
		console.error("Please provide a .maxpat file as argument");
	} else {
		// convert the Maxpatch to Pd
		convertMax(process.argv[2]);
	}
}

function convertPd(file){
	// let pat = { ...patchTemplate };
	// let boxes = [];
	// let lines = [];

	let pd = fs.readFileSync('./test/pdtest.pd', 'utf8');
	pd = pd.split("\n");

	for (let i=0; i<pd.length; i++){
		if (pd[i] === ""){ break; }

		let code = pd[i].match(/(.*)\;$/)[1].split(" ");
		// console.log("parse line "+i+":", code);

		let type = code[1];

		if (type.match(/canvas/)){
			// console.log('match canvas', type);

		} else if (type.match(/connect/)){
			// console.log('match connect', type);
		
		} else if (type.match(/[obj|msg|floatatom|text|symbolatom]/)){
			// console.log('other match', type);
		
		}
/*
		let line = {
			"type" : code[1],
			"position" : [ code[2], code[3] ],
			"arguments" : code.slice(4, code.length+1),
			"id" : 'obj-'+i
		}
		console.log(line);

		if (processPd[line.type] !== undefined){
			processPd[line.type](line);
		}*/
	}
	// pat.boxes = boxes;
	// console.log(pat.patcher.boxes);

	// fs.writeJsonSync('./test/pdtest.maxpat', pat);
}

function convertMax(file){
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
		} else if (type === 'comment'){
			pd += " text " + pos + " " + obj.box.text;
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
	},
	'comment' : {
		'name' : 'cmt'
	},
}*/