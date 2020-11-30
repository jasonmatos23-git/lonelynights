// Author: Cristopher Matos
// Course: COP 4331, Fall 2020
// Date: 11/30/20
// ===========================
//       Lonely Nights
//          app.js
// ---------------------------
// Desc: This file contains
// the code which instantiates
// the web server, and the
// socket.io server. It also
// contains functions which
// access the database.
// ===========================

// Bring in useful JS and Node libraries
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

// Reference to the users API
const users = require('./routes/api/users');

// Creation of the http server
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Database Connection
const db = require('./config/keys').mongoURI;
mongoose.connect(db, {autoIndex: true})
 .then(() => console.log("MongoDB Connected!"))
 .catch(err => console.log(err));

// Node app use declarations
app.use(express.static('./public'));	// Definition of express static folder
app.use(bodyParser.json());				// Use json parser for client requests in API
app.use('/api/users', users);			// Use the API

// Require models to access database
const Chat = require('./models/Chat');
const User = require('./models/User');

// addMessage recieves a JSON string msg, and a reference to a socket. Adds message to a chat.
// Fired when client submits a message to a chat. Event: 'chatMessage'.
// Returns nothing [SHOULD RETURN ERROR]
function addMessage(msg, socket)
{
	body = JSON.parse(msg);
	if (body.content == "")
		return;
	Chat.findByIdAndUpdate(body.chatID, {$push : {messages : {$each:[{username: body.username, content: body.content}],$position:0}}},
		{new:true}, (err, result) => {
			if (err)
			{
				console.log(err);
				return;
			}
			delete result.usernames[result.usernames.indexOf(body.username)];
			result.usernames.forEach((user,index,array) => {
				socket.to(socketRegistrar[user]).emit('incomingMessage', msg);
			});
			socket.emit('incomingMessage', msg);
		});
}

// addChat recieves a JSON string msg, and a reference to a socket. Adds a chat to two users.
// Fired when client submits a message to a chat. Event: 'createChat'.
// Returns JSON status/data packet
function addChat(msg, socket)
{
	body = JSON.parse(msg);
	body.user_origin = body.user_origin.toLowerCase();
	body.user_dest = body.user_dest.toLowerCase();
	random = (body.user_dest === '');
	return addChatHelper(body, socket, 8, random);
}

// Helper function checks for random chat selection
function addChatHelper(body, socket, depth, random)
{
	if (random)
	{
		activeUsers = Object.keys(socketRegistrar);
		console.log(activeUsers);
		if (activeUsers.length < 2)
		{
			socket.emit("message","Not enough online users to chat with.");
			return;
		}
		do
		{
			body.user_dest = activeUsers[Math.floor(Math.random()*activeUsers.length)];
		} while(body.user_dest == body.user_origin);
	}
	console.log("Here is the names: "+body.user_origin+" -> "+body.user_dest);
	return addChatRecursive(body, depth, socket, random);
}


function addChatRecursive(body, depth, socket, random)
{
	console.log(depth);
	if (depth == 0)
	{
		socket.emit("message","Search timed out!");
		return;
	}
	User.exists({username: body.user_origin})
		.then(uo => {
			User.exists({username: body.user_dest})
			.then(ud => {
				if (!uo || !ud)
				{
					socket.emit("message","One or more usernames does not exist.");
					return;
				}
				Chat.exists({usernames: [body.user_origin, body.user_dest].sort()})
					.then(duplicateExists => {
						if (duplicateExists && !random)
						{
							socket.emit("message","A chat is already open with this person.");
							return;
						}
						else if (duplicateExists && random)
						{
							return addChatHelper(body, socket, depth - 1, random);
						}
						const newChat = new Chat({
							usernames: [body.user_origin, body.user_dest].sort()
						});
						User.updateMany({ $or: [{username: body.user_origin}, {username: body.user_dest}]},
							{ $push: {chats: newChat._id}}, (err, docs) => console.log(docs) );
						newChat.save()
							.then(chat => console.log("New chat added"))
							.catch(err => console.log(err));
						// Chat has been saved, now gotta emit to both clients
						body["chatID"] = newChat._id;
						msg = JSON.stringify(body);
						socket.to(socketRegistrar[body.user_dest]).emit('incomingChat', msg);
						socket.emit('incomingChat', msg);
						return {"status" : "Success! Added new chat!", "data" : newChat};
					})
					.catch(err => console.log(err));
			})
			.catch(err => console.log(err));
		})
		.catch(err => console.log(err));
}

// SocketIO Handling
var socketRegistrar = {};			// Registers 1:1 mapping of Username <-> SocketID

io.on('connection', socket=> {		// On client connection...
	socketRegistrar[socket.handshake.query.username.toLowerCase()] = socket.id;	// Register client to socketID
	
	// 'disconnect' event triggers deletion of user <-> socket entry
	socket.on('disconnect', reason => {
		delete socketRegistrar[socket.handshake.query.username];
	});
	
	// 'chatMessage' event triggers the adding of a message to chat
	socket.on('chatMessage', msg => {
		addMessage(msg, socket);
	});
	
	// 'createChat' event triggers the adding of a chat to two users
	socket.on('createChat', msg => {
		addChat(msg, socket);
	});
});

// Port declaration and setting server to listen
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));