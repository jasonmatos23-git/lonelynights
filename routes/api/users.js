// Author: Cristopher Matos
// Course: COP 4331, Fall 2020
// Date: 11/30/20
// ===========================
//       Lonely Nights
//         users.js
// ---------------------------
// Desc: Despite the name,
// this file contains the
// entire api for the project.
// ===========================
//         Route List
// ---------------------------
// search-user
// 		Checks if user exists
// get-chats
//		Retrieves chats
//		associated with a user
// get-messages
//		Retrieves messages
// 		associated with a chat
// signup
//		Adds user entry to
//		database
// login
//		Verifies username and
//		password.
// ===========================

// Bringing in necessary node modules
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const jsonParser = bodyParser.json();

// Requiring our models
const User = require('../../models/User');
const Chat = require('../../models/Chat');

// POST '/routes/api/users/search-user'
// Takes in a username
// Returns a username or nothing to indicate existence
router.post('/search-user', jsonParser, (req, res) => {
	if (req.body.user_origin == req.body.user_dest)
	{
		res.json({"status" : "Success! The user is you!", "data" : ""});
		return;
	}
	User.exists({username: req.body.user_dest}).then(doesExist => {
		if (doesExist)
			res.json({"status" : "Success! The user exists!", "data" : req.body.user_dest});
		else
			res.json({"status" : "Success! The user does not exist!", "data" : ""});
	});
});

// POST '/routes/api/users/get-chats'
// Messy function that takes in a username, and responds with the user's chats.
// Appends full name of chat holders for viewing.
router.post('/get-chats', jsonParser, (req, res) => {
	User.findOne({username: req.body.username},(err, result) => {
		if (!result)
		{
			res.json({"status" : "No chats were found!"});
			return;
		}
		orArray = [];
		result.chats.forEach((currentValue, index, array) => {
			orArray.push({"_id":currentValue});
		});
		Chat.find({$or: orArray}).exec((err, chats) => {
			if (!chats)
			{
				res.json({"status" : "No chats were found!", data: []})
				return;
			}
			anotherOrArray = [];
			chats.forEach((chatObj, index, array) => {
				user = chatObj.usernames.indexOf(req.body.username);
				user = chatObj.usernames[Math.abs(user - 1)];
				chats[index] = {"chatID" : chatObj._id, "username" : user, "message" : chatObj.messages[0]};
				anotherOrArray.push({"username":user});
			});
			chats.sort((chatA, chatB) => chatA.username.localeCompare(chatB.username));
			User.find({$or: anotherOrArray}).sort('username').exec((err, users) => {
				if (!users)
				{
					res.json({"status" : "No chats were found!", data: []});
					return;
				}
				users.forEach((userObj, index, array) => {
					(chats[index])["firstname"] = userObj.firstname;
					(chats[index])["lastname"] = userObj.lastname;
				});
				res.json({"status":"Success.","data":chats});
			});
		});
	});
});

// POST '/routes/api/users/get-messages'
// Takes in an integer last index, number of messages desired, chatid
// Returns array of messages
router.post('/get-messages', jsonParser, (req, res) => {
	index = parseInt(req.body.lastIndex);
	messages = parseInt(req.body.numMessages);
	Chat.findById(req.body.chatID, (err, result) => {
		if (err || !result)
		{
			res.json({"status" : err});
			return;
		}
		res.json({"status" : "Success! Here are your messages", "data": result.messages.slice(index, index + messages)});
	});
});


// POST '/routes/api/signup'
// Save new user to database
router.post('/signup', jsonParser, (req, res) => {
	const newUser = new User({
		username: req.body.username,
		password: req.body.password,
		email: req.body.email,
		firstname: req.body.firstname,
		lastname: req.body.lastname
	});
	newUser.save()
		.then(user => res.json({"status" : "Success! New user added to database!", "data" : {"user": user}}))
		.catch(err => res.json({"status" : err}));
});

// POST '/routes/api/login'
// Check username and password match
// Modified from: https://www.mongodb.com/blog/post/password-authentication-with-mongoose-part-1
router.post('/login', jsonParser, (req, res) => {
	User.findOne({username: req.body.username}, (err, user) =>
		{
			if (!user || err)
			{
				res.json({"status" : (err ? err:"Username not found.")});
				return;
			}
			// Call checkPassword method of user model
			user.checkPassword(req.body.password, (err, isMatch) =>
				{
					if (err)
						res.json({"status" : err});
					else if (isMatch)
						res.json({"status" : "Success! You can log in!", "data" : {"username" : req.body.username.toLowerCase()}});
					else
						res.json({"status" : "Incorrect password."});
				});
		});
});

module.exports = router;