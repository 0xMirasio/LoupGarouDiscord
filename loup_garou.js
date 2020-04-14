const Discord = require('discord.js')
const time = require('easytimer.js')
const tool = require('./tool') 
const bot = new Discord.Client()

bot.on('ready', function () {
  console.log("Connected")
})

bot.login('Njk5MDE0NDY0Nzc5MDU5MjEx.XpWdjQ.jQ_EjOcBcJuZihVYgQP1x--rZd0')


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

//END OF VAR GLOBAL SECTION

// START OF EVENT FUNCTION

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

// OK
bot.on('message', message => {	
	var nomJoueur = message.author.username;
	var idJoueur = message.author;
	if (message.content === '/play') {
		if(hasStarted == 0) {
				if(!tool.contains(nomJoueur, Players)){
					Players.push(new Player(nomJoueur,idJoueur))
					PM.push(message);
					nbPlayer = Players.length
					message.channel.send("Ajout de **" + nomJoueur + "** à la partie");
					message.channel.send("Nombre de joueurs actuels : " + nbPlayer);
				}
				else{
					message.channel.send("Joueur déjà présent  !");
				}	
		}
		else {
			message.channel.send("La partie à déja commencé, tu ne peux rejoindre ! ");
		}		
	}
		
})

// OK
bot.on('message', message => {	
	if (message.content.startsWith('/kill')) {
		var index = tool.checkRole(message.author.username, "Loup", Players);
        if(index != -1 && Players[index].estVivant == 1 && loupCanKill == 1){
            var namePlayer = message.content.split(" ")[1];
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
})

// TODO : Rajoutez tout quand ca sera fini
bot.on('message', message => {	
			if (message.content === '/help') {
			message.channel.send('Liste des commandes :  \n **/loupStart **(Débute la partie) \n** /loupStop** (Termine la partie) \n **/play** (Vous ajoute à la partie) \n **/leave** (Quitte la partie) \n **/voteKill** [PLAYER] (votez un joueur que vous pensez être un loup) \n **/elire** [PLAYER] (votez pour un maire)\n **/garouKill** [PLAYER] (Envoyez un MP à LoupGarou-Bot pour tuez un joueur pendant la nuit')
			} 
})

// TODO : quand toute sera fini, remettre tout les valeurs a 
bot.on('message', message => {	
	if (message.content === '/loupStop') {
		message.channel.send("Fin de la partie...");
		nbPlayer = 0;
		nbLoup = 0;
		Players = [];
		Loup = [];

	} 
})

// TODO : reveal the role of a player
bot.on('message', message => {	
	if (message.content.startsWith('/reveal')) {
		var playerToReveal = message.content.split(" ")[1]

	} 
})
// OK
bot.on('message', message => {	
	if (message.content === '/list') {
		var fx= '';
		for (i=0 ; i<Players.length ; i++) {
			fx = Players[i].nom + "," +  fx;
		}
		message.channel.send("Les joueurs présents sont : **"+ fx+"**");
	} 
})

// OK
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

	var cpt=1
	while (hasStarted === 1) {
		message.channel.send('DEBUT NUIT : '+ cpt);
		message.channel.send('-------------------------------------------------------------------\n\n');
		message.channel.send('\nLes loups ont 60s pour choisir leur victime...');
		message.channel.send('/list');
		loup_time(message);
		cpt++;
		break;
	}
}
function loup_time(message) {
	var timer = new time.Timer();
	votes,aVote = tool.initVotes(nbPlayer,votes,aVote);
	loupCanKill = 1;
	timer.start({countdown: true, startValues: {seconds: 60}});
	timer.addEventListener('secondsUpdated', function (e) {
			if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0) {
				message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
			};
		});
	timer.addEventListener('targetAchieved', function (e) {
		message.channel.send("Fin du temps !\n");
		loupCanKill = 0;
		var max = tool.resultatVote(votes);
		if (max != 0)  {
			var index = tool.checkEgalite(max, votes);
			if (index == -1) {
				message.channel.send("Les loups n'ont pas réussi a se départager! Personne ne meurs...");
			}
			message.channel.send("Les loups ont décidé d'éliminer " + Players[index].nom);
			Players[index].estVivant = 0;
		}
		else {
			message.channel.send("les loups n'ont pas voulu tuer de villageois...");
		}
		votes,aVote=tool.resetVotes(votes,aVote);
		voyante_time(message);
	})
}
function voyante_time(message) {
		
		var timer = new time.Timer();
		VoyanteCanReveal = 1;
		message.channel.send("\nLa Voyante à 30secondes pour utiliser son pouvoir afin de lire le role d'un joueur !");
		message.channel.send('/list');
		timer.start({countdown: true, startValues: {seconds: 30}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0) {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
			});
		timer.addEventListener('targetAchieved', function (e) {
			message.channel.send("Fin du temps !\n");
			VoyanteCanReveal = 0
		});
}

