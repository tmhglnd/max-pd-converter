// 
// MaxPatch to Pd Converter
// written by Timo Hoogland, 2020
// 
// MIT License
// 

const fs = require('fs-extra');
const path = require('path');

const patchTemplate = require('./data/maxpat.json');

const mapping = {
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
	}
}

if (process.argv[2] === undefined){
	console.error("Please provide a .maxpat file as argument");
	convertPd();
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
	console.log('converting to .maxpat...');
	// the max patcher template
	let pat = { ...patchTemplate };
	// arrays to store boxes and connections
	let boxes = [];
	let lines = [];
	let id = 0;
	// read the pd file as text
	let pd = fs.readFileSync('./test/pdtest.pd', 'utf8');
	
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
			let map;

			let pos = code.slice(0, 2);

			obj.box.patching_rect = pos;
			obj.box.id = 'obj-'+id;

			if (mapping[type]){
				map = mapping[type](code);
			} 
			if (mapping[code[2]] || map === 'obj'){
				map = mapping[code[2]](code);
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
	fs.writeJsonSync('./test/pdtest.maxpat', pat, { spaces: 2});
	console.log('conversion complete!');
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
