db = db.getSiblingDB('admin');
db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);
db.createUser({
	user: process.env.MONGODB_USER,
	pwd: process.env.MONGODB_USER_PASSWORD,
	roles: [
		{
			role: 'readWrite',
			db: process.env.MONGO_INITDB_DATABASE,
		},
		{
			role: 'dbAdmin',
			db: process.env.MONGO_INITDB_DATABASE,
		},
	],
});

db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);
db.createCollection('contacts');
db.contacts.createIndex({ email: 1 });
db.contacts.createIndex({ createdAt: -1 });
db.contacts.createIndex({ status: 1 });
