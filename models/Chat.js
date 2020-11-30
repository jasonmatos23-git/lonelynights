// Author: Cristopher Matos
// Course: COP 4331, Fall 2020
// Date: 11/30/20
// ===========================
//       Lonely Nights
//         Chat.js
// ---------------------------
// Desc: This file contains
// the schema for the Chat. It
// exports a model.
// ===========================

// Declaring necessary node modules
const mongoose = require("mongoose");

// Declaring a schema
const Schema = mongoose.Schema;

// Defining our chat schema
const ChatSchema = new Schema(
	{
		usernames : {type: [String]},
		messages: {type: [{username: {type: String, required:true}, content: {type: String, required:true}, date: {type: Date, default: Date.now()}}]}
	});

// Exporting our Chat model
module.exports = Chat = mongoose.model('chat', ChatSchema);