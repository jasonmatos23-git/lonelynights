// Author: Cristopher Matos
// Course: COP 4331, Fall 2020
// Date: 11/30/20
// ===========================
//       Lonely Nights
//         socket.js
// ---------------------------
// Desc: This file contains
// all client-side socket
// code. 
// ===========================

// Note: Socket is loaded in Dashboard.html

// Creating new socket object, and registering it
// with the server. Sends username from cookie
// to register.
const socket = io({query: readCookie()});

// On 'message' event, display server message in console
socket.on('message', message => {
	alert(message);
});

// On 'incomingMessage' event, load it into
// sidenav bar and chat box (if it is open)
socket.on('incomingMessage', msg => {
	msg = JSON.parse(msg);
	chatBucket = document.getElementById("chat_tray");
	if(chatBucket && chatBucket.getAttribute('name') == msg.chatID)
	{
		newMessage = document.createElement("p");
		newMessage.innerHTML = ((msg.username==readCookie().username)?"You":msg.username)+": "+ msg.content;
		chatBucket.appendChild(newMessage);
	}
	chatPreview = document.getElementById(msg.chatID);
	chatPreview.querySelector("div").innerHTML = msg.content.slice(0,10);
});

// on 'incomingChat' event, reload the page to display
socket.on('incomingChat', msg => {
	window.location.reload();
});

// Fires 'createChat' event and emits it to the server.
function createChat(username)
{
	checkCookie();
	let currentUsername = sessionVars.cookie.username;
	let JSON_packet = {user_origin: currentUsername, user_dest: username};
	socket.emit('createChat', JSON.stringify(JSON_packet));
	return;
}

// Sets chat to be submitted on hitting enter (for user experience)
// Modified from: https://www.w3schools.com/howto/howto_js_trigger_button_enter.asp
function setInputForm()
{
	checkCookie();
	// Get the input field
	const input = document.getElementById("msg");
	// Execute a function when the user releases a key on the keyboard
	input.addEventListener("keyup", event => {
		// Number 13 is the "Enter" key on the keyboard
		if (event.keyCode === 13) 
		{
			// Cancel the default action
			event.preventDefault();
			// Trigger the button element with a click
			document.getElementById("sendMessage").click();
		}
	});
}

// Fires 'chatMessage' event and emits a message to
// the server.
function sendMessage(chatID)
{
	checkCookie();
	const messageElem = document.getElementById("msg");
	
	if (messageElem.value == "")
		return;
	
	JSON_packet = readCookie();
	JSON_packet["chatID"] = chatID;
	JSON_packet["content"] = messageElem.value;

	socket.emit('chatMessage', JSON.stringify(JSON_packet));
	messageElem.value = "";
	return;
}