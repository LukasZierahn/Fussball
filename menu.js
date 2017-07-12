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

var allTeams = [];

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
  constructor(g)
  {
    this.game = g;
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
          score[1].push(this.game.minute);
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
          score[0].push(this.game.minute);
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
    this.ball = new Football(this);
    this.ball.PutOnKickOff();
    this.minute = 1;

    this.hTeam = new Team(true);
    this.aTeam = new Team(false);

    this.UpdatePlayers();
  }

  ResetGame()
  {
    this.minute = 1;
    turn = 0;
    this.ball.pathx = [];
    this.ball.pathy = [];
    this.ball.PutOnKickOff();
    score = [[],[]];
  }

  UpdatePlayers()
  {
    players = [];

    for (var i = 0; i < 4; i++)
    {
      players.push(this.hTeam.players[i]);
      players.push(this.aTeam.players[i]);
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
      men.EndOfGame();
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

class Team
{
  constructor(side = true)
  {
    this.players = [];
    this.boolPlayers = [];
    this.name = "Borussia Dortmund";
    this.shortName = "BVB";

    if (side)
    {
      this.name = "FC Bayern Muenchen";
      this.shortName = "FCB";
    }

    this.side = side; //this is true if this is the home team
    for (var i = 0; i < 4; i++)
    {
      this.boolPlayers.push([true, true, true]);
    }

    this.CreatPlayersFromBool();
  }

  CreatPlayersFromBool(force = false)
  {
    for (var x = 0; x < 4; x++)
    {
      var bufar = [];
      for (var y = 0; y < 3; y++)
      {
        if (this.boolPlayers[x][y] || force)
        {
          if (this.side)
          {
            bufar.push(y + 2);
          }
          else
          {
            bufar.push(6 - y);
          }
        }
      }
      this.players.push(bufar);
    }
  }
}

class CanvasButton
{
  constructor(x,y, width, height, text, font = (5 / 100) * can.width + "px Arial", col = "#000000")
  {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text
    this.font = font
    this.colour = col;
  }

  Draw()
  {
    canCTX.beginPath();
    canCTX.textAlign = "center";
    canCTX.textBaseline = "middle";
    canCTX.font = this.font;
    canCTX.fillStyle = this.colour;

    canCTX.fillText(this.text, this.x + (this.width / 2), this.y + (this.height / 2));

    canCTX.rect(this.x,this.y, this.width, this.height);
    canCTX.stroke();

    canCTX.fillStyle = "#000000";
  }

  ClickedOn(x,y)
  {
    if (this.x <= x && x <= this.x + this.width)
    {
      if (this.y <= y && y <= this.y + this.height)
      {
        return true;
      }
    }
    return false;
  }
}

class Menu
{
  constructor()
  {
    AdjustCanvasSize();
    this.currentState = 1; //0 is in a game, My Teams is 5
    this.menuStart = can.width / 3;
    this.menuWidth = this.menuStart;
    this.eigthHeight = can.height / 8;
    this.selectedTeam = 0;
    can.addEventListener("click", this.OnClick.bind(this), false);

    this.mainMenuButs = {};
    this.mainMenuButs.QuickMatch = new CanvasButton(this.menuStart, this.eigthHeight, this.menuWidth, this.eigthHeight * 0.75, "Quick Match");
    this.mainMenuButs.Cup = new CanvasButton(this.menuStart, this.eigthHeight * 2, this.menuWidth, this.eigthHeight * 0.75, "Cup");
    this.mainMenuButs.Bundesliga = new CanvasButton(this.menuStart, this.eigthHeight * 3, this.menuWidth, this.eigthHeight * 0.75, "Bundesliga");
    this.mainMenuButs.MyTeams = new CanvasButton(this.menuStart, this.eigthHeight * 4, this.menuWidth, this.eigthHeight * 0.75, "My Teams");
    this.mainMenuButs.Options = new CanvasButton(this.menuStart, this.eigthHeight * 5, this.menuWidth, this.eigthHeight * 0.75, "Options");

    this.myTeamsMenuButs = {};
    this.myTeamsMenuButs.EditTeam = new CanvasButton(this.menuStart / 2, this.eigthHeight, this.menuWidth / 2, this.eigthHeight * 0.5, "Edit Team", (2.5 / 100) * can.width + "px Arial");
    this.myTeamsMenuButs.Up = new CanvasButton(this.menuStart, this.eigthHeight, this.menuWidth, this.eigthHeight * 0.5, "Up");
    this.myTeamsMenuButs.NewTeam = new CanvasButton(this.menuStart * 2, this.eigthHeight, this.menuWidth / 2, this.eigthHeight * 0.5, "New Team", (2.5 / 100) * can.width + "px Arial");
    this.myTeamsMenuButs.Preview = new CanvasButton(this.menuStart / 2, this.eigthHeight * 2, this.menuWidth * 2, this.eigthHeight * 4.5, "");
    this.myTeamsMenuButs.Down = new CanvasButton(this.menuStart, this.eigthHeight * 7, this.menuWidth, this.eigthHeight * 0.5, "Down");
    this.myTeamsMenuButs.Back = new CanvasButton(this.menuStart * 2, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Back", (2.5 / 100) * can.width + "px Arial");

    this.g = new Game();
    this.Resize();
  }

  RedoMyTeamsMenuButs()
  {
    if(allTeams.length)
    {
      this.myTeamsMenuButs.Name = new CanvasButton(this.menuStart, this.eigthHeight * 2, this.menuWidth, this.eigthHeight * 0.5, allTeams[this.selectedTeam].name, (2.5 / 100) * can.width + "px Arial");
      this.myTeamsMenuButs.ShortName = new CanvasButton(this.menuStart, this.eigthHeight * 2.5, this.menuWidth, this.eigthHeight * 0.5, allTeams[this.selectedTeam].shortName, (2.5 / 100) * can.width + "px Arial");


      for (var x = 1; x <= 4; x++)
      {
        for (var y = 1; y <= 3; y++)
        {
          var colour;

          if (allTeams[this.selectedTeam].boolPlayers[x - 1][y - 1])
          {
            colour = "#000000";
          }
          else
          {
            colour = "#e30000";
          }
          this.myTeamsMenuButs[x + "/" + y] = new CanvasButton(this.menuStart * x / 2 + this.menuWidth / 12, this.eigthHeight * 3.5 + (this.eigthHeight * (y / 1.5)), this.menuWidth / 3, this.eigthHeight * 0.5, allTeams[this.selectedTeam].players[x - 1][y - 1], (5 / 100) * can.width + "px Arial", colour);
        }
      }
    }
  }

  RedoEditMenuButs()
  {
    try
    {
      this.editTeamsMenuButs = {};
      this.editTeamsMenuButs.Name = new CanvasButton(this.menuStart, this.eigthHeight, this.menuWidth, this.eigthHeight * 0.5, allTeams[this.selectedTeam].name, (2.5 / 100) * can.width + "px Arial");
      this.editTeamsMenuButs.ShortName = new CanvasButton(this.menuStart, this.eigthHeight * 1.5, this.menuWidth, this.eigthHeight * 0.5, allTeams[this.selectedTeam].shortName, (2.5 / 100) * can.width + "px Arial");
      for (var x = 1; x <= 4; x++)
      {
        for (var y = 1; y <= 3; y++)
        {
          var colour;

          if (allTeams[this.selectedTeam].boolPlayers[x - 1][y - 1])
          {
            colour = "#000000";
          }
          else
          {
            colour = "#e30000";
          }
          this.editTeamsMenuButs[x + "/" + y] = new CanvasButton(this.menuStart * x / 2 + this.menuWidth / 12, this.eigthHeight * 2.5 + (this.eigthHeight * (y / 1.5)), this.menuWidth / 3, this.eigthHeight * 0.5, allTeams[this.selectedTeam].players[x - 1][y - 1], (5 / 100) * can.width + "px Arial", colour);
        }
      }
      this.editTeamsMenuButs.Back = new CanvasButton(this.menuStart * 2, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Back", (2.5 / 100) * can.width + "px Arial");
    }
    catch (err)
    {
      console.log("RedoEditMenuButs failed to call", err)
    }

  }

  DrawMenu()
  {
    canCTX.clearRect(0, 0, can.width, can.height);

    switch (this.currentState)
    {
      case 1:
        for (var key in this.mainMenuButs)
        {
          if (this.mainMenuButs.hasOwnProperty(key))
          {
            this.mainMenuButs[key].Draw();
          }
        }
        break;
      case 5:
        for (var key in this.myTeamsMenuButs)
        {
          if (this.myTeamsMenuButs.hasOwnProperty(key))
          {
            this.myTeamsMenuButs[key].Draw();
          }
        }
        break;
      case 6:
        for (var key in this.editTeamsMenuButs)
        {
          if (this.editTeamsMenuButs.hasOwnProperty(key))
          {
            this.editTeamsMenuButs[key].Draw();
          }
        }
        break;
      default:
      break;
    }

  }

  OnClick(event)
  {
    //console.log("click!", event.x, event.y);
    switch (this.currentState)
    {
      case 1: //the main menu
        if(this.mainMenuButs.QuickMatch.ClickedOn(event.x, event.y))
        {
          this.StartGame();
        }
        else if (this.mainMenuButs.MyTeams.ClickedOn(event.x, event.y))
        {
          this.ChangeCurrentState(5);
        }
        break;
      case 5: //inside My Teams
        if (this.myTeamsMenuButs.EditTeam.ClickedOn(event.x, event.y))
        {
          if (allTeams.length)
          {
            this.ChangeCurrentState(6);
          }
          else
          {
            alert("No team available, create a team to edit it!");
          }
        }
        else if (this.myTeamsMenuButs.NewTeam.ClickedOn(event.x, event.y))
        {
          allTeams.push(new Team());
          this.selectedTeam = allTeams.length - 1;
          this.ChangeCurrentState(6);
        }
        else if (this.myTeamsMenuButs.Back.ClickedOn(event.x, event.y))
        {
          this.ChangeCurrentState(1);
        }
        else if (this.myTeamsMenuButs.Up.ClickedOn(event.x, event.y))
        {
          this.selectedTeam++;
          if (this.selectedTeam == allTeams.length)
          {
            this.selectedTeam = 0;
          }
          this.ChangeCurrentState(5);
        }
        else if (this.myTeamsMenuButs.Down.ClickedOn(event.x, event.y))
        {
          this.selectedTeam--;
          if (this.selectedTeam == -1)
          {
            this.selectedTeam = allTeams.length - 1;
          }
          this.ChangeCurrentState(5);
        }
        break;
      case 6: //the edit team menu
        if (this.editTeamsMenuButs.Back.ClickedOn(event.x, event.y))
        {
          this.ChangeCurrentState(5);
        }
        else if (this.editTeamsMenuButs.Name.ClickedOn(event.x, event.y))
        {
          var nam = prompt("Please enter a new name!", allTeams[this.selectedTeam].name);
          if (nam)
          {
            allTeams[this.selectedTeam].name = nam;
            this.ChangeCurrentState(6);
          }
        }
        else if (this.editTeamsMenuButs.ShortName.ClickedOn(event.x, event.y))
        {
          var nam = prompt("Please enter a new abbreviation!", allTeams[this.selectedTeam].shortName);
          if (nam)
          {
            allTeams[this.selectedTeam].shortName = nam;
            this.ChangeCurrentState(6);
          }
        }
        for (var x = 1; x <= 4; x++)
        {
          for (var y = 1; y <= 3; y++)
          {
            if(this.editTeamsMenuButs[x + "/" + y].ClickedOn(event.x, event.y))
            {
              allTeams[this.selectedTeam].boolPlayers[x - 1][y - 1] = !allTeams[this.selectedTeam].boolPlayers[x - 1][y - 1];
              this.ChangeCurrentState(6);
            }
          }
        }
        break;
    }
  }

  ChangeCurrentState(newState)
  {
    this.currentState = newState;
    if (newState == 6)
    {
      this.RedoEditMenuButs();
    }
    else if (newState = 5)
    {
      this.RedoMyTeamsMenuButs();
    }
    this.DrawMenu();
  }

  StartGame()
  {
    this.currentState = 0;
    this.g.Render();
    turnInterval = setInterval(this.g.Turn.bind(this.g), 500);
  }

  EndOfGame()
  {
    this.currentState = 1;
    this.g.ResetGame();
    this.DrawMenu();
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
