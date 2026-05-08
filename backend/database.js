import sqljs from 'sql.js'
import fs from 'fs'

const sql = await sqljs();
const db = new sql.Database();
db.run(`
drop table if exists paths;
drop table if exists abilities;
drop table if exists abilities;

create table paths(
	path_id integer primary key autoincrement,
	title varchar(50)
);

create table alterations(
	alteration_id integer primary key autoincrement,
	title varchar(50)
);

create table abilities(
	ability_id integer primary key autoincrement,
	parent_id integer references abilities(ability_id),
	path_id integer references paths(path_id),
	alteration_id integer references alterations(alteration_id),
	title varchar(50),
	requirement varchar(50),
	description varchar(5000),
	actions varchar(5),
	strain varchar(5)
);

create view abilities_readable as
	select p.title as parent, ab.title as title, al.title as alteration, pa.title as path, ab.requirement as requirement, ab.description as description, ab.actions as actions, ab.strain as strain
	from abilities ab left join abilities p on p.ability_id=ab.parent_id
	left join paths pa on ab.path_id=pa.path_id
	left join alterations al on ab.alteration_id=al.alteration_id
	order by ab.ability_id, pa.title, al.title, p.title, ab.title asc;

`)

const data = JSON.parse(fs.readFileSync('./abilities.json', 'utf8'))



data["Abilities"].forEach((ability)=>{
	//console.log(db.exec('select count(title) from paths where title="'+ability["path"]+'";')[0]["values"][0][0])
	if(0 == db.exec('select count(title) from paths where title="'+ability["path"]+'";')[0]["values"][0][0]){
		db.run('insert into paths(title) values("'+ability["path"]+'");')
	}
	if(0 == db.exec('select count(title) from alterations where title="'+ability["alteration"]+'";')[0]["values"][0][0]){
		db.run('insert into alterations(title) values("'+ability["alteration"]+'");')
	}
	let statement = `
		insert into abilities(path_id, alteration_id, title, requirement, description, actions, strain)
		values(
			(select path_id from paths where title="`+ability["path"]+`"),
			(select alteration_id from alterations where title="`+ability["alteration"]+`"),
			"`+ability["title"]+`","`+ability["requirement"]+`","`+ability["description"]+`","`+ability["actions"]+`","`+ability["strain"]+`"
		);
	`
	db.run(statement)
	ability["feats"].forEach((feat)=>{
		statement = `
			insert into abilities(parent_id, title, actions, description, strain, alteration_id, path_id)
			values(
				(select ability_id from abilities where title="`+ability["title"]+`" limit 1),
				"`+feat["title"]+`",
				"`+feat["actions"]+`",
				"`+feat["description"]+`",
				"`+feat["strain"]+`",
				(select alteration_id from alterations where title="`+ability["alteration"]+`" limit 1),
				(select path_id from paths where title="`+ability["path"]+`" limit 1)
			);
		`
		console.log(statement)
		db.run(statement)
	})
	//console.log(db.exec('select count(*) from abilities')[0]["values"])
})

export {db as default}

