var gameId;
var player;
var goal1;
var goal2;
var ball;
var player1;
var player2;
var score1;
var score2;
var points1 = 0;
var points2 = 0;
var color1
var color2
var user1;
var user2;
var goalScoredFrame = 0;
var goooaall;
var db = firebase.database()
db.ref('waiting').orderByKey().once('value', function(snapshot) {
	if (snapshot.val()) {
		gameId = snapshot.val().gameId;
		color1 = snapshot.val().color;
		user1 = snapshot.val().user1;
		user2 = document.getElementById("username").innerHTML.trim();
		player = 2;
		snapshot.ref.remove();
		db.ref('games/' + gameId).set({user2: user2});
		startGame();
	} else {
		gameId = createUUID();
		color1 = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
		user1 = document.getElementById("username").innerHTML.trim();
		player = 1;
		db.ref('waiting').set({
			gameId: gameId, 
			color: color1,
			user1: user1,
		});
		waitForOponent();
	}
});
function waitForOponent() {
	myGameArea.start();
	clearInterval(myGameArea.interval);
	myGameArea.interval = setInterval(waiting(), 50);
	var ref = db.ref('games/');
	ref.orderByKey().once("child_changed", function(snapshot) {
	    if (snapshot.key == gameId) {
		user2 = snapshot.val().user2;
		clearInterval(myGameArea.interval);
		startGame();
	    }
	});
}
function startGame() {
  myGameArea.start();
  color2 = invertHex(color1);
  goal1 = new component(100, 200, color1, 700, 175);
  goal2 = new component(100, 200, color2, 0, 175);
  ball = new component(40, 40, "images/ball.png", 400, 250, "image");
  player1 = new component(30, 30, color1, 350, 250);
  player2 = new component(30, 30, color2, 450, 250)
  score1  = new component("30px", "Consolas", "white", 795, 50, "text", true);
  score2 = new component("30px", "Consolas", "white", 5, 50, "text");
  setDBListeners();
	var ref = db.ref('games/' + gameId + '/comp/ball')
	ref.set({
		x: ball.x,
		y: ball.y,
	});
}
function setDBListeners() {	
	var ref = db.ref('games/' + gameId + "/comp");
	ref.orderByKey().on("child_changed", function(data) {
		if (data.key == "ball") {
			ball = new component(40, 40, "images/ball.png", data.val().x, data.val().y, "image");
		} else if (player == "1" && data.key == "2") {
			player2 = new component(30, 30, color2, data.val().x, data.val().y);
		} else if (player == "2" && data.key == "1") {
			player1 = new component(30, 30, color1, data.val().x, data.val().y);
		}
	}); 
}
var myGameArea = {
	canvas: document.getElementById("canvas"),
	start : function() {
		this.canvas.width = 800;
		this.canvas.height = 500;
		this.frameNo = 0;
		this.context = this.canvas.getContext("2d");
		this.interval = setInterval(updateGameArea, 20);
		window.addEventListener('keydown', function(e) {
			myGameArea.keys = (myGameArea.keys || []);
			myGameArea.keys[e.keyCode] = true;
		})
		window.addEventListener('keyup', function(e) {
			myGameArea.keys[e.keyCode] = false;
		})
	},
	clear : function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}
function component(width, height, color, x, y, type, right) {
        if (type == "image") {
		this.image = new Image();
		this.image.src = color;
	}
	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;
	this.update = function(player) {
		ctx = myGameArea.context;
		if (type == "image") {
			ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
		} else if (type == "text") {
			ctx.font = this.width + " " + this.height;
			ctx.fillStyle = color;
			if (right) ctx.textAlign = "right";
			else ctx.textAlign = "left";
			ctx.fillText(this.text, this.x, this.y);
		} else {
			ctx.fillStyle = color;
			ctx.fillRect(this.x, this.y, this.width, this.height);
		}
	}
}
function move(play) {
	if (myGameArea.keys[37]) {play.x -= 3;}
	if (myGameArea.keys[39]) {play.x += 3;}
	if (myGameArea.keys[38]) {play.y -= 3;}
	if (myGameArea.keys[40]) {play.y += 3;}
	if (myGameArea.keys[32]) {
		if (play.x >= ball.x - play.width &&
		    play.x <= ball.x + ball.width + play.width/3 &&
		    play.y <= ball.y + ball.height + play.height/3 && 
		    play.y >= ball.y - play.height) {
			ball.x += 2 * (ball.x - play.x)
			ball.y += 2 * (ball.y - play.y)
			var ref = db.ref('games/' + gameId + '/comp/ball')
			ref.set({
				x: ball.x,
				y: ball.y,
			});
		}
	}
}
function updateGameArea() {
	myGameArea.clear();
	myGameArea.frameNo += 1;
	if (myGameArea.keys) {
		if (player == 1) {
			 move(player1);
			 checkPlayerPosition(player1);
		} else  {
			move(player2)
			checkPlayerPosition(player2);
		}
	}
	if (goalScoredFrame == 0) checkBallPosition();	
	score1.text = user1 + ": " + points1;
	score2.text = user2 + ": " + points2;
	var ref = db.ref('games/' + gameId + '/comp/' + player);
	ref.set({
		x: player == 1 ? player1.x : player2.x,
		y: player == 1 ? player1.y : player2.y,
	});
	score1.update();
	score2.update();
	goal1.update();
	goal2.update();
	player1.update();
	player2.update();
	if (goalScoredFrame != 0 && myGameArea.frameNo < goalScoredFrame + 30) {
		goooaall.update();
	} else if (goalScoredFrame != 0) {
		ball.x = 400;
		ball.y = 250;
		goalScoredFrame = 0;
	}
	ball.update();
	if (points1 == 3 || points2 == 3) {
		clearInterval(myGameArea.interval);
		myGameArea.clear();
		myGameArea.interval = setInterval(gameOver(), 1000);
		deleteGame();
	}
}
function checkPlayerPosition(play) {
	if (play.x < -play.width + 1) play.x = -play.width + 1;
	if (play.y < -play.height + 1) play.y = -play.height + 1;
	if (play.x > myGameArea.canvas.width - 1) play.x = myGameArea.canvas.width - 1;
	if (play.y > myGameArea.canvas.height - 1) play.y = myGameArea.canvas.height - 1;
}
function checkBallPosition() {
	if (ball.x < 0) ball.x = 0; 
	if (ball.y < 0) ball.y = 0;
	if (ball.x > myGameArea.canvas.width - ball.width) ball.x = myGameArea.canvas.width - ball.width;
	if (ball.y > myGameArea.canvas.height - ball.height) ball.y = myGameArea.canvas.height - ball.height;
	
	//Check if ball is in goal1
	if (ball.x > 690 && ball.y > 150 && ball.y < 350 - ball.height) {
		points1  += 1;
		goalScoredFrame = myGameArea.frameNo;
		goooaall = new component("50px", "Consolas", color1, 250, 250, "text");
		goooaall.text = "GOOOOAAALL!!";
	}
	//check to see if ball is in gaol2
	if (player2 && ball.x < 110 - ball.width  && ball.y > 150 && ball.y < 350 - ball.height) {
		points2 += 1;
		goalScoredFrame = myGameArea.frameNo;
		goooaall = new component("50px", "Consolas", color2, 250, 250, "text");
		goooaall.text = "GOOOOAAALL!!";
	}
		
}
	
function gameOver() {
	var text;
	if (player == 1 && points1 == 3) text = "Congrats! You Won!";
	else if (player == 2 && points2 == 3) text = "Congrats! You Won!!";
	else text = "I'm Sorry, you lost :("
	var ctx = myGameArea.context;
	ctx.font = "40px Consolas";
	ctx.fillStyle = "white";
	ctx.fillText(text, 200, 200);
	ctx.fillText("refresh the page to play again", 100, 275);
}
function waiting() {
	var text = "Waiting for an Opponent . . ."
	var ctx = myGameArea.context;
	ctx.font = "30px Consolas";
	ctx.fillStyle = "white";
	ctx.fillText(text, 200, 200);
}
window.onbeforeunload = function() {
	clearInterval(myGameArea.interval);
	myGameArea.clear();
	deleteGame();
	return undefined;
}
	
function deleteGame() {
	db.ref('waiting').orderByKey().once('value', function(snapshot) {
		if (snapshot.val() && snapshot.val().gameId == gameId) {
			snapshot.ref.remove();
		} else {
			db.ref('games/' + gameId).orderByKey().once('value', function(snapshot) {
				snapshot.ref.remove();
			});
		}
	});
}
