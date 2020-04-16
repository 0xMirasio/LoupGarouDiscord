const Discord = require('discord.js')
const time = require('easytimer.js')
const tool = require('./tool') 
const bot = new Discord.Client()

bot.on('ready', function () {
  console.log("Connected")
})

bot.login('<your token here')

// VAR GLOBAL SECTION
var nbPlayer = 0;
var hasStarted = 0;
var Players = [];
var nbLoup = 0;
var Role = ["Loup","Sorcière","Voyante","Cupidon","Chasseur","LoupBlanc","Voleur","Villageois"];
var votes = []  //tableau pour le nombre de vote sur chaque joueur
var aVote = []  //tableau pour savoir qui a voté pour qui pour le tour actuel
var PM=  [] // tableau pour sauvegarder les object "message" de l'API Discord afin de pouvoir MP les loups
var loupCanKill = 0; // variable pour savoir si les loups peuvent tuer
var VoyanteCanReveal =  0 // variable pour savoir si la voyante peut lire un role 
var SorcerState = 0;
var SorcerRevive=  1;
var SorcerKill = 1;
var LastKilled;
var max,index 
var cpt=0;
//END OF VAR GLOBAL SECTION

// START OF EVENT FUNCTION

// OK (/loupStart)
bot.on('message', message => {
if (message.content === '/loupStart') {
	if (nbPlayer < 1) {
		message.channel.send('Pas assez de joueur pour lancez ! (Min : 5)')
	}
	else {
		if(hasStarted === 0) {
			hasStarted = 1;
			nbPlayer = Players.length
			nbLoup = Math.floor(nbPlayer/4) +1;
			nbLoup = 2 // a changer, FOR DEBUG ONLY
			message.channel.send("Nombre de Loup : " + nbLoup);
			Players = generateIDs(nbPlayer,nbLoup, Players);
			console.log("Début de partie");
			tool.annonceRole(Players, PM);
			tool.annonceDesLoups(Players,PM);
			message.channel.send('**Début de la partie...**');
			game_start(message);
			
		}
		else {
			message.channel.send('La partie a déja débuté, commande : **/loupStop** pour terminer la partie');
		}
	}

}
})

// OK (/play)
bot.on('message', message => {	
	var nomJoueur = message.author.username;
	var idJoueur = message.author;
	if (message.content === '/play') {
		if(hasStarted == 0) {
				//if(!tool.contains(nomJoueur, Players)){
					Players.push(new Player(nomJoueur,idJoueur))
					PM.push(message);
					nbPlayer = Players.length
					message.channel.send("Ajout de **" + nomJoueur + "** à la partie");
					message.channel.send("Nombre de joueurs actuels : " + nbPlayer);
				//}
				//else{
				//	message.channel.send("Joueur déjà présent  !");
				//}	
		}
		else {
			message.channel.send("La partie à déja commencé, tu ne peux rejoindre ! ");
		}		
	}
		
})

// OK (/kill)
bot.on('message', message => {	
	if (message.content.startsWith('/kill')) {
		var namePlayer = message.content.split(" ")[1];
		var check = tool.checkPlayer(namePlayer, Players);
		if (check == -1) {
			message.reply("Ce joueur n'existe pas !");
		}
		else {
		var index = tool.checkRole(message.author.username, "Loup", Players);
        if(index != -1 && Players[index].estVivant == 1 && loupCanKill == 1){
           
			voter(message.author.username, namePlayer);
        }else{
            message.reply("Vous n'avez pas le droit d'utilser cette commande !");
        }
		var namePlayer = message.author.username;
		var namePlayerVictime = ''
		var namePlayerLoup = '';
		namePlayerVictime = message.content.split(" ")[1]
		for (i=0; i<Players.length; i++) {
			if(Players[i].role == 'Loup' && Players[i].nom != namePlayer && index != -1) {
				namePlayerLoup = Players[i].nom;
				for (j=0; j<PM.length; j++) {
					if(PM[j].author.username == namePlayerLoup) {
						PM[j].author.send(namePlayer +' souhaite tuer '+ namePlayerVictime);
					}
				}
			}
		}
	}
	} 
})

// TODO : Rajoutez toute les commandes (help) quand ca sera fini
bot.on('message', message => {	
			if (message.content === '/help') {
			message.channel.send('Liste des commandes :  \n **/loupStart **(Débute la partie) \n** /loupStop** (Termine la partie) \n **/play** (Vous ajoute à la partie) \n **/leave** (Quitte la partie) \n **/voteKill** [PLAYER] (votez un joueur que vous pensez être un loup) \n **/elire** [PLAYER] (votez pour un maire)\n **/garouKill** [PLAYER] (Envoyez un MP à LoupGarou-Bot pour tuez un joueur pendant la nuit')
			} 
})

// TODO : quand toute sera fini, remettre tout les valeurs a zero
bot.on('message', message => {	
	if (message.content === '/loupStop') {
		message.channel.send("Fin de la partie...");
		nbPlayer = 0;
		nbLoup = 0;
		Players = [];
		Loup = [];

	} 
})

// OK : reveal the role of a player (voyante)
bot.on('message', message => {	
	if (message.content.startsWith('/reveal')) {
		var playerToReveal = message.content.split(" ")[1];
		var res = tool.checkRole(message.author.username,"Voyante",Players);
		var check = tool.checkPlayer(playerToReveal, Players);
		if (check == -1) {
			message.reply("Ce joueur n'existe pas !");
		}
		else {
			for (i=0; i< Players.length ; i++) {
				if (message.author.username == Players[i].nom) {
					var voyant = Players[i];
				}
			}
			if (res != -1 && voyant.estVivant == 1 && VoyanteCanReveal == 1) {
				var role=  tool.reveal(playerToReveal, Players);
				message.author.send(playerToReveal + ' est : '+ role);
				VoyanteCanReveal = 0;
			}
			else {
				message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
			}
	}
	} 
})


//OK (Sorciere curse)
bot.on('message', message => {	
	if (message.content.startsWith('/curse')) {
		var playerToDie = message.content.split(" ")[1]
		var sorcer = ''
		var check = tool.checkPlayer(playerToDie, Players);
		if (check == -1) {
			message.reply("Ce joueur n'existe pas !");
		}
		else {
		for (i=0; i<Players.length; i++) {
			if (message.author.username == Players[i].name) {
				sorcer = Players[i];
			}
		}
		if (Players[i].role == "Sorcière" &&  Players[i].estVivant == true &&  SorcerKill == 1) {
			for (j=0; j<Players.length; j++) {
				if (playerToDie == Players[j].nom) {
					Players[j].estVivant = false;
					SorcerKill = 0;
				}
			}
		}
		else {
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}
	}
	} 
})

// OK (Sorcière Revive)
bot.on('message', message => {	
	if (message.content.startsWith('/revive')) {
		var playerToLive = message.content.split(" ")[1]
		var sorcer = ''
		var check = tool.checkPlayer(playerToLive, Players);
		if (check == -1) {
			message.reply("Ce joueur n'existe pas !");
		}
		else {
		for (i=0; i<Players.length; i++) {
			if (message.author.username == Players[i].name) {
				sorcer = Players[i];
			}
		}
		if (sorcer.role == "Sorcière" &&  sorcer.estVivant == true &&  SorcerRevive == 1 && LastKilled.nom != playerToLive) {
			for (j=0; j<Players.length; j++) {
				if (playerToLive == Players[j].nom && Players[j].estVivant == false && LastKilled.nom == Players[j].nom) {
					sorcer.author.send("Tu as fait revivre " + playerToLive);
					Players[j].estVivant = true;
					SorcerRevive = 0;
				}
			}
		}
		else {
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}
	}
	} 
})

// OK (list)
bot.on('message', message => {	
	if (message.content === '/list') {
		var fx= '';
		for (i=0 ; i<Players.length ; i++) {
			if (Players[i].estVivant == 1) {
				fx = Players[i].nom + "," +  fx;
			}
		}
		message.channel.send("Les joueurs vivants sont : **"+ fx+"**");
	} 
})

// OK (leave)
bot.on('message', message => {    
    if (message.content === '/leave') {
        var joueur = message.author.username;
        var retour = tool.retirerJoueur(joueur,Players);
        if(retour){
			message.channel.send(joueur + " à quitté la partie !");
        }else{
			message.channel.send("Ce joueur n'est pas présent dans la partie"); 
        }
        
    }
})

class Player{
	constructor(nom, id){
		this.nom = nom;
		this.idJoueur = id;
		this.estVivant = true;
		this.role = null;
	}
	setRole(role){
		this.role = role;
	}
    toString(){
        return this.nom + ':' + this.role;
    }

}

function generateIDs(n,nbLoup,tabJoueurs){
    var ids = [];
    for(i = 0; i<n;i++){
        ids.push(i);
    }

    ids = tool.knuthfisheryates(ids);

    var index, cartesDispo = n - nbLoup;
    for(index = 0;index<nbLoup;index++){
        tabJoueurs[ids[index]].setRole(Role[0]);
    }

 
    for(index = 0;index<cartesDispo;index++){
        if(index >=6){
            tabJoueurs[ids[index+nbLoup]].setRole(Role[7]);
        }else{
            tabJoueurs[ids[index+nbLoup]].setRole(Role[index+1]) ;
        }  
	}

	return tabJoueurs;

}

function voter(nomVotant, nomVote){
	var votant = tool.containsIndice(nomVotant,Players);
	var vote = tool.containsIndice(nomVote,Players);

	//Si le joueur a déjà voté, on retire le vote précédent
	if(aVote[votant] != -1){
		votes[aVote[votant]]--;
	}
	//On incrémente ensuite le nombre de vote du joueur voté 
	votes[vote]++;
	//On met a jour aVoté
	aVote[votant] = vote;
}


function game_start(message) {

	cpt++;
	message.channel.send('DEBUT NUIT : '+ cpt);
	message.channel.send('-------------------------------------------------------------------\n\n');
	loupandvoyante_time(message);
}


function loupandvoyante_time(message) {
	message.channel.send('\nLes loups ont **45s** pour choisir leur victime...');
	message.channel.send('\nLa voyante a **45s** pour reveler une personne...');
	var timer = new time.Timer();
	votes,aVote = tool.initVotes(nbPlayer,votes,aVote);
	VoyanteCanReveal = 1;
	loupCanKill = 1;
	timer.start({countdown: true, startValues: {seconds: 40}});
	timer.addEventListener('secondsUpdated', function (e) {
			if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
				message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
			};
		});
	timer.addEventListener('targetAchieved', function (e) {
		message.channel.send("**Fin du temps !\n**");
		loupCanKill = 0;
		VoyanteCanReveal = 0
		max = tool.resultatVote(votes);
		for (i=0; i<Players.length ; i++) {
			if (Players[i].role == 'Sorcière') {
				var player_sorcer = Players[i].nom;
			}
		}
		if (max != 0)  {
			index = tool.checkEgalite(max, votes);
			if (index == -1) {
				sorciere_time(message,1,player_sorcer,index);
			}
			else {
				Players[index].estVivant = false;
				LastKilled = Players[index];
				sorciere_time(message,2,player_sorcer,index);
			}
		}
		else {
			sorciere_time(message,1,player_sorcer,index);
		}
		
	})

	
}

function sorciere_time(message, state, name,index) {
	var timer = new time.Timer();
		SorcerState = 1;
		message.channel.send("\nLa Sorcière à **30** secondes pour utiliser ses pouvoirs !");
		if (state == 1) {
			for (i=0; i<PM.length ; i++) {
				if (name == PM[i].author.username) {
					PM[i].author.send("Personne n'a été tué. Vous pouvez utilisez votre potion de mort ou ne rien faire");
				}
			}
		}
		else {
			for (i=0; i<PM.length ; i++) {
				if (name == PM[i].author.username) {
					PM[i].author.send(Players[index].name +" a été tué par les loups, Vous pouvez utilisez votre potion de mort sur quelqu'un ou faire revivre "+Players[index].name);
				}
			}
		}
		timer.start({countdown: true, startValues: {seconds: 30}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
			});
		timer.addEventListener('targetAchieved', function (e) {
			message.channel.send("Fin du temps !\n");
			SorcerState = 0
			if (max != 0)  {
				if (index == -1) {
					message.channel.send("Les loups n'ont pas réussi a se départager! *Personne ne meurs*...");
				}
				else {
					if (Players[index].estVivant == false) {
						message.channel.send("Les loups ont décidé d'éliminer **"+Players[index].nom + "** !\nIl/Elle etait "+Players[index].role + " ...");
					}
				}
			}
			else {
				message.channel.send("les *loups n'ont pas voulu tuer de villageois*...");
			}
			votes,aVote=tool.resetVotes(votes,aVote);
			game_start(message);
	});
}
