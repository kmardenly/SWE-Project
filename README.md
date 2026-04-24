# Mycraft -  a social platform for crafters!

Project Description
-------------------------------------------------
For craft hobbyist enthusiasts, who struggle to find a cozy platform to share their creations with friends, our product is a web-based crafting social app that encourages posting and craft progress, unlike pinterest which is an app that is not tailored specifically for crafts, our product only allows fellow crafters to post, which creates realistic expectations for users.


## Screenshots

<table>
  <tr>
    <td align="center"><a href="https://github.com/user-attachments/assets/96466625-372f-435a-8fe4-f6038163cc06"><img width="150" alt="Home" src="https://github.com/user-attachments/assets/96466625-372f-435a-8fe4-f6038163cc06" /></a><br/><b>Home</b></td>
    <td align="center"><a href="https://github.com/user-attachments/assets/b9f27285-b1ed-46af-af40-6aedcb2191d5"><img width="150" alt="Inspirations" src="https://github.com/user-attachments/assets/b9f27285-b1ed-46af-af40-6aedcb2191d5" /></a><br/><b>Inspirations</b></td>
    <td align="center"><a href="https://github.com/user-attachments/assets/e19436df-828d-4dfc-977f-ed34ba6926a9"><img width="150" alt="Post Full View" src="https://github.com/user-attachments/assets/e19436df-828d-4dfc-977f-ed34ba6926a9" /></a><br/><b>Post Inside</b></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/user-attachments/assets/4fc5bbdd-602e-4193-ab14-c98dac051357"><img width="150" alt="Profile" src="https://github.com/user-attachments/assets/4fc5bbdd-602e-4193-ab14-c98dac051357" /></a><br/><b>Profile</b></td>
    <td align="center"><a href="https://github.com/user-attachments/assets/e263ecf8-fc3e-400a-be92-79d010212dc1"><img width="150" alt="Chats" src="https://github.com/user-attachments/assets/e263ecf8-fc3e-400a-be92-79d010212dc1" /></a><br/><b>Chats</b></td>
    <td align="center"><a href="https://github.com/user-attachments/assets/ceb6e3ef-320c-4e65-90cc-d2dfb209b11f"><img width="150" alt="Chat Board" src="https://github.com/user-attachments/assets/ceb6e3ef-320c-4e65-90cc-d2dfb209b11f" /></a><br/><b>Chat Inside</b></td>
  </tr>
  <tr>  
     <td align="center"><a href="https://github.com/user-attachments/assets/5889e5ba-b201-4762-9671-9b741d2cb50c"><img width="150" alt="Goals" src="https://github.com/user-attachments/assets/5889e5ba-b201-4762-9671-9b741d2cb50c" /></a><br/><b>Goals</b></td>
    <td align="center"><a href="https://github.com/user-attachments/assets/b3e8098d-111e-47eb-890b-1c5c4b2e1ca3"><img width="150" alt="Projects" src="https://github.com/user-attachments/assets/b3e8098d-111e-47eb-890b-1c5c4b2e1ca3" /></a><br/><b>Projects</b></td>
    <td align="center"><a href="https://github.com/user-attachments/assets/90588c2e-fcfd-47c2-9554-c7f47db979f8"><img width="150" alt="Project Board" src="https://github.com/user-attachments/assets/90588c2e-fcfd-47c2-9554-c7f47db979f8" /></a><br/><b>Project Inside</b></td>
  </tr>
</table>

Challenge Statement
-------------------------------------------------
We will create a social platform for crafters, providing any space for users to connect, discuss projects, post photos, and explore similar interest, groups, and track progress


How our Solution Addressed the Challenge Statement
-------------------------------------------------
Our platform transforms the solitary hobby of crafting into a shared community experience by addressing three core pillars of the challenge:

- Unlike broad interest platforms, we implemented an app that addresses crafts only. This ensures that every interaction and piece of content is relevant and creates an environment where users don’t have to search through the noise of other craft types.

- By focusing on progress tracking, we move away from the perfect and finished aesthetic of Pinterest. Users can post WIPs (Works in Progress), which sets realistic expectations and celebrates the effort behind the finished product.

- We integrated group chats and tagging that allow users to delve into specific crafts (e.g. knitting, sewing) rather than just browsing broad crafts.

Features and Functionality
-------------------------------------------------
- A dedicated project management tool where users can upload photos of different stages of a craft, from raw materials to the final stitch.

- The ability to create group chats to discuss crafts, ideas, etc.

- Users can tag what type of craft and related tags in a post, making it easier for others to search for them via filtering.

- An algorithm that prioritizes updates from followers and related crafts to really hone down into specific interests tailored for each user.



-------------------------------------------------
## Installation
**Technical Details**

Our platform was built in JavaScript, using a React Native (Expo) frontend, Supabase backend, and Docker Desktop to connect the two together. Data is stored in a Supabase PostgreSQL database, with separate tables for users, posts, followers, and related media. User Auth is also done through Supabase Auth (then login information is stored in the appropriate tables).

-------------------------------------------------
**Installation Instructions**

Setup (once):
Install git
Install Node.js (v18 or later)
Install npm
Docker desktop

```git clone https://github.com/SWE-BIG-CATS/SWE-Project.git```

Create ```my-app/backend/.env.local```
```VITE_SUPABASE_URL=https:```
```VITE_SUPABASE_PUBLISHABLE_KEY=```

```SUPABASE_URL=https:```
```SUPABASE_SERVICE_ROLE_KEY=```

```Create my-app/frontend/.env```
```EXPO_PUBLIC_SUPABASE_URL=```
```EXPO_PUBLIC_SUPABASE_ANON_KEY=```

Open two terminal windows in your code editor.

-------------------------------------------------

Terminal one: (Backend)
-------------------------------------------------
Setting up Docker: 
```cd my-app```

```docker init ```// make sure you are inside the my-app folder

```docker compose up -build```

**[run terminal command:]**

(use every time to launch app)

```npx supabase start```

Terminal two (frontend)
-------------------------------------------------

```cd my-app```

```cd frontend```

```npm install ```

[Run terminal commands:]

(use every time to launch app)

Note: ensure Docker Desktop is running before using any commands

```cd my-app```

```cd frontend```

**npx expo start**

-------------------------------------------------
**Debugging:**

If the project installed 15000 new files to the project folders, you may have done npm install in the wrong folder. Ensure you're in the frontend folder before you check to install npm packages.

Do the command ```npx supabase stop --force``` if you are facing supabase issues. 

For an “enonent” error, npm error enoent ENOENT: no such file or directory, lstat 'C:\Users\lilly\AppData\Roaming\npm' do the following: 

Press ```Win + R```, type ```%AppData%```, and hit ```Enter```.

Check if there is a folder named ```npm.```

If it’s missing, create a new folder and name it exactly ```npm```.

Try running ```npx supabase again```.

-------------------------------------------------
**Command cheatsheet:**

```w```- launch web view | opens a localhost port to run your app

```r ```- reload app | If you set up the frontend before the backend, you don’t have to restart, this will reload the backend and front end. 

```Ctrl + c ``` - exit |  exits the current running instance of the front end, you don’t have to kill the backend. Only kill the backend when you are completely done with your session to save time.

```npx supabase stop --force ```| forcibly stops Supabase to check if you have existing instances

```npx supabase db push ```| (from my-app/backend) apply SQL migrations in my-app/backend/supabase/migrations to the linked project

```npx supabase db push --include-all ```| use when a new migration’s timestamp is earlier than the latest one already on the remote (rare; see Supabase docs)

```npx supabase migration list ```| show which migration files are applied on the linked remote

-------------------------------------------------

**Login and Access Credentials and API Keys:**

The only API Keys our platform uses are from Supabase, and the relevant ones have been provided above (in the installation instructions). 

```VITE_SUPABASE``` securely connects our frontend to Supabase

```SUPABASE_SERVICE_ROLE``` is used for backend/server-only operations (this key is sensitive and can only exist in the ```.env.local ```folder in ```../backend/```)

```EXPO_PUBLIC_SUPABASE``` is used to connect the Expo app to Supabase

-------------------------------------------------

**New accounts can be made by running the platform, but we also have an alternative test account:**

```Email: lilly@test.com```

```Password (case-sensitive): 123456```
