# Mycraft

Mycraft is a social platform for crafters!
=================================================
## Installation
Technical Details

Our platform was built in JavaScript, using a React Native (Expo) frontend, Supabase backend, and Docker Desktop to connect the two together. Data is stored in a Supabase PostgreSQL database, with separate tables for users, posts, followers, and related media. User Auth is also done through Supabase Auth (then login information is stored in the appropriate tables).

=================================================
Installation Instructions

Setup (once):
Install git
Install Node.js (v18 or later)
Install npm
Docker desktop

git clone https://github.com/SWE-BIG-CATS/SWE-Project.git

Create my-app/backend/.env.local
VITE_SUPABASE_URL=https:
VITE_SUPABASE_PUBLISHABLE_KEY=

SUPABASE_URL=https:
SUPABASE_SERVICE_ROLE_KEY=

Create my-app/frontend/.env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

Open two terminal windows in your code editor.
-------------------------------------------------
Terminal one: (Backend)
Setting up Docker: 
cd my-app

docker init // make sure you are inside the my-app folder

docker compose up -build

[run terminal command (use every time to launch app):]
npx supabase start
-------------------------------------------------
Terminal two (frontend)
cd my-app

cd frontend

npm install 

[Run terminal commands (use every time to launch app):]
Note: ensure Docker Desktop is running before using any commands
cd my-app

cd frontend

npx expo start
-------------------------------------------------
Debugging: 

If the project installed 15000 new files to the project folders, you may have done npm install in the wrong folder. Ensure you're in the frontend folder before you check to install npm packages.
Do the command npx supabase stop --force if you are facing supabase issues. 
For an “enonent” error, npm error enoent ENOENT: no such file or directory, lstat 'C:\Users\lilly\AppData\Roaming\npm' do the following: 
Press Win + R, type %AppData%, and hit Enter.
Check if there is a folder named npm.
If it’s missing, create a new folder and name it exactly npm.
Try running npx supabase again.

-------------------------------------------------
Command cheatsheet: 

w- launch web view | opens a localhost port to run your app
r - reload app | If you set up the frontend before the backend, you don’t have to restart, this will reload the backend and front end. 
Ctrl + c - exit |  exits the current running instance of the front end, you don’t have to kill the backend. Only kill the backend when you are completely done with your session to save time.
npx supabase stop --force | forcibly stops Supabase to check if you have existing instances
npx supabase db push | (from my-app/backend) apply SQL migrations in my-app/backend/supabase/migrations to the linked project
npx supabase db push --include-all | use when a new migration’s timestamp is earlier than the latest one already on the remote (rare; see Supabase docs)
npx supabase migration list | show which migration files are applied on the linked remote

=================================================
Login and Access Credentials and API Keys:

The only API Keys our platform uses are from Supabase, and the relevant ones have been provided above (in the installation instructions). 
VITE_SUPABASE securely connects our frontend to Supabase
SUPABASE_SERVICE_ROLE is used for backend/server-only operations (this key is sensitive and can only exist in the .env.local folder in ../backend/)
EXPO_PUBLIC_SUPABASE is used to connect the Expo app to Supabase

=================================================
New accounts can be made by running the platform, but we also have an alternative test account:
Email: lilly@test.com
Password (case-sensitive): 123456
