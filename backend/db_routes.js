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

	let result = await ability_by_title_local(title)
	res.send(result)
}
async function ability_by_title_local(title){
	let result = db.exec('select * from abilities_readable where title like "%'+title+'%" or parent like "%'+title+'%"')[0]
	result = sql_to_json(result)
	result = condense_feats(result)
	return result
}

export async function select_alterations(req, res){
	let result = db.exec('select * from alterations')[0]
	result=sql_to_json(result)
	res.send(result)
}
export async function select_paths(req, res){
	let result = db.exec('select * from paths')[0]
	result=sql_to_json(result)
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

	let result = db.exec('select * from abilities_readable where path like "'+path+'" and alteration like "'+alteration+'"')[0]
	result = sql_to_json(result)
	result = condense_feats(result)

	res.send(result)
}

export async function select_character(req, res){
	let id = req.params.id
	let result = {}

	let exists = (1==db.exec(`select count(*) from character where character_id=`+id)[0].values[0][0])
	
	if(!exists){
		db.run(`insert into character values(`+id+`, '', 0,'',0)`)
	}
	result.meta = db.exec(`select * from character ch where ch.character_id=`+id)[0]
	result.abilities = db.exec(`select title from character_has_ability cha join abilities a on cha.ability_id = a.ability_id where character_id=`+id)[0]
	result.resources = db.exec(`
		select title, value from character_has_resource chr
			join resources r on r.resource_id=chr.resource_id 
		where character_id=`+id)[0]
	result.ranks = db.exec(`select title, value from character_has_rank chr join paths on chr.path_id=paths.path_id where character_id=`+id)[0]
	result.origin = db.exec(`select title from character_has_origin cho join origins o on cho.origin_id=o.origin_id where character_id=`+id)[0]
	result.skill = db.exec(`select title, value from character_has_skill chs join skills on chs.skill_id = skills.skill_id where character_id=`+id)[0]
	
	for(let x in result){
		result[x]=sql_to_json(result[x])
	}
	
	//result.meta = top_level_this_json(result.meta)
	result.meta = result.meta[0]
	//console.log(top_level_this_json(result.abilities))
	

	let ab = []
	for(let a in result.abilities){
		a = result.abilities[a]
		a = await ability_by_title_local(a.title)
		ab.push(a[0])
	}
	result.abilities=ab


	result.resources = top_level_this_json(result.resources)
	result.ranks = top_level_this_json(result.ranks)
	//console.log(top_level_this_json(result.origin))
	result.skill = top_level_this_json(result.skill)

	res.send(result)
}

export async function save_character(req, res){
	let character = req.body
	let meta = character.meta
	let id = meta.character_id


	//meta	
	let exists = (1==db.exec(`select count(*) from character where character_id=`+id)[0].values[0][0])
	let sql
	if(exists){
		sql = `
		update character 
		set 	name="`+meta.name+`", 
			advance_points=`+meta.advance_points+`,
			goals="`+meta.goals+`",
			level=`+meta.level+`
		where character_id=`+id+`
	`
	}else{
		sql = `
		insert into character values(
			`+id+`,
			"`+meta.name+`",
			`+meta.advance_points+`,
			"`+meta.goals+`",
			`+meta.level+`
		)
		`
	}

	db.run(sql)

	// abilities
	for(let a in character.abilities){
		a = character.abilities[a]
		sql = `insert into character_has_ability values(`+id+`,(
			select ability_id from abilities where title = "`+a.title+`" limit 1
		))`
		db.run(sql)
		//for(let f in a.feats){
		//	f = a.feats[f]
		//	sql = `insert into character_has_ability values(`+id+`,(
		//		select ability_id from abilities where title = "`+f.title+`" limit 1
		//	))`
		//	db.run(sql)
		//}

	}

	// resources
	for(let r in character.resources){
		let v  = character.resources[r]
		sql = `insert into character_has_resource values(`+id+`,(
			select resource_id from resources where title="`+r+`" limit 1	
		), `+v+`)`
		db.run(sql)
	}	
	// ranks
	for(let r in character.ranks){
		let v  = character.ranks[r]
		sql = `insert into character_has_rank values(`+id+`,(
			select path_id from paths where title="`+r+`" limit 1
		), `+v+`)`
		db.run(sql)
	}	
	// origin
	for(let o in character.origin){
		o = character.origin[o]
		sql = `insert into character_has_origin values(`+id+`, (
			select origin_id from origins where title="`+o.title+`" limit 1
		))`
		db.run(sql)
	}
	// skill
	for(let s in character.skills){
		let v  = character.skills[s]
		sql = `insert into character_has_skill values(`+id+`,(
			select skill_id from skill where title="`+s+`" limit 1
		), `+v+`)`
		db.run(sql)
	}	

}

export async function next_character_id(req, res){
	let next_id = db.exec(`select max(character_id) as id from character`)[0].values[0][0]+1
	res.send(next_id)
}

function sql_to_json(sql){
	if (sql == undefined) return [];
	let columns = {}
	sql.columns.forEach((column)=>{
		columns[column]= ''
	})
	let con_row = []
	sql.values.forEach((row)=>{
		let i = 0
		for(let x in columns){
			columns[x] = row[i]
			i++
		}
		con_row.push(JSON.parse(JSON.stringify(columns)))

	})

	return(con_row)
}
function top_level_this_json(json_array){
	if (json_array == undefined) return;
	let new_json = {}
	json_array.forEach((json)=>{
		new_json[json.title] = json.value
	})
	return(new_json)
}

function condense_feats(input){
	let abilities = []
	let ability = {}

	for(let i = 1; i<input.length; i++){
		i--
		ability=input[i]
		ability.feats=[]
		
		i++
		while(i<input.length && input[i].parent==ability.title){
			ability.feats.push(input[i])
			i++
		}
		abilities.push(ability)
	}
	return abilities
}
