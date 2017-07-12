var can = document.getElementById("fieldCan");
var canCTX = can.getContext("2d");
var players = [];
var menuSize = 200;
var fieldHeight = can.height - menuSize;
var fieldMiddle = fieldHeight / 2 + menuSize
var keeperPadding = 150;
var dice = 1;
var turn = 0;
var half = 0;

var men;

var turnInterval;

var score = [[],[]];


window.onresize = AdjustCanvasSize;

function AdjustCanvasSize()
{
  if ((window.innerWidth / window.innerHeight) > (10/7))
  {
    canCTX.canvas.height = window.innerHeight - 25;
    canCTX.canvas.width = Math.floor((window.innerHeight - 25) * (10/7));
  }
  else
  {
    canCTX.canvas.height = Math.floor((window.innerWidth - 25) * (7/10));
    canCTX.canvas.width = window.innerWidth - 25;
  }

  menuSize = (2/7) * can.height;
  fieldHeight = can.height - menuSize;
  fieldMiddle = fieldHeight / 2 + menuSize;
  console.log("resizing canvas to:", window.innerWidth, window.innerHeight, (window.innerWidth / window.innerHeight), canCTX.canvas.width, canCTX.canvas.height)

  try
  {
    men.Resize();
  }
  catch (err)
  {
    console.log("Tried to resize but men was undefiend");
  }
}

class Football
{
  constructor()
  {
    this.x = 4;
    this.y = 1;
    this.px = can.width / 2;
    this.py = can.height / 2;
    this.pathx = [];
    this.pathy = [];
    this.state = 0; //0: Kick Off, 1-4: Corners, 5 & 6: keeper, 7: playing
    this.startingSide = true; //this is true if the home team has the ball
    this.oneLastTurn = false;
    this.alreadyMoved = false;
  }

  AddCurrentPositionToPath()
  {
    this.pathx.push(this.px / can.width);
    this.pathy.push((this.py + Math.floor(Math.random() * 15) - 7) / can.height);
  }

  Draw()
  {
    if (this.state == 7)
    {
      this.px = keeperPadding + (this.x * ((can.width - (keeperPadding * 2)) / (players.length - 1)))
      this.py = menuSize + (fieldHeight / players[this.x].length) * (this.y + 0.5)
    }

    this.AddCurrentPositionToPath();
    this.DrawPath();

    canCTX.beginPath();
    canCTX.arc(this.px, this.py, 10, 0, 2 * Math.PI);
    canCTX.stroke();
  }

  DrawPath()
  {
    if(this.pathx)
    {
      canCTX.beginPath();
      canCTX.moveTo(this.pathx[0] * can.width, this.pathy[0] * can.height);
      for (var i = 1; i < this.pathx.length; i++)
      {
        canCTX.lineTo(this.pathx[i] * can.width, this.pathy[i] * can.height);
      }
      canCTX.stroke();
    }
  }

  Turn(d = 0)
  {
    if (d)
    {
      dice = d;
    }
    else
    {
      dice = Math.floor(Math.random() * 6) + 1;
    }
    console.log(turn, dice);

    if (dice == 1)
    {
      if(this.oneLastTurn)
      {
        this.py = fieldMiddle;
        if (this.startingSide)
        {
          this.state = 6; //goes to away keeper
          this.px = can.width - (keeperPadding / 3);
          return;
        }
        else
        {
          this.state = 5; //goes to home keeper
          this.px = keeperPadding / 3
          return;
        }
      }
      this.oneLastTurn = true;
    }
    else
    {
      this.oneLastTurn = false;
    }

    this.alreadyMoved = false; //depending on the ball control we change the checking order to ensure that fours still get the ball to the correct team (the one with ball control)
    var checkingArea = -1;
    if (this.state == 0) //Kick Off
    {
      checkingArea = 3;
    }
    else if (this.state == 5) //home keeper
    {
      this.CheckCollumForPlays(0);
      this.CheckCollumForPlays(1);
      return;
    }
    else if (this.state == 6) //away keeper
    {
      this.CheckCollumForPlays(7);
      this.CheckCollumForPlays(6);
      return;
    }
    else if (this.state == 7) //ball playing
    {
      if (this.x == 1)
      {
        this.CheckCollumForPlays(0);
        if(this.CheckCollumForPlays(1))
        {
          score[1].push(turn);
          console.log("away scored", score)
          this.pathx.push(0);
          this.pathy.push(fieldMiddle / can.height);
          this.PutOnKickOff();
        }
        return;
      }
      else if (this.x == 6)
      {
        this.CheckCollumForPlays(7);
        if(this.CheckCollumForPlays(6))
        {
          score[0].push(turn);
          console.log("home scored", score)
          this.pathx.push(1);
          this.pathy.push(fieldMiddle / can.height);
          this.PutOnKickOff();
        }
        return;
      }

      if (this.startingSide)
      {
        checkingArea = this.x + 1; //the row at the index of checkingArea and the row right next to it get checked
      }
      else
      {
        checkingArea = this.x - 2;
      }
    }

    if (this.startingSide)
    {
      this.CheckCollumForPlays(checkingArea + 1);
      this.CheckCollumForPlays(checkingArea);
    }
    else
    {
      this.CheckCollumForPlays(checkingArea);
      this.CheckCollumForPlays(checkingArea + 1);
    }

  }

  CheckCollumForPlays(colx)
  {
    if (this.alreadyMoved)
    {
      return false;
    }

    for (var i = 0; i < players[colx].length; i++)
    {
      if (players[colx][i] == dice)
      {
        this.state = 7;
        this.x = colx;
        this.y = i;
        this.alreadyMoved = true;
        if (colx % 2)
        {
          this.startingSide = false;
        }
        else
        {
          this.startingSide = true;
        }
        return true;
      }
    }

    return false;

  }

  PutOnKickOff()
  {
    this.state = 0;
    this.x = 0;
    this.y = 0;
    this.px = can.width / 2;
    this.py = fieldMiddle;
  }
};


class Game
{
  constructor()
  {
    this.ball = new Football();
    this.ball.PutOnKickOff();
    this.minute = 1;

    for (var i = 0; i < 4; i++)
    {
      players.push([2,3,4]);
      players.push([4,5,6]);
    }
  }

  Turn()
  {
    if (turn == 45)
    {
      this.ball.PutOnKickOff();
      this.ball.startingSide = false;
      this.minute = 46;
      turn++;
      half = 1;
    }
    else if(turn == 93)
    {
      clearInterval(turnInterval);
      return;
    }
    else
    {
      turn++;
      this.minute++;
    }


    this.ball.Turn();
    this.Render();
  }


  Render()
  {
    canCTX.textAlign = "center";
    canCTX.textBaseline = "middle";
    canCTX.clearRect(0, 0, can.width, can.height);

    canCTX.font = (2.5 / 100) * can.width + "px Arial"
    canCTX.fillText(dice, can.width / 2,50);

    //the time
    if ((this.minute <= 45 && half == 0) || (this.minute <= 90 && half == 1))
    {
      canCTX.fillText(this.minute, can.width / 4,50);
    }
    else
    {
      canCTX.fillText((45 * (1 + half)) + " + " + (this.minute - 45 * (1 + half)) , can.width / 4,50);
    }

    //the score
    canCTX.fillText(score[0].length + ":" + score[1].length, 3 * can.width / 4,50);

    //the players
    var negativPlayers = -1;
    for (var x = 0; x < players.length; x++)
    {
      negativPlayers *= -1;
      for (var y = 0; y < players[x].length; y++)
      {
        canCTX.fillText(negativPlayers * players[x][y], keeperPadding + (x * ((can.width - (keeperPadding * 2)) / (players.length - 1))), (menuSize + (fieldHeight / players[x].length) * (y + 0.5)));
      }
    }

    canCTX.textAlign = "center";
    canCTX.fillText(1, keeperPadding / 3, fieldMiddle);
    canCTX.fillText(-1, can.width - (keeperPadding / 3), fieldMiddle);

    //the ball
    this.ball.Draw()

    //the menu
    canCTX.beginPath();
    canCTX.moveTo(0, menuSize);
    canCTX.lineTo(can.width, menuSize);
    canCTX.stroke();
  }
};


class Menu
{
  constructor()
  {
    this.currentState = 1; //0 is in a game
    this.menuStart = can.width / 3;
    this.menuWidth = this.menuStart;
    this.eigthHeight = can.height / 8;
    AdjustCanvasSize();
    can.addEventListener("click", this.OnClick.bind(this), false);
    this.g = new Game();
    this.Resize();
  }

  DrawMenu()
  {
    canCTX.clearRect(0, 0, can.width, can.height);
    canCTX.beginPath();
    if (this.currentState == 1)
    {
      for (var i = 1; i < 6; i++)
      {
          canCTX.rect(this.menuStart, this.eigthHeight * i, this.menuWidth, this.eigthHeight * 0.75);
      }

      canCTX.textAlign = "center";
      canCTX.textBaseline = "middle";
      canCTX.font = (5 / 100) * can.width + "px Arial"
      canCTX.fillText("Quick Match", this.menuStart * 1.5, this.eigthHeight * 1.4);
      canCTX.fillText("Cup", this.menuStart * 1.5, this.eigthHeight * 2.4);
      canCTX.fillText("Bundesliga", this.menuStart * 1.5, this.eigthHeight * 3.4);
      canCTX.fillText("My Teams", this.menuStart * 1.5, this.eigthHeight * 4.4);
      canCTX.fillText("Options", this.menuStart * 1.5, this.eigthHeight * 5.4);

      canCTX.stroke();
    }
  }

  OnClick(event)
  {
    console.log("click!", event.x, event.y);
    if(this.currentState == 1 && this.menuStart <= event.x && event.x <= this.menuStart + this.menuWidth)
    {
      if(this.eigthHeight <= event.y && event.y <= this.eigthHeight * 1.75)
      {
        this.StartGame();
      }
    }
  }

  StartGame()
  {
    this.currentState = 0;
    this.g.Render();
    turnInterval = setInterval(this.g.Turn.bind(this.g), 500);
  }

  Resize()
  {
    this.menuStart = can.width / 3;
    this.menuWidth = this.menuStart;
    this.eigthHeight = can.height / 8;
    if (this.currentState)
    {
      this.DrawMenu();
    }
  }

};

men = new Menu();
