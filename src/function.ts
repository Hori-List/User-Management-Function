import { Client, Database } from 'node-appwrite';

// initialise the client SDK
let client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

//initialise the database SDK
const db = new Database(client);

const eventData = JSON.parse(process.env.APPWRITE_FUNCTION_EVENT_DATA);
const usersCollection = process.env.APPWRITE_USERS_COLLECTION;
const trigger = process.env.APPWRITE_FUNCTION_EVENT;

const userId = eventData.$id;

async function run() {
  console.log(eventData);
  switch(trigger) {
    case 'account.create':
    case 'users.create':
      console.log(`Setting up database for user ${ userId }`);
      await setupDb();
      break;
    case 'account.update.name':
      console.log(`Updating name for user ${ userId }`);
      await updateName();
      break;
    default:
      console.log(`Invalid trigger. Exiting function.`);
      break;
  }

}

/**
 * initial database setup
 */
async function setupDb() {
  const data = {
    user: userId,
    username: eventData.name,
    email: eventData.email,
  };
  await db.createDocument(usersCollection, data, [`*`], []).catch((err) => {
    console.error(`Could not create database entry for user ${ userId }.`);
    console.error(err);
    process.exit(1);
  });
}

async function updateName() {
  const { documents } = await db.listDocuments(usersCollection, [`user=${ userId }`]);
  if (!documents) {
    console.error(`Could not find user document for user ${ userId }`);
    process.exit(1);
  }
  const id = documents[0].$id;
  await db.updateDocument(usersCollection, id, {username: eventData.name}).catch((err) => {
    console.error(`Could not update username for user ${userId}`);
    console.error(err);
    process.exit(1);
  });
}

run();
