# simple-chat-app
https://socket.io/get-started/chat

## Run Locally ##
1. First clone the repository using `https://github.com/kanegui72498/simple-chat-app.git`
2. Make sure you have [NodeJS](https://nodejs.org/en/) installed.
3. Install express by running `npm install express@4`
4. Install socket.io by running `npm install socketio`
5. Navigate to /simple-chat-app and start the server by running `node ./server.js`
6. You can access the chat page at http://localhost:3000/ or create your username at http://localhost:3000/create-username

## Hosting ##
I am also using ngrok to port my localhost if you would like to access it without running it locally. 
Currently hosted at https://2306-71-182-194-64.ngrok.io/ .

## Features ##
- real time messaging with other connected users
- broadcasting when user connects or disconnects
- custom usernames as well as randomly generated ones
- list of online users
- display which users are currently typing
- private messaging through the command `/whisper <username>`
- various commands

## Commands ##
**/whisper \<username>** - sends a private message to the user with the given username if they exist.

**/online** - returns back how many users are currently online.

**/whoami** - returns back your own user name.

## Future Improvements ##
- Add functionality for unique usernames only
- Add more commands. Ex. /reply, /time, /help
- Restructure css files and reduce duplicated styling if any
- Make users online list more interactive. Ex. be able to select a user and have possible actions
- add info box on chat page listing all the commands
- add legend detailing different types of messages and their colors
