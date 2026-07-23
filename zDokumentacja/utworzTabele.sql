drop table bill_comments cascade;
drop table bills cascade;
drop table coaches;
drop table players;
drop table comments;
drop table statuses;
drop table registrations;
drop table users cascade;
drop table general_settings cascade;
drop table general_settings cascade;

create table general_settings (
	id SERIAL PRIMARY KEY
	,key1 varchar(32) unique
	,value1 varchar(100)
);

create table users (
	id SERIAL PRIMARY KEY
	,username varchar(32) not null unique
	,firstname varchar(16)
	,lastname varchar(32)
	,password varchar(64) not null
	,admin boolean not null
	,active boolean not null
);

create table registrations (
	id SERIAL PRIMARY KEY
	,uuid varchar(36)
	,user_id integer REFERENCES users(id)
	,club_name varchar(256)
	,nip varchar(10)
	,street_no varchar(64)
	,zip_code varchar(10)
	,city varchar(32)
	,country varchar(32)
	,status varchar(16)
	,registrator_name varchar(256)
	,email varchar(512) not null unique
	,phone varchar(128)
	,total_price numeric(7,2)
	,registration_type varchar(16) NOT NULL DEFAULT 'CLUB';
);

create table statuses (
	id SERIAL PRIMARY KEY
	,registration_id integer REFERENCES registrations(id)
    ,datetime timestamp not null
	,status varchar(16)
);
	
create table comments (
	id SERIAL PRIMARY KEY
	,status_id integer REFERENCES statuses(id)
	,comment varchar(512)
);

create table players (
	id SERIAL PRIMARY KEY
	,registration_id integer REFERENCES registrations(id) not null
	,firstname varchar(256)
	,lastname varchar(256)
	,birth_year integer
	,gender varchar(1)
	,category varchar(6)
	,games integer
	,night_fri_sat boolean
	,night_sat_sun boolean
	,supper_fri boolean
	,supper_sat boolean
	,dinner_sun boolean
	,price numeric(7,2)
);

create table coaches (
	id SERIAL PRIMARY KEY
	,registration_id integer REFERENCES registrations(id) not null
	,firstname varchar(256)
	,lastname varchar(256)
	,gender varchar(1)
	,night_fri_sat boolean
	,night_sat_sun boolean
	,supper_fri boolean
	,dinner_sat boolean
	,supper_sat boolean
	,dinner_sun boolean
	,price numeric(7,2)
);

create table bills (
	id SERIAL PRIMARY KEY
	,user_id integer REFERENCES users(id) not null
	,registration_id integer REFERENCES registrations(id)
	,datetime timestamp not null
	,purchaser varchar(120) not null
	,nip varchar(10)
	,bill_number integer
	,bill_fullnumber varchar(36)
	,payment1_description varchar(128)
	,payment1_value numeric(7,2)
	,payment2_description varchar(128)
	,payment2_value numeric(7,2)
	,payment3_description varchar(128)
	,payment3_value numeric(7,2)
	,payment_total numeric(7,2)
	,payment_method varchar(16)
	,email varchar(512)
	,suffix_pdf_name varchar(16)
);

create table bill_comments (
	id SERIAL PRIMARY KEY
	,bill_id integer REFERENCES bills(id) not null
	,comment varchar(512)
);

grant connect on database turniejrejestratordb to programturniejrejestrator;
grant select, insert, update, delete on general_settings, users, registrations, statuses, comments, players, coaches, bills, bill_comments to programturniejrejestrator;
grant usage, select on general_settings_id_seq, users_id_seq, registrations_id_seq, statuses_id_seq, comments_id_seq, players_id_seq, coaches_id_seq, bills_id_seq, bill_comments_id_seq to programturniejrejestrator;

GRANT CREATE ON SCHEMA public TO programturniejrejestrator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO programturniejrejestrator;


----

ALTER TABLE registrations
ADD COLUMN registration_type varchar(16) NOT NULL DEFAULT 'CLUB';
