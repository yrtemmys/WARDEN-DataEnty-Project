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

db.run(`
drop table if exists character;
drop table if exists character_has_ability;
drop table if exists character_has_skill;
drop table if exists character_has_rank;
drop table if exists character_has_origin;
drop table if exists skills;
drop table if exists origins;

create table character(
	character_id integer primary key autoincrement,
	name varchar(50),
	advance_points integer,
	goals longtext,
	level integer
);

create table character_has_ability(
	character_id interger references character(character_id),
	ability_id references abilities(ability_id),
	primary key (character_id, ability_id)
);
create table resources(
	resource_id integer primary key autoincrement,
	title varchar(50),
	short_name varchar(5)
);
create table character_has_resource(
	character_id interger references character(character_id),
	resource_id integer references resources(resource_id),
	value integer,
	primary key (character_id, resource_id)
);
create table character_has_rank(
	character_id interger references character(character_id),
	path_id integer references paths(path_id),
	value integer,
	primary key (character_id, path_id)
);
create table origins(
	origin_id integer primary key autoincrement,
	title varchar(50),
	description varchar(5000)
);
create table character_has_origin(
	character_id interger references character(character_id),
	origin_id integer references origins(origin_id),
	primary key (character_id, origin_id)
);
create table skills(
	skill_id integer primary key autoincrement,
	title varchar(50)
);
create table character_has_skill(
	character_id interger references character(character_id),
	skill_id integer references skills(skill_id),
	value integer,
	primary key (character_id, skill_id)
);

drop view if exists character_sheet;
create view character_sheet as
	select ch.name, chre.resource_id, chre.value
	from character as ch
	left join character_has_ability as cha 
		on ch.character_id=cha.character_id
	left join character_has_resource as chre
		on ch.character_id=chre.character_id
	left join character_has_rank as chra
		on ch.character_id=chra.character_id
	left join character_has_origin as cho
		on ch.character_id=cho.character_id
	left join character_has_skill as chs
		on ch.character_id=chs.character_id
;

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
		db.run(statement)
	})
	//console.log(db.exec('select count(*) from abilities')[0]["values"])
})

// should be importet dynamically from a json later
db.run(`
drop view if exists character_data;
create view character_data as
	select  ch.name as name, 
		cha.ability_id as a_id,
		chre.resource_id as r_id, chre.value r_value, 
		chra.path_id p_id, chra.value p_value,
		cho.origin_id o_id,
		chs.skill_id s_id
	from character as ch
	left join character_has_ability as cha 
		on ch.character_id=cha.character_id
	left join character_has_resource as chre
		on ch.character_id=chre.character_id
	left join character_has_rank as chra
		on ch.character_id=chra.character_id
	left join character_has_origin as cho
		on ch.character_id=cho.character_id
	left join character_has_skill as chs
		on ch.character_id=chs.character_id
;
drop view if exists character_sheet;
create view character_sheet as 
	select 
		c.name,
		c.a_id, a.title ability_title, 
		r.title resource_title, c.r_value, 
		p.title path_title, c.p_value, 
		o.title origin_title, 
		s.title skill_title
	from character_data c
	left join abilities a
		on c.a_id=a.ability_id
	left join resources r
		on c.r_id=r.resource_id
	left join paths p
		on c.p_id=p.path_id
	left join origins o
		on c.o_id=o.origin_id
	left join skills s
		on c.s_id=s.skill_id
;

create view character_sheet_grouped as
	select name, 
		group_concat(distinct (a_id||': '||ability_title)),
		group_concat(distinct (resource_title||': '||r_value)),
		group_concat(distinct (path_title||': '||p_value)),
		group_concat(distinct origin_title),
		group_concat(distinct skill_title)
	from character_sheet 
;

	insert into resources(title, short_name) values ("Hit Points", "HP");
	insert into resources(title, short_name) values ("Strain", "SP");
	insert into resources(title, short_name) values ("Speed", "m");
	insert into resources(title, short_name) values ("Wealth", "W");
	insert into resources(title, short_name) values ("Fate Points", "FP");
	insert into paths(title) values("Toughness");
	insert into paths(title) values("Resolve");
	insert into paths(title) values("Perception");

	insert into paths(title) values("Example path");

	insert into origins(title) values ("Apprentice");
	insert into origins(title) values ("Golden Spoon");
	insert into origins(title) values ("Everyman");
	insert into skills(title) values("Crafting");
	insert into skills(title) values("Deception");
	insert into skills(title) values("Diplomacy");
	insert into skills(title) values("Force");

	insert into character(name, advance_points, goals, level)
		values("Jimmy Bob", 0, "Get Rich; Kill puppies", 1);
	insert into character_has_resource values(1,1,10);
	insert into character_has_resource values(1,2,10);
	insert into character_has_resource values(1,3,5);
	insert into character_has_resource values(1,4,3);
	insert into character_has_resource values(1,5,1);

	insert into character_has_rank values (1,1,3);
	insert into character_has_rank values (1,2,1);
	insert into character_has_rank values (1,3,4);
	insert into character_has_rank values (1,5,0);
	insert into character_has_rank values (1,6,0);
	insert into character_has_rank values (1,7,0);

	insert into character_has_origin values (1,1);
	insert into character_has_origin values (1,2);
	insert into character_has_skill values (1,1,0);
	insert into character_has_skill values (1,2,0);
	insert into character_has_skill values (1,3,0);
	insert into character_has_skill values (1,4,0);

	insert into character_has_ability values(1,1);
	insert into character_has_ability values(1,17);
	insert into character_has_ability values(1,88);
	insert into character_has_ability values(1,159);
`)





export {db as default}

