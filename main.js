// 
// MaxPatch to Pd Converter
// written by Timo Hoogland, 2020
// 
// MIT License
// 

const fs = require('fs-extra');
const path = require('path');

const patchTemplate = require('./data/maxpat.json');

const parser = {
	// Pd -> Max Processor
	'obj' : (args) => {
		return { 
			'maxclass' : 'newobj',
			'text' : args.slice(2, args.length).join(" ") }
	},
	'text' : (args) => {
		return { 
			'maxclass' : 'comment',
			'text' : args.slice(2, args.length).join(" ") }
	},
	'msg' : (args) => {
		return { 
			'maxclass' : 'message',
			'text' : args.slice(2, args.length).join(" ") }
	},
	'floatatom' : (args) => {
		let pos = args.slice(0, 2);
		return { 
			'maxclass' : 'flonum',
			"patching_rect" : pos.concat([ 50.0, 22.0 ]) 
		}
	},
	'symbolatom' : (args) => {
		return { 
			'maxclass' : 'message',
			'text' : '' }
	},
	'tgl' : () => {
		return { 'maxclass' : 'toggle' }
	},
	'bng' : (args) => {
		let pos = args.slice(0, 2);		
		return { 
			'maxclass' : 'button',
			"patching_rect" : pos.concat([ 24.0, 24.0 ])
		}
	},
	'vsl' : () => {
		return { 
			'maxclass' : 'slider',
			'orientation' : 1 }
	},
	'hsl' : () => {
		return { 
			'maxclass' : 'slider',
			'orientation' : 2 }
	},
	// Max -> Pure Data Processor
	'message' : (args) => {
		return "msg " + args[0] + " " + args[1];
	},
	'comment' : (args) => {
		return "text " + args[0] + " " + args[1];
	},
	'button' : (args) => {
		return "obj " + args[0] + " bng 15 250 50 0 empty empty empty 17 7 0 10 -262144 -1 -1";
	},
	'toggle' : (args) => {
		return "obj " + args[0] + " tgl 15 0 empty empty empty 17 7 0 10 -262144 -1 -1 0 1";
	},
	'newobj' : (args) => {
		return "obj " + args[0] + " " + args[1];
	},
	'flonum' : (args) => {
		return "floatatom " + args[0] + " 8 " + "0 0 0" + " - - -, " + "f 8";
	},
	'number' : (args) => {
		return "floatatom " + args[0] + " 8 " + "0 0 0" + " - - -, " + "f 8";
	},

}

if (process.argv[2] === undefined){
	console.error("Please provide a .maxpat or .pd file as argument");
	
	// convertPd('test/pdtest.pd');
	convertMax('test/maxtest.maxpat');

} else {
	let f = process.argv[2];
	if (f.match(/.*\.(maxpat|pd)$/) === null){
		console.error("Please provide a .maxpat or .pd file as argument");
	} else if (f.match(/.*\.maxpat$/)){
		// convert the Maxpatch to Pd
		convertMax(process.argv[2]);
	} else {
		convertPd(process.argv[2]);
	}
}

function convertPd(file){
	console.log('converting to Max...');
	// the max patcher template
	let pat = { ...patchTemplate };
	// arrays to store boxes and connections
	let id = 0;
	// read the pd file as text
	let pd = fs.readFileSync(file, 'utf8');
	
	// replace the new lines with spaces
	pd = pd.replace(/\n/g, ' ');
	// divide into array of groups starting with #, ending with ;
	pd = pd.match(/(#([^;]+)\;)/g, '');
	// remove #N, #X and ; and split into token arrays
	pd = pd.map(x => x.replace(/(#N |#X |;)/g, '').split(' '));
	// console.log(pd);

	for (let i=0; i<pd.length; i++){
		// type of line; canvas, obj, connect, text, msg, floatatom
		let type = pd[i][0];
		let code = pd[i].slice(1, pd[i].length);
		
		if (type.match(/canvas/)){
			// if type matches canvas
			let rect = code.slice(0, 4);
			pat.patcher.rect = rect.slice(0, 4);
			// console.log('parse canvas', pat.patcher.rect);
		} else if (type.match(/(obj|msg|floatatom|text|symbolatom)/)){
			// if type matches obj|msg|floatatom|text|symbolatom
			let obj = {
				"box" : {
					"id" : "",
					"maxclass" : "comment",
					"patching_rect" : [ 45.0, 45.0, 150.0, 20.0 ]
				}
			};
			let pos = code.slice(0, 2);
			
			obj.box.patching_rect = pos;
			obj.box.id = 'obj-'+id;
			
			let map;
			if (parser[type]){
				map = parser[type](code);
			} 
			if (parser[code[2]] || map === 'obj'){
				map = parser[code[2]](code);
			}
			// console.log('@map', map);
			
			Object.keys(map).forEach((k) => {
				obj.box[k] = map[k];
			});
			
			pat.patcher.boxes.push(obj);
			id++;
		} else if (type.match(/connect/)){
			// if type matches connect
			pat.patcher.lines.push({
				"patchline" : {
					"destination" : [ 'obj-'+code[2], code[3] ],
					"source" : [ 'obj-'+code[0], code[1] ]
				}
			});
		}
	}
	// console.log(pat.patcher);
	// console.log(pat.patcher.boxes);
	// console.log(pat.patcher.lines);
	let fInfo = path.parse(file);
	let outFile = path.join(fInfo.dir, fInfo.name + '.maxpat');
	fs.writeJsonSync(outFile, pat, { spaces: 2});
	console.log('conversion complete!');
}

function convertMax(file){
	console.log('converting to Pd...');
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
		// console.log('@object', obj);

		let type = obj.box.maxclass;
		let args = [];
		args.push(obj.box.patching_rect.slice(0, 2).join(" "));
		args.push(obj.box.text);

		connections.push(obj.box.id);
		
		let code = "\n#X ";

		if (parser[type] === undefined){
			console.error('object of type:', type, 'unsupported');
			return;
		} else {
			code += parser[type](args);
		}
		// console.log('@parse', code + ";");
		pd += code + ";";
	});
	
	// all connections
	lines.forEach((ln) => {
		let connect = [];
		connect.push(connections.indexOf(ln.patchline.source[0]));
		connect.push(ln.patchline.source[1]);
		connect.push(connections.indexOf(ln.patchline.destination[0]));
		connect.push(ln.patchline.destination[1]);
		
		pd += "\n#X connect " + connect.join(" ") + ";";
	});
	
	// write output file
	let fInfo = path.parse(file);
	let outFile = path.join(fInfo.dir, fInfo.name + '.pd');
	fs.writeFile(outFile, pd);
	console.log('conversion complete!');
}
