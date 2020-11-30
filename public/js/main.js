// Author: Cristopher Matos
// Course: COP 4331, Fall 2020
// Date: 11/30/20
// ===========================
//       Lonely Nights
//          main.js
// ---------------------------
// Desc: This file contains
// the code that controls
// UI/UX. All content on the
// Dashboard is dynamically
// loaded with JavaScript and
// manipulating the DOM.
// ===========================

// Defining our root directory, and dashboard file name
// Modify root for your specific environment.
const root = 'http://' + 'localhost:3000/';
const dash = 'Dashboard.html';
var sessionVars = {};

// Make sure that we are signed in before doing anything
function checkCookie()
{
	if (!readCookie().username)
		logout();
	return;
}

// Loads the 'User Search' input bar and button
function loadSearch()
{
	checkCookie();
	document.getElementById("chat").innerHTML = "";
	search = document.getElementById("search");
	search.innerHTML = "";
	searchTray = document.createElement("div");
	searchTray.setAttribute("id", "search_tray");
	search.appendChild(searchTray);
	searchResult = document.createElement("div");
	searchResult.setAttribute("id", "search_result");
	search.appendChild(searchResult);
	input = document.createElement("input");
	input.setAttribute("id", "search_input");
	input.setAttribute("type", "text");
	input.setAttribute("placeholder", "Enter username...");
	input.setAttribute("autocomplete", "off");
	searchButton = document.createElement("button");
	searchButton.setAttribute("id","sendMessage");
	searchButton.setAttribute("onclick","submitSearch();");
	searchButton.innerHTML = "Send";
	searchTray.appendChild(input);
	searchTray.appendChild(searchButton);
	// Add paragraph description of random chat
	randomChatDesc = document.createElement("p");
	randomChatDesc.innerHTML = "Leave this field empty to create a random chat!";
	search.appendChild(randomChatDesc);
	// Set active list element
	activeElem = document.getElementsByClassName("active").item(0);
	if (activeElem)
		activeElem.removeAttribute("class");
	document.getElementById("user_search").setAttribute("class", "active");
}

// When the search button is pressed, request is sent to server.
// If the user exists, a button will be displayed which loads
// a chat with the user when pressed
function submitSearch()
{
	checkCookie();
	try {
		user_dest = document.getElementById("search_input").value;
		resultTray = document.getElementById("search_result");
		resultTray.innerHTML = "";
		if (user_dest == "")
		{
			newButton = document.createElement("button");
			newButton.setAttribute("onclick", "createChat('');");
			newButton.innerHTML = "Random!";
			resultTray.appendChild(newButton);
			return;
		}
		let JSON_packet = {user_dest, user_origin:sessionVars.cookie.username};
		let url = root + 'api/users/search-user';
		let xhr = new XMLHttpRequest();
		xhr.open("POST", url, false);
		xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
		xhr.send(JSON.stringify(JSON_packet));
		let resJSON = JSON.parse(xhr.responseText);
		// Add button with username if it exists
		if (!resJSON.data)
		{
			resultTray.innerHTML = "No user matches the input.";
			return;
		}
		newButton = document.createElement("button");
		newButton.setAttribute("onclick", "createChat('"+resJSON.data+"');");
		newButton.innerHTML = resJSON.data;
		resultTray.appendChild(newButton);
	}
	catch (err) {
		console.log(err);
	}
	return;
}

// When a chat on the side navigation bar is clicked,
// this function loads chat history (last 20 elements)
// into the main view
function loadChat(chatID)
{
	checkCookie();
	document.getElementById("search").innerHTML = "";
	chat = document.getElementById("chat");
	chat.innerHTML = "";
	// Instantiate chat tray
	chatTray = document.createElement("div");
	chatTray.setAttribute("id","chat_tray");
	chatTray.setAttribute("name",chatID);
	chat.appendChild(chatTray);
	// Instantiate chat box
	chatBox = document.createElement("div");
	chatBox.setAttribute("id","chat_box");
	chat.appendChild(chatBox);
	chatInput = document.createElement("input");
	chatInput.setAttribute("id", "msg");
	chatInput.setAttribute("type", "text");
	chatInput.setAttribute("placeholder", "Enter message...");
	chatInput.setAttribute("autocomplete", "off");
	chatButton = document.createElement("button");
	chatButton.setAttribute("id","sendMessage");
	chatButton.setAttribute("onclick","sendMessage('"+chatID+"');");
	chatButton.innerHTML = "Send";
	chatBox.appendChild(chatInput);
	chatBox.appendChild(chatButton);
	// Set active list element
	activeElem = document.getElementsByClassName("active").item(0);
	if (activeElem)
		activeElem.removeAttribute("class");
	document.getElementById(chatID).setAttribute("class", "active");
	setInputForm();
	
	let JSON_packet = {chatID, lastIndex: 0, numMessages: 20};
	let currentUsername = sessionVars.cookie.username;
	let url = root + 'api/users/get-messages';
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, false);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try {
		xhr.send(JSON.stringify(JSON_packet));
		let resJSON = JSON.parse(xhr.responseText);
		if (!resJSON.data)
			return;
		// Display array of messages
		chatTray.innerHTML = "";
		resJSON.data.reverse().forEach((messObj, index, array) => {
			aMessage = document.createElement("p");
			aMessage.innerHTML = ((currentUsername == messObj.username)?"You":messObj.username) +": "+messObj.content;
			chatTray.appendChild(aMessage);
		});
	}
	catch (err) {
		console.log(err);
	}
	return;
}

// loadDashboard function loads the users information
// WARNING: INSECURE! Authentication has NOT been implemented yet.
function loadDashboard()
{
	// Declare session variable's cookie attribute
	sessionVars.cookie = readCookie();
	// If a cookie is not on the system, log out
	if (!sessionVars.cookie.username)
	{
		logout();
		return;
	}
	usernameHolder = document.getElementById("username_holder");
	usernameHolder.innerHTML = sessionVars.cookie.username;
	sessionVars.chatListElement = document.getElementById("chat_list");
	sessionVars.chatListElement.innerHTML = "";
	sessionVars.chatList = [];
	
	let JSON_packet = sessionVars.cookie;
	let currentUsername = JSON_packet.username;
	let url = root + 'api/users/get-chats';
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, false);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try {
		xhr.send(JSON.stringify(JSON_packet));
		let resJSON = JSON.parse(xhr.responseText);
		if (!resJSON.data)
			return;
		// Display array of chats. resJSON.data has the following structure:
		// [{chatID, username, firstname, lastname, message: {user, content, date}},...]
		// For each chat in the array, display username, first/last names, and sliced message content
		resJSON.data.reverse().forEach((chatObj, index, array) => {
			listItem = document.createElement("li");
			listItem.setAttribute("id", chatObj.chatID);
			linkItem = document.createElement("a");
			linkItem.setAttribute("href", "javascript:void(0);");
			linkItem.setAttribute("onclick", "loadChat('"+chatObj.chatID+"');");
			innerText = "";
			// Here we build the string that goes in to a chat link
			innerText = "<b>"+chatObj.username+"</b><br>";
			if (chatObj.firstname != "" && chatObj.lastname != "")
				innerText = innerText + chatObj.lastname+", "+chatObj.firstname+"<br>";
			else if (chatObj.firstname != "")
				innerText = innerText +chatObj.firstname+"<br>";
			else if (chatObj.lastname != "")
				innerText = innerText +chatObj.lastname+"<br>";
			if (chatObj.message)
				innerText = innerText +"<div name=content>"+ chatObj.message.content.slice(0,10)+"</div>";
			else
				innerText = innerText + "<div name=content><i>No messages yet...</i></div>";
			// display text and push to array
			linkItem.innerHTML = innerText;
			listItem.appendChild(linkItem);
			sessionVars.chatListElement.appendChild(listItem);
			sessionVars.chatList.push(listItem);
		});
	}
	catch (err) {
		console.log(err);
	}
	return;
}

// Save a cookie containing the username
// WARNING: This should be modified for authentication
function saveCookie(username)
{
	let minute_limit = 180;
	let date = new Date();
	date.setTime(date.getTime() + (minute_limit * 60 * 1000));
	c = "username=" + username + ";expires=" + date.toGMTString();
	document.cookie = c;
	return;
}

// Reads raw cookie, tokenizes it, and extracts its information.
// Returns a JSON object.
function readCookie()
{
	retVal = {};
	let tray = document.cookie;
	let cookies = tray.split(";");
	cookies.forEach((cookie, index, array) => {
		let pieces = cookie.split(",");
		pieces.forEach((piece, index, array) => {
			let crumbs = (piece.trim()).split("=");
			if (crumbs.length == 2)
				retVal[crumbs[0]] = crumbs[1];
		});
	});
	return retVal;
}

// Expires the cookie
function removeCookie()
{
	document.cookie = "username= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
	return;
}

// Clears cookies and redirects user to root
function logout()
{
	removeCookie();
	sessionVars = {};
	window.location.href = root;
	return;
}

// loadIndex function simply checks if a cookie exists. If so, redirects user to dashboard from login page.
function loadIndex()
{
	if (readCookie().username)
		window.location.href = root + dash;
	return;
}

// login function extracts user information from the front page and submits it to the databse for validation.
// Saves a cookie if password is valid.
function login()
{
	// Extract information from form using DOM
	let username = document.getElementById("login_username").value;
	let password = document.getElementById("login_password").value;
	let resultTray = document.getElementById("login_result");
	// Validate data first check
	if (username == "" || password == "")
	{
		resultTray.innerHTML = "One or more required fields left blank!";
		return;
	}
	// Create JSON packet to send to server
	let JSON_packet = {username, password};
	let url = root + 'api/users/login';
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, false);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try {
		xhr.send(JSON.stringify(JSON_packet));
		// Process response
		// If Success -> Save cookie (username, token[later]), forward to dashboard
		// If Fail -> Display reason why
		let resJSON = JSON.parse(xhr.responseText);
		if (!resJSON.data)
		{
			resultTray.innerHTML = resJSON.status;
			return;
		}
		saveCookie(resJSON.data.username);
		window.location.href = root + dash;
	}
	catch (err) {
		resultTray.innerHTML = err;
		return;
	}
	return;
}

// signup function extracts user information from the front page and submits it to the database.
function signup()
{
	// Extract information from form the DOM
	let username = document.getElementById("signup_username").value;
	let password = document.getElementById("signup_password").value;
	let email = document.getElementById("signup_email").value;
	let firstname = document.getElementById("signup_firstname").value;
	let lastname = document.getElementById("signup_lastname").value;
	let result = document.getElementById("signup_result");
	let resultTray = document.getElementById("signup_result");
	resultTray.innerHTML = "";
	// All input validation is performed server-side
	if (username == "" || password == "" || email == "")
	{
		resultTray.innerHTML = "One or more required fields left blank!";
		return;
	}
	// Create JSON packet to send to server
	let JSON_packet = {username, password, email, firstname, lastname};
	let url = root + 'api/users/signup';
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, false);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try {
		xhr.send(JSON.stringify(JSON_packet));
		// Process response
		// If Success -> Remove text from signup form and display success message
		// If Fail -> Display reason why
		let resJSON = JSON.parse(xhr.responseText);
		if (!resJSON.data)
		{
			if (resJSON.status.errors)
			{
				for (key in resJSON.status.errors)
				{
					err = document.createElement("p")
					err.innerHTML = resJSON.status.errors[key].message;
					resultTray.appendChild(err);
				}
			}
			else if (resJSON.status.code == 11000)
			{
				err = document.createElement("p")
				err.innerHTML = "Sorry! The following credentials are already taken: " + JSON.stringify(resJSON.status.keyValue);
				resultTray.appendChild(err);
			}
			else
			{
				throw "Unknown error detected when signing up. Please contact system administrator.";
			}
			return;
		}
		window.location.reload();
	}
	catch (err) {
		resultTray.innerHTML = err;
		return;
	}
	return;
}