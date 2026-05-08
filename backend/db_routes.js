import db from './database.js'

export async function select(req, res){
	let table = req.params.table
	
	let statement = "select * from abilities_readable"

	const result = db.exec(statement)
	res.send(result)
}

export async function ability_by_title(req, res){
	let title = req.params.title
	let feat = req.params.feat

	const result = db.exec('select * from abilities_readable where title="'+title+'" or parent="'+title+'"')
	res.send(result)
}

export async function select_alterations(req, res){
	const result = db.exec('select * from alterations')
	res.send(result)
}
export async function select_paths(req, res){
	const result = db.exec('select * from paths')
	res.send(result)
}
export async function select_by_path_alteration(req, res){
	let path = req.params.path
	let alteration = req.params.alteration

	if(path=='All') {
		path = '%'
	}
	if(alteration=='All'){
		alteration = '%'
	}

	const result = db.exec('select * from abilities_readable where path like "'+path+'" and alteration like "'+alteration+'"')
	res.send(result)
}
