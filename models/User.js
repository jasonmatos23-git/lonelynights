// Author: Cristopher Matos
// Course: COP 4331, Fall 2020
// Date: 11/30/20
// ===========================
//       Lonely Nights
//         User.js
// ---------------------------
// Desc: This file contains
// the schema for the User. It
// exports a model.
// ===========================

// Declaring necessary node modules
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Salt work factor is defaulted to 10
const SALT_WORK_FACTOR = 10

// Declaring schema
const Schema = mongoose.Schema;

// Defining our user schema
const UserSchema = new Schema(
	{
		username: {type: String, lowercase:true, required: true, index:true, unique:true, validate:{validator: input => {
			reg = /^\w{4,}$/;
			return reg.test(input);
		},message:"Username is invalid. Must contain at least 4 characters a-z, 0-9, or underscore(_)."}},
		email: {type: String, unique:true, required:true, validate:{validator: input => {
			reg = /^[\w|.|-]+[\x40][\w|\.|\-]+$/;
			return reg.test(input);
		},message:"Email provided is invalid. Please contact website administrator if this is a mistake."}},
		password: {type: String, required: true, validate:{validator: input => {
			reg = /^[\w!@#$%^&*]{4,32}$/;
			return reg.test(input);
		},message:"Password is invalid. Must contain 4-32 alphanumeric or punctuation('@#$%^&*_') characters."}},
		firstname: {type: String},
		lastname: {type: String},
		chats: {type: [Schema.Types.ObjectId]}
	});

// Middleware executes before save operation.
// Hash password with bcrypt and salt.
// Modified from: https://www.mongodb.com/blog/post/password-authentication-with-mongoose-part-1
UserSchema.pre('save', function(next) {
	let user = this;
	if (!user.isModified('password'))
		return next();
	bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
		if (err)
			return next(err);
		bcrypt.hash(user.password, salt, (err, hash) => {
			if (err)
				return next(err);
			user.password = hash;
			next();
		});
	});
});

// checkPassword method of user compares encrypted password with input password
// Modified from: https://www.mongodb.com/blog/post/password-authentication-with-mongoose-part-1
UserSchema.methods.checkPassword = function(testPassword, pass_handler) 
	{
		bcrypt.compare(testPassword, this.password, function(err, isMatch) {
			if (err)
				return pass_handler(err);
			pass_handler(null, isMatch);
		});
	};

// Exporting our User model from the schema
module.exports = User = mongoose.model('user', UserSchema);