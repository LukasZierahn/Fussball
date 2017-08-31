var can = document.getElementById("fieldCan");
var canCTX = can.getContext("2d");
var players = [];
var menuSize = 200;
var fieldHeight = can.height - menuSize;
var fieldMiddle = fieldHeight / 2 + menuSize
var keeperPadding = 150;
var dice = 1;
var diceHistory = [];
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

    diceHistory.push(dice);

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
        if (dice == 4 && this.y == 2)
        {
          this.CheckCollumForPlays(0);
          return;
        }
        else if(this.CheckCollumForPlays(1) && dice != 4)
        {
          score[1].push(this.game.minute);
          console.log("away scored", score)
          this.pathx.push(0);
          this.pathy.push(fieldMiddle / can.height);
          this.startingSide = !this.startingSide
          this.PutOnKickOff();
        }
        this.CheckCollumForPlays(0);
        return;
      }
      else if (this.x == 6)
      {
        if (dice == 4 && this.y == 2)
        {
          this.CheckCollumForPlays(7);
          return;
        }
        else if(this.CheckCollumForPlays(6) && dice != 4)
        {
          score[0].push(this.game.minute);
          console.log("home scored", score)
          this.pathx.push(1);
          this.pathy.push(fieldMiddle / can.height);
          this.startingSide = !this.startingSide
          this.PutOnKickOff();
        }
        this.CheckCollumForPlays(7);
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
      if (players[colx][i] == "")
      {
        continue;
      }
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
  constructor(forceResult = false)
  {
    this.ball = new Football(this);
    this.ball.PutOnKickOff();
    this.minute = 1;
    this.result = undefined;
    this.forceResult = forceResult;

    this.hTeam = new Team("", true);
    this.aTeam = new Team("", false);

    this.UpdatePlayers();
  }

  ResetGame()
  {
    this.minute = 1;
    this.result = undefined;
    turn = 0;
    this.ball.pathx = [];
    this.ball.pathy = [];
    this.ball.PutOnKickOff();
    score = [[],[]];
    this.UpdatePlayers();
  }

  UpdatePlayers()
  {
    this.hTeam.side = true;
    this.aTeam.side = false;
    this.hTeam.CreatPlayersFromBool();
    this.aTeam.CreatPlayersFromBool();

    players = [];
    for (var i = 0; i < 4; i++)
    {
      players.push(this.hTeam.players[i]);
      players.push(this.aTeam.players[i]);
    }
  }

  Turn(d = 0)
  {
    if (turn == 45)
    {
      this.ball.PutOnKickOff();
      this.ball.startingSide = false;
      this.minute = 46;
      turn++;
      half = 1;
      return;
    }
    else if(turn == 93)
    {
      if (!this.forceResult || score[0] != score[1])
      {
        clearInterval(turnInterval);
        men.EndOfGame();
        return;
      }
      else
      {
        this.ball.PutOnKickOff();
        this.ball.startingSide = true;
        this.minute = 91;
        turn++;
        half = 3;
        return;
      }
    }
    else if(turn == 108)
    {
      this.ball.PutOnKickOff();
      this.ball.startingSide = false;
      this.minute = 106;
      turn++;
      half = 4;
      return;
    }
    else if (turn == 123)
    {
      clearInterval(turnInterval);
      men.EndOfGame();
      return;
    }


    turn++;
    this.minute++;


    this.ball.Turn(d);
    this.Render();
  }


  Render()
  {
    canCTX.textAlign = "center";
    canCTX.textBaseline = "middle";
    canCTX.clearRect(0, 0, can.width, can.height);

    //the dice
    canCTX.font = (5 / 100) * can.width + "px Arial";
    canCTX.fillText(dice, can.width / 2,50);
    canCTX.font = (2.5 / 100) * can.width + "px Arial";
    for (var i = 1; i <= 5; i++) //i starts at one so we access the diceHistory.length - 1 item first
    {
      if (i > diceHistory.length)
      {
        break;
      }
      canCTX.fillText(diceHistory[diceHistory.length - i], can.width / 2.25, 50 + i * menuSize / 10);
    }
    canCTX.font = (2.5 / 100) * can.width + "px Arial";

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
    canCTX.font = (2.5 / 100) * can.width + "px Arial";
    var scoreHomeIndex = 0, scoreAwayIndex = 0;
    canCTX.fillText(this.hTeam.shortName + " " + score[0].length + ":" + score[1].length + " " + this.aTeam.shortName, 3 * can.width / 4,50);
    for (var i = 1; i <= 5; i++)
    {
      if (i > score[0].length + score[1].length)
      {
        break;
      }
      if (((score[0].length - scoreHomeIndex) && !(score[1].length - scoreAwayIndex)) || (score[0][score[0].length - scoreHomeIndex - 1] > score[1][score[1].length - scoreAwayIndex - 1]))
      {
        canCTX.fillText("Minute " + score[0][score[0].length - scoreHomeIndex - 1] + ":     " + (score[0].length - (scoreHomeIndex)) + ":" + (score[1].length - scoreAwayIndex), 3 * can.width / 4, 50 + i * menuSize / 10);
        scoreHomeIndex++;
      }
      else if (((score[1].length - scoreAwayIndex) && !(score[0].length - scoreHomeIndex)) || (score[0][score[0].length - scoreHomeIndex - 1] < score[1][score[1].length - scoreAwayIndex - 1]))
      {
        canCTX.fillText("Minute " + score[1][score[1].length - scoreAwayIndex - 1] + ":     " + (score[0].length - scoreHomeIndex) + ":" + (score[1].length - (scoreAwayIndex)), 3 * can.width / 4, 50 + i * menuSize / 10);
        scoreAwayIndex++;
      }
      else
      {
        break;
      }

    }
    canCTX.font = (2.5 / 100) * can.width + "px Arial";

    //the players
    var negativPlayers = -1;
    for (var x = 0; x < players.length; x++)
    {
      negativPlayers *= -1;
      for (var y = 0; y < players[x].length; y++)
      {
        if (players[x][y] == "")
        {
          continue;
        }
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
  constructor(inputSafeString = "", side = true)
  {
    this.players = [];
    this.boolPlayers = [];
    this.name = "Borussia Dortmund";
    this.shortName = "BVB";
    this.safeString = inputSafeString;

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

    if (this.safeString != "")
    {
      this.LoadFromString();
    }
    this.CreatPlayersFromBool(true);
  }

  CreatPlayersFromBool(force = false)
  {
    this.players = [];
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
        else
        {
          bufar.push("");
        }
      }
      this.players.push(bufar);
    }
  }

  UpdateString()
  {
    this.safeString = "";
    this.safeString += this.name + "/";
    this.safeString += this.shortName + "/";
    for (var i = 0; i < this.boolPlayers.length; i++)
    {
      for (var j = 0; j < this.boolPlayers[i].length; j++)
      {
        if (this.boolPlayers[i][j])
        {
          this.safeString += "1";
        }
        else
        {
          this.safeString += "0";
        }
      }
    }
  }

  LoadFromString()
  {
    if (this.safeString == "")
    {
      console.log("Tried to load a team from an empty string");
      return false;
    }
    console.log(this.safeString);
    var buf = this.safeString.split("/");
    this.name = buf[0];
    this.shortName = buf[1];

    this.boolPlayers = [];
    for (var i = 0; i < 4; i++)
    {
      var bufArray = [];
      for (var j = 0; j < 3; j++)
      {
        if (buf[2][(i * 3) + j] == "1")
        {
          bufArray.push(true);
        }
        else
        {
          bufArray.push(false);
        }
      }

      this.boolPlayers.push(bufArray);
    }
  }
}

class Cup
{
  constructor()
  {
    this.teamlist = [];
    this.cupSize = 8; //huehuehuehuehe
    this.pairings = []; //first round has 4 pairs, second 2 and last 1
    this.results = []; //1 means the first team won, 2 means the second did, 0 means no result yet
    this.initialized = false;
    this.currentGame = 0;
  }

  Init()
  {
    var teamlistbuffer = [];
    for (var i in this.teamlist)
    {
      teamlistbuffer.push(i);
    }
    var teamlistShuffeld = [];
    for (var i = 0; i < this.cupSize; i++)
    {
      teamlistShuffeld.push(teamlistbuffer.splice(Math.floor(Math.random() * teamlistbuffer.length - 1), 1)[0]);
    }

    this.pairings.push([]);
    this.results.push([])
    for (var i = 0; i < this.cupSize; i += 2)
    {
      this.teamlist[i] = teamlistShuffeld[i];
      this.teamlist[i + 1] = teamlistShuffeld[i + 1];
      this.pairings[0].push([teamlistShuffeld[i], teamlistShuffeld[i + 1]]);
    }

    this.pairings.push([[],[]]); //2 pairings in the semi finals
    this.pairings.push([]); //one final pairing
    this.initialized = true;
    console.log(this.pairings);
  }

  NextGame()
  {
    if (this.currentGame < 4) //first pairings are getting played
    {
      men.hTeam = this.pairings[0][this.currentGame][0];
      men.aTeam = this.pairings[0][this.currentGame][1];
      men.StartGame();
    }
  }

  EndOfGame()
  {
    if (this.currentGame < 4)
    {
      if (men.g.result)
      {
        this.pairings[Math.floor(this.currentGame / 2)][this.currentGame % 2] = this.pairings[0][this.currentGame][0];
      }
      else
      {
        this.pairings[Math.floor(this.currentGame / 2)][this.currentGame % 2] = this.pairings[0][this.currentGame][1];
      }
    }
    this.currentGame++;
  }
}

class selectMenu
{
  constructor()
  {
    this.selected = [];
    this.toChooseFrom = [];
    this.selectedPage = 0;
    this.toChooseFromPage = 0;

    this.teamsShownPerPage = 8;

    for (var i = 0; i < allTeams.length; i++)
    {
      this.toChooseFrom.push(i);
    }
  }

  IncreaseSelectedPage()
  {
    var max = Math.floor(this.currentlySelected.length / this.teamsShownPerPage);
    if (this.selectedPage < max)
    {
      this.selectedPage++;
    }
    else
    {
      this.selectedPage = 0;
    }
  }

  DecreaseSelectedPage()
  {
    var max = Math.floor(this.toChooseFrom.length / this.teamsShownPerPage);
    if (this.selectedPage > 0)
    {
      this.selectedPage--;
    }
    else
    {
      this.selectedPage = max;
    }
  }

  IncreaseToChooseFromPage()
  {
    var max = Math.floor(this.toChooseFrom.length / this.teamsShownPerPage);
    if (this.toChooseFromPage < max)
    {
      this.toChooseFromPage++;
    }
    else
    {
      this.toChooseFromPage = 0;
    }
  }

  DecreaseToChooseFromPage()
  {
    var max = Math.floor(this.toChooseFrom.length / this.teamsShownPerPage);
    if (this.toChooseFromPage > 0)
    {
      this.toChooseFromPage--;
    }
    else
    {
      this.toChooseFromPage = max;
    }
  }

  GetToChooseFrom(index)
  {
    if (index + this.toChooseFromPage * this.teamsShownPerPage < this.toChooseFrom.length)
    {
      return this.toChooseFrom[index + this.toChooseFromPage * this.teamsShownPerPage];
    }
    else
    {
      return undefined;
    }
  }

  GetSelected(index)
  {
    if (index + this.selectedPage * this.teamsShownPerPage < this.selected.length)
    {
      return this.selected[index + this.selectedPage * this.teamsShownPerPage];
    }
    else
    {
      return undefined;
    }
  }

  //this moves the team from the toChooseFrom to the Selected List
  Select(index)
  {
    if (index + this.toChooseFromPage * this.teamsShownPerPage < this.toChooseFrom.length && this.selected.length < 8)
    {
      this.selected.push(this.toChooseFrom.splice(index + this.toChooseFromPage * this.teamsShownPerPage, 1));
    }
  }

  Deselect(index)
  {
    if (index + this.selectedPage * this.teamsShownPerPage < this.selected.length)
    {
      this.toChooseFrom.push(this.selected.splice(index + this.selectedPage * this.teamsShownPerPage, 1));
    }
  }

  Reset()
  {
    this.selected = [];
    this.toChooseFrom = [];
    this.selectedPage = 0;
    this.toChooseFromPage = 0;

    this.teamsShownPerPage = 8;

    for (var i = 0; i < allTeams.length; i++)
    {
      this.toChooseFrom.push(i);
    }
  }
}

class CanvasButton
{
  constructor(x,y, width, height, text, font = (5 / 100) * can.width + "px Arial", col = "#000000", db = true)
  {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text
    this.font = font
    this.colour = col;
    this.drawBorder = db;
  }

  Draw()
  {
    canCTX.textAlign = "center";
    canCTX.textBaseline = "middle";
    canCTX.font = this.font;
    canCTX.fillStyle = this.colour;

    canCTX.fillText(this.text, this.x + (this.width / 2), this.y + (this.height / 2));

    if (this.drawBorder)
    {
      canCTX.beginPath();

      canCTX.rect(this.x,this.y, this.width, this.height);
      canCTX.stroke();

      canCTX.fillStyle = "#000000";
    }
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
    this.currentState = 1; //0 is in a game, quickMatchMenu is 2, the Cup Menu is 3, My Teams is 5, Team edit is 6, the match finished screen is 7
    this.menuStart = can.width / 3;
    this.menuWidth = this.menuStart;
    this.eigthHeight = can.height / 8;
    this.selectedTeam = 0;
    this.autoplay = false;
    this.debugMode = true;
    this.inCup = false;

    this.cup = new Cup();
    this.selMen = new selectMenu();

    this.aTeam = 0;
    this.hTeam = 1;

    this.isSafed = true;
    can.addEventListener("click", this.OnClick.bind(this), false);
    window.addEventListener("keypress", this.KeyStroke.bind(this), false);

    this.LoadAllTeams();

    this.mainMenuButs = {};
    this.mainMenuButs.QuickMatch = new CanvasButton(this.menuStart, this.eigthHeight, this.menuWidth, this.eigthHeight * 0.75, "Quick Match");
    this.mainMenuButs.Cup = new CanvasButton(this.menuStart, this.eigthHeight * 2, this.menuWidth, this.eigthHeight * 0.75, "Cup");
    this.mainMenuButs.Bundesliga = new CanvasButton(this.menuStart, this.eigthHeight * 3, this.menuWidth, this.eigthHeight * 0.75, "Bundesliga");
    this.mainMenuButs.MyTeams = new CanvasButton(this.menuStart, this.eigthHeight * 4, this.menuWidth, this.eigthHeight * 0.75, "My Teams");
    this.mainMenuButs.Options = new CanvasButton(this.menuStart, this.eigthHeight * 5, this.menuWidth, this.eigthHeight * 0.75, "Options");

    this.quickMatchMenuButs = {};
    this.quickMatchMenuButs.Start = new CanvasButton(this.menuStart, this.eigthHeight * 6, this.menuWidth, this.eigthHeight, "Start");
    this.quickMatchMenuButs.hTeamUp = new CanvasButton(0, this.eigthHeight * 2.5, this.menuWidth * 1.2, this.eigthHeight * 0.5, "Up");
    this.quickMatchMenuButs.hTeamDown = new CanvasButton(0, this.eigthHeight * 4, this.menuWidth * 1.2, this.eigthHeight * 0.5, "Down");
    this.quickMatchMenuButs.aTeamUp = new CanvasButton(can.width - this.menuWidth * 1.2, this.eigthHeight * 2.5, this.menuWidth * 1.2, this.eigthHeight * 0.5, "Up");
    this.quickMatchMenuButs.aTeamDown = new CanvasButton(can.width - this.menuWidth * 1.2, this.eigthHeight * 4, this.menuWidth * 1.2, this.eigthHeight * 0.5, "Down");
    this.quickMatchMenuButs.Versus = new CanvasButton(this.menuStart, this.eigthHeight * 2.5, this.menuWidth, this.eigthHeight * 2, "V.S.", undefined, undefined, false);
    this.quickMatchMenuButs.Back = new CanvasButton(this.menuStart * 1.25, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Back", (2.5 / 100) * can.width + "px Arial");

    this.myTeamsMenuButs = {};
    this.myTeamsMenuButs.EditTeam = new CanvasButton(this.menuStart / 2, this.eigthHeight, this.menuWidth / 2, this.eigthHeight * 0.5, "Edit Team", (2.5 / 100) * can.width + "px Arial");
    this.myTeamsMenuButs.Up = new CanvasButton(this.menuStart, this.eigthHeight, this.menuWidth, this.eigthHeight * 0.5, "Up");
    this.myTeamsMenuButs.NewTeam = new CanvasButton(this.menuStart * 2, this.eigthHeight, this.menuWidth / 2, this.eigthHeight * 0.5, "New Team", (2.5 / 100) * can.width + "px Arial");
    this.myTeamsMenuButs.Preview = new CanvasButton(this.menuStart / 2, this.eigthHeight * 2, this.menuWidth * 2, this.eigthHeight * 4.5, "");
    this.myTeamsMenuButs.Down = new CanvasButton(this.menuStart, this.eigthHeight * 7, this.menuWidth, this.eigthHeight * 0.5, "Down");
    this.myTeamsMenuButs.Safe = new CanvasButton(this.menuStart / 2, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Safe", (2.5 / 100) * can.width + "px Arial");
    this.myTeamsMenuButs.Back = new CanvasButton(this.menuStart * 2, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Back", (2.5 / 100) * can.width + "px Arial");

    this.editTeamsMenuButs = {};
    this.editTeamsMenuButs.Delete = new CanvasButton(this.menuStart / 2, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Delete", (2.5 / 100) * can.width + "px Arial");
    this.editTeamsMenuButs.Back = new CanvasButton(this.menuStart * 2, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Back", (2.5 / 100) * can.width + "px Arial");

    this.gameFinishedMenuButs = {};
    this.gameFinishedMenuButs.Back = new CanvasButton(this.menuStart * 1.25, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Back", (2.5 / 100) * can.width + "px Arial");

    this.cupMenuButs = {};
    this.cupMenuButs.TCFUp = new CanvasButton(this.menuStart / 4, this.eigthHeight * 0.75, this.menuWidth, this.eigthHeight / 2, "Up");
    this.cupMenuButs.TCFDown = new CanvasButton(this.menuStart / 4, this.eigthHeight * 5.75, this.menuWidth, this.eigthHeight / 2, "Down");
    //this.cupMenuButs.SelUp = new CanvasButton(this.menuStart * 1.75, this.eigthHeight * 0.75, this.menuWidth, this.eigthHeight / 2, "Up");
    this.cupMenuButs.SelectedTitle = new CanvasButton(this.menuStart * 1.75, this.eigthHeight * 0.75, this.menuWidth, this.eigthHeight / 2, "Currently Playing:", undefined, undefined, false);
    //this.cupMenuButs.SelDown = new CanvasButton(this.menuStart * 1.75, this.eigthHeight * 5.75, this.menuWidth, this.eigthHeight / 2, "Down");
    this.cupMenuButs.Start = new CanvasButton(this.menuStart , this.eigthHeight * 6.5, this.menuWidth, this.eigthHeight * 0.5, "Start");
    this.cupMenuButs.Back = new CanvasButton(this.menuStart * 1.25, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Back", (2.5 / 100) * can.width + "px Arial");

    this.cupButs = {};
    this.cupButs.NextGame = new CanvasButton(this.menuStart , this.eigthHeight * 6.5, this.menuWidth, this.eigthHeight * 0.5, "Next Game", (2.5 / 100) * can.width + "px Arial");
    this.cupButs.Back = new CanvasButton(this.menuStart * 1.25, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "Back", (2.5 / 100) * can.width + "px Arial");
    this.cupButs.New = new CanvasButton(this.menuStart * 2.25, this.eigthHeight * 7, this.menuWidth / 2, this.eigthHeight * 0.5, "New Cup", (2.5 / 100) * can.width + "px Arial");

    this.g = new Game();
    this.Resize();
  }

  SafeAllTeams()
  {
    this.isSafed = true;
    localStorage.teamCount = allTeams.length;
    for (var i = 0; i < allTeams.length; i++)
    {
      allTeams[i].UpdateString();
      localStorage["team" + i] = allTeams[i].safeString;
    }
    this.selMen.Reset();
  }

  LoadAllTeams()
  {
    this.isSafed = true;
    allTeams = [];
    if (localStorage.teamCount === "undefiend")
    {
      allTeams.push(new Team("", true));
      allTeams.push(new Team("", false));
      return;
    }

    for (var i = 0; i < localStorage.teamCount; i++)
    {
      allTeams.push(new Team(localStorage["team" + i]));
    }
    this.selMen.Reset();
  }

  RedoMyTeamsMenuButs()
  {
    if(allTeams.length)
    {
      this.myTeamsMenuButs.Name = new CanvasButton(this.menuStart * 0.75, this.eigthHeight * 2, this.menuWidth * 1.5, this.eigthHeight * 0.5, allTeams[this.selectedTeam].name, (2.5 / 100) * can.width + "px Arial");
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
      this.editTeamsMenuButs.Name = new CanvasButton(this.menuStart * 0.75, this.eigthHeight, this.menuWidth * 1.5, this.eigthHeight * 0.5, allTeams[this.selectedTeam].name, (2.5 / 100) * can.width + "px Arial");
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
    }
    catch (err)
    {
      console.log("RedoEditMenuButs failed to call", err)
    }

  }

  RedoQuickGameMenuButs()
  {
    if (allTeams[this.hTeam].name.length > 7)
    {
      this.quickMatchMenuButs.hTeamName = new CanvasButton(0, this.eigthHeight * 3, this.menuWidth * 1.2, this.eigthHeight, allTeams[this.hTeam].name, (2.5 / 100) * can.width + "px Arial");
    }
    else
    {
      this.quickMatchMenuButs.hTeamName = new CanvasButton(0, this.eigthHeight * 3, this.menuWidth * 1.2, this.eigthHeight, allTeams[this.hTeam].name);
    }

    if (allTeams[this.aTeam].name.length > 7)
    {
      this.quickMatchMenuButs.aTeamName = new CanvasButton(can.width - this.menuWidth * 1.2, this.eigthHeight * 3, this.menuWidth * 1.2, this.eigthHeight, allTeams[this.aTeam].name, (2.5 / 100) * can.width + "px Arial");
    }
    else
    {
      this.quickMatchMenuButs.aTeamName = new CanvasButton(can.width - this.menuWidth * 1.2, this.eigthHeight * 3, this.menuWidth * 1.2, this.eigthHeight, allTeams[this.aTeam].name);
    }
  }

  RedoGameFinishedMenuButs()
  {
    this.gameFinishedMenuButs.Score = new CanvasButton(this.menuStart, this.eigthHeight * 2, this.menuStart, this.eigthHeight, allTeams[this.hTeam].shortName +  " " + score[0].length.toString() + " : " + score[1].length.toString() + " " + allTeams[this.aTeam].shortName, undefined, undefined, false);

    var scoreHomeIndex = 0, scoreAwayIndex = 0;
    for (var i = 1; i <= score[0].length + score[1].length; i++)
    {
      if (i > score[0].length + score[1].length)
      {
        break;
      }
      if (((score[0].lenght - scoreHomeIndex - 1) && !(scoreAwayIndex - score[1].length - 1)) || (score[0][scoreHomeIndex] < score[1][scoreAwayIndex]))
      {
        this.gameFinishedMenuButs[i] = new CanvasButton(this.menuStart, this.eigthHeight * (3 + ((i - 1) / 3)), this.menuStart, this.eigthHeight / 3, "Minute " + score[0][scoreHomeIndex] + ":     " + (scoreHomeIndex + 1) + ":" + (scoreAwayIndex), (2.5 / 100) * can.width + "px Arial", undefined, false);
        scoreHomeIndex++;
      }
      else if (((scoreAwayIndex - score[1].length - 1) && !(score[0].lenght - scoreHomeIndex -1)) || (score[0][scoreHomeIndex] > score[1][scoreAwayIndex]))
      {
        this.gameFinishedMenuButs[i] = new CanvasButton(this.menuStart, this.eigthHeight * (3 + ((i - 1) / 3)), this.menuStart, this.eigthHeight / 3, "Minute " + score[1][scoreAwayIndex] + ":     " + (scoreHomeIndex) + ":" + (scoreAwayIndex + 1), (2.5 / 100) * can.width + "px Arial", undefined, false);
        scoreAwayIndex++;
      }
      else
      {
        break;
      }

    }
  }

  RedoCupMenuButs()
  {
    var textBuf = undefined;
    for (var selectedIndex = 0; selectedIndex < this.selMen.teamsShownPerPage; selectedIndex++)
    {
      if (allTeams[this.selMen.GetSelected(selectedIndex)] == undefined)
      {
        delete this.cupMenuButs["sel" + selectedIndex];
        continue;
      }
      textBuf = allTeams[this.selMen.GetSelected(selectedIndex)].name;
      this.cupMenuButs["sel" + selectedIndex] = new CanvasButton(this.menuStart * 1.75, this.eigthHeight * (1.5 + selectedIndex / 2), this.menuWidth, this.eigthHeight / 2, textBuf, (2.5 / 100) * can.width + "px Arial");
    }

    for (var toChooseFromIndex = 0; toChooseFromIndex < this.selMen.teamsShownPerPage; toChooseFromIndex++)
    {
      if (allTeams[this.selMen.GetToChooseFrom(toChooseFromIndex)] == undefined)
      {
        delete this.cupMenuButs["TCF" + toChooseFromIndex];
        continue;
      }
      textBuf = allTeams[this.selMen.GetToChooseFrom(toChooseFromIndex)].name;
      this.cupMenuButs["TCF" + toChooseFromIndex] = new CanvasButton(this.menuStart / 4, this.eigthHeight * (1.5 + toChooseFromIndex / 2), this.menuWidth, this.eigthHeight / 2, textBuf, (2.5 / 100) * can.width + "px Arial", "#e30000");
    }
  }

  RedoCupButs()
  {
    //making the first buttons
    var space = 0;
    for (var i = 0; i < this.cup.cupSize; i++)
    {
      if (i % 2 == 0)
      {
        space += 0.5;
      }

      var textBuf = "";
      if (this.cup.teamlist[i] != undefined)
      {
        textBuf = allTeams[this.cup.teamlist[i]].name;
      }

      this.cupButs["CupBut" + i] = new CanvasButton(this.menuStart * 0.125, this.eigthHeight * (i / 2 + space), this.menuWidth * 0.75, this.eigthHeight / 2, textBuf, (2 / 100) * can.width + "px Arial");
    }

    space = -0.75;
    for (var i = 0; i < this.cup.cupSize / 2; i++)
    {
      if (i % 2 == 0)
      {
        space += 2;
      }

      var textBuf = "";
      if (this.cup.pairings[1][Math.floor(i / 2)][i % 2] !== undefined)
      {
        textBuf = allTeams[this.cup.pairings[1][Math.floor(i / 2)][i % 2]].name;
      }

      this.cupButs["CupBut Semi" + i] = new CanvasButton(this.menuStart * 1.125, this.eigthHeight * (i / 2 + space), this.menuWidth * 0.75, this.eigthHeight / 2, textBuf, (2 / 100) * can.width + "px Arial");
    }
    this.cupButs["CupBut Finals0"] = new CanvasButton(this.menuStart * 2.125, this.eigthHeight * 2.75, this.menuWidth * 0.75, this.eigthHeight / 2, "textBuf", (2 / 100) * can.width + "px Arial");
    this.cupButs["CupBut Finals1"] = new CanvasButton(this.menuStart * 2.125, this.eigthHeight * 3.25, this.menuWidth * 0.75, this.eigthHeight / 2, "textBuf", (2 / 100) * can.width + "px Arial");
  }

  DrawMenu()
  {
    canCTX.clearRect(0, 0, can.width, can.height);

    //yes yes this is really hacky and it would be way better to just make an array with all buttons
    //and iterate through the index of the current state
    //Past me didnt do it and current me is too lazy to fix it since i am close to being done with the project anyway
    //so i guess its a future me problem if i look at this ever again that is
    //hi future me by the way, i love you too ;)
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
      case 2:
        for (var key in this.quickMatchMenuButs)
        {
          if (this.quickMatchMenuButs.hasOwnProperty(key))
          {
            this.quickMatchMenuButs[key].Draw();
          }
        }
        break;
      case 3:
        for (var key in this.cupMenuButs)
        {
          if (this.cupMenuButs.hasOwnProperty(key))
          {
            this.cupMenuButs[key].Draw();
          }
        }
        break;
      case 4:
        for (var key in this.cupButs)
        {
          if (this.cupButs.hasOwnProperty(key))
          {
            this.cupButs[key].Draw();
          }
        }
        canCTX.beginPath();
        //connecting the first 4 pairs to the semi finals
        for (var i = 0; i < 2; i++)
        {
          canCTX.moveTo(this.menuStart * 0.875, this.eigthHeight * (1 + i * 3));
          canCTX.lineTo(this.menuStart, this.eigthHeight * (1 + i * 3));
          canCTX.lineTo(this.menuStart, this.eigthHeight * (2.5 + i * 3));
          canCTX.lineTo(this.menuStart * 0.875, this.eigthHeight * (2.5 + i * 3));

          canCTX.moveTo(this.menuStart, this.eigthHeight * (1.75 + i * 3));
          canCTX.lineTo(this.menuStart * 1.125, this.eigthHeight * (1.75 + i * 3));
        }

        canCTX.moveTo(this.menuStart * 1.875, this.eigthHeight * 1.75);
        canCTX.lineTo(this.menuStart * 2, this.eigthHeight * 1.75);
        canCTX.lineTo(this.menuStart * 2, this.eigthHeight * 4.75);
        canCTX.lineTo(this.menuStart * 1.875, this.eigthHeight * 4.75);

        canCTX.moveTo(this.menuStart * 2, this.eigthHeight * 3.25);
        canCTX.lineTo(this.menuStart * 2.125, this.eigthHeight * 3.25);

        canCTX.stroke();
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
      case 7:
      for (var key in this.gameFinishedMenuButs)
      {
        if (this.gameFinishedMenuButs.hasOwnProperty(key))
        {
          this.gameFinishedMenuButs[key].Draw();
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
          this.ChangeCurrentState(2);
        }
        else if (this.mainMenuButs.MyTeams.ClickedOn(event.x, event.y))
        {
          this.ChangeCurrentState(5);
        }
        else if (this.mainMenuButs.Cup.ClickedOn(event.x, event.y))
        {
          if (this.cup.initialized)
          {
            this.ChangeCurrentState(4);
          }
          else
          {
            this.ChangeCurrentState(3);
          }
        }

        break;
      case 2: //inside QuickMatch
        if (this.quickMatchMenuButs.Back.ClickedOn(event.x,event.y))
        {
          this.ChangeCurrentState(1);
        }
        else if (this.quickMatchMenuButs.Start.ClickedOn(event.x,event.y))
        {
          this.StartGame();
        }
        else if (this.quickMatchMenuButs.hTeamUp.ClickedOn(event.x,event.y))
        {
          this.hTeam = this.IncreaseTeam(this.hTeam, true);
          this.ChangeCurrentState(2);
        }
        else if (this.quickMatchMenuButs.hTeamDown.ClickedOn(event.x,event.y))
        {
          this.hTeam = this.DecreaseTeam(this.hTeam, true);
          this.ChangeCurrentState(2);
        }
        else if (this.quickMatchMenuButs.aTeamUp.ClickedOn(event.x,event.y))
        {
          this.aTeam = this.IncreaseTeam(this.aTeam, true);
          this.ChangeCurrentState(2);
        }
        else if (this.quickMatchMenuButs.aTeamDown.ClickedOn(event.x,event.y))
        {
          this.aTeam = this.DecreaseTeam(this.aTeam, true);
          this.ChangeCurrentState(2);
        }
        break;
      case 3: //First Cup Menu
        if (this.cupMenuButs.Back.ClickedOn(event.x,event.y))
        {
          this.selMen.Reset();
          this.ChangeCurrentState(1);
        }
        for (var toChooseFromIndex = 0; toChooseFromIndex < this.selMen.teamsShownPerPage; toChooseFromIndex++)
        {
          if (this.cupMenuButs.hasOwnProperty("TCF" + toChooseFromIndex))
          {
            if (this.cupMenuButs["TCF" + toChooseFromIndex].ClickedOn(event.x,event.y))
            {
              this.selMen.Select(toChooseFromIndex);
              this.ChangeCurrentState(3);
            }
          }
        }
        for (var selectIndex = 0; selectIndex < this.selMen.teamsShownPerPage; selectIndex++)
        {
          if (this.cupMenuButs.hasOwnProperty("sel" + selectIndex))
          {
            if (this.cupMenuButs["sel" + selectIndex].ClickedOn(event.x,event.y))
            {
              this.selMen.Deselect(selectIndex);
              this.ChangeCurrentState(3);
            }
          }
        }
        if(this.cupMenuButs.TCFUp.ClickedOn(event.x,event.y))
        {
          this.selMen.IncreaseToChooseFromPage();
          this.ChangeCurrentState(3);
        }
        if(this.cupMenuButs.TCFDown.ClickedOn(event.x,event.y))
        {
          this.selMen.DecreaseToChooseFromPage();
          this.ChangeCurrentState(3);
        }
        if (this.cupMenuButs.Start.ClickedOn(event.x, event.y))
        {
          this.cup.teamlist = [];
          for (var i in this.selMen.selected)
          {
            this.cup.teamlist.push(i);
          }
          this.cup.Init();
          this.ChangeCurrentState(4);
        }
        break;
      case 4:
        if (this.cupButs.Back.ClickedOn(event.x,event.y))
        {
          this.ChangeCurrentState(1);
        }
        if (this.cupButs.New.ClickedOn(event.x,event.y))
        {
          this.cup.initialized = false;
          this.ChangeCurrentState(3);
        }
        if (this.cupButs.NextGame.ClickedOn(event.x,event.y))
        {
          this.cup.NextGame();
        }
      break;
      case 5: //inside My Teams
        if (this.myTeamsMenuButs.EditTeam.ClickedOn(event.x, event.y))
        {
          if (allTeams.length)
          {
            this.isSafed = false;
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
          this.isSafed = false;
          this.ChangeCurrentState(6);
        }
        else if (this.myTeamsMenuButs.Back.ClickedOn(event.x, event.y))
        {
          if (!this.isSafed)
          {
            if(confirm("Current changes are unsafed and will be discarded, do you really want to go back?"))
            {
              this.LoadAllTeams();
            }
            else
            {
              return;
            }
          }
          this.ChangeCurrentState(1);
        }
        else if (this.myTeamsMenuButs.Up.ClickedOn(event.x, event.y))
        {
          this.selectedTeam = this.IncreaseTeam(this.selectedTeam);
          this.ChangeCurrentState(5);
        }
        else if (this.myTeamsMenuButs.Down.ClickedOn(event.x, event.y))
        {
          this.selectedTeam = this.DecreaseTeam(this.selectedTeam);
          this.ChangeCurrentState(5);
        }
        else if (this.myTeamsMenuButs.Safe.ClickedOn(event.x, event.y))
        {
          this.SafeAllTeams();
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
        else if (this.editTeamsMenuButs.Delete.ClickedOn(event.x, event.y))
        {
          if (confirm("Do you really want to delete " + allTeams[this.selectedTeam].name + "?"))
          {
            allTeams.splice(this.selectedTeam, 1);
            this.selectedTeam--;
          }
          this.ChangeCurrentState(5);
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
      case 7:
        if (this.gameFinishedMenuButs.Back.ClickedOn(event.x, event.y))
        {
          this.ChangeCurrentState(1)
        }
        break;
    }
  }

  DecreaseTeam(currInd, checkForDoubles = false)
  {
    currInd--;
    if ((currInd == this.aTeam || currInd == this.hTeam) && checkForDoubles)
    {
      currInd--;
    }
    if (currInd < 0)
    {
      currInd = allTeams.length + currInd;
    }
    if ((currInd == this.aTeam || currInd == this.hTeam) && checkForDoubles)
    {
      currInd--;
    }

    return currInd;
  }

  IncreaseTeam(currInd, checkForDoubles = false)
  {
    currInd++;
    if ((currInd == this.aTeam || currInd == this.hTeam) && checkForDoubles)
    {
      currInd++;
    }
    if (currInd >= allTeams.length)
    {
      currInd = currInd - allTeams.length;
    }
    if ((currInd == this.aTeam || currInd == this.hTeam) && checkForDoubles)
    {
      currInd++;
    }
     return currInd;
  }

  KeyStroke(event)
  {
    if (event.key == " ")
    {
      if (this.currentState == 0)
      {
        this.g.Turn();
      }
    }
    else if (event.key < 7 && event.Key != 0 && this.debugMode && this.currentState == 0)
    {
      console.log("forced " + event.key);
      this.g.Turn(event.key)
    }
  }

  ChangeCurrentState(newState)
  {
    this.currentState = newState;
    switch (newState)
    {
    case (2):
      this.RedoQuickGameMenuButs();
      this.inCup = false;
      break;
    case (3):
      this.RedoCupMenuButs();
      break;
    case (4):
      this.RedoCupButs();
      this.inCup = true;
      break;
    case (5):
      this.RedoMyTeamsMenuButs();
      break;
    case (6):
      this.RedoEditMenuButs();
      break;
    case (7):
      this.RedoGameFinishedMenuButs();
      break;
    }
    this.DrawMenu();
  }

  StartGame()
  {
    this.currentState = 0;
    this.g.hTeam = allTeams[this.hTeam];
    this.g.aTeam = allTeams[this.aTeam];
    this.g.ResetGame();
    this.g.forceResult = this.inCup;
    this.g.Render();
    if (this.autoplay)
    {
      turnInterval = setInterval(this.g.Turn.bind(this.g), 500);
    }
  }

  EndOfGame()
  {
    if (this.inCup)
    {
      this.cup.EndOfGame();
      this.ChangeCurrentState(4);
    }
    else
    {
      this.ChangeCurrentState(7);
    }
    diceHistory = [];
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
