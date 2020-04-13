const Discord = require('discord.js')
const bot = new Discord.Client()

bot.on('ready', function () {
  console.log("Connected")
})

bot.login('Njk5MDE0NDY0Nzc5MDU5MjEx.XpOOCA.ViQl4RWd5tFPmNzzMccDhYGgc5E')


// VAR GLOBAL SECTION
var nbPlayer = 0;
var hasStarted = 0;
var Players = [];
var nbLoup = 0;
var Role = ["Loup","Sorcière","Voyante","Cupidon","Chasseur","LoupBlanc","Voleur","Villageois"];
var availableCard=  0;
//END OF VAR GLOBAL SECTION

// START OF EVENT FUNCTION


bot.on('message', message => {
if (message.content === '/loupStart') {
	if (nbPlayer < 5) {
		message.channel.send('Pas assez de joueur pour lancez ! (Min : 5)')
	}
	else {
		if(hasStarted === 0) {
			hasStarted = 1;
			nbLoup = Math.floor(nbPlayer/4) +1;
			message.channel.send("Nombre de Loup : " + nbLoup);
			availableCard = nbPlayer - nbLoup;
			message.channel.send('**Début...**');
			
			//console.log("Début de partie")
		}
		else {
			message.channel.send('La partie a déja débuté, commande : **/loupStop** pour terminer la partie');
		}
	}

}
})


bot.on('message', message => {	
	var nomJoueur = message.author.username;
	var idJoueur = message.author;
	if (message.content === '/play') {
		if(hasStarted == 0) {
				if(!contains(nomJoueur)){
					Players.push(new Player(nomJoueur,idJoueur))
					nbPlayer = Players.length
					message.channel.send("Ajout de **" + nomJoueur + "** à la partie");
					//loupkill("Mirasio",message);
					generateIDs(nbPlayer);
					console.log(Players[0].toString());
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

bot.on('message', message => {	
			if (message.content === '/help') {
			message.channel.send('Liste des commandes :  \n **/loupStart **(Débute la partie) \n** /loupStop** (Termine la partie) \n **/play** (Vous ajoute à la partie) \n **/leave** (Quitte la partie) \n **/voteKill** [PLAYER] (votez un joueur que vous pensez être un loup) \n **/elire** [PLAYER] (votez pour un maire)\n **/garouKill** [PLAYER] (Envoyez un MP à LoupGarou-Bot pour tuez un joueur pendant la nuit')
			} 
})

bot.on('message', message => {	
	if (message.content === '/loupStop') {
		message.channel.send("Fin de la partie...");
		nbPlayer = 0;
		nbLoup = 0;
		Players = [];
		Loup = [];

	} 
})

bot.on('message', message => {	
	if (message.content === '/list') {
		message.channel.send("Les joueurs présents sont : **"+ Players+"**");
	} 
})

bot.on('message', message => {    
    if (message.content === '/leave') {
        var joueur = message.author.username;
        var retour = retirerJoueur(joueur);
        if(retour){
			message.channel.send(joueur + " à quitté la partie !");
        }else{
			message.channel.send("Ce joueur n'est pas présent dans la partie"); 
        }
        
    }
})
//END OF EVENT SECTION
//START  FUNCTION SECTION


function retirerJoueur(nomUtilisateur){
    for(i = 0; i<Players.length; i++){
        if(Players[i].nom == nomUtilisateur){
            Players.splice(i,1);
            return 1;
        }
    }
    return 0;  
}
function contains(nomUtilisateur){
    for(i = 0; i<Players.length; i++){
        if(Players[i].nom == nomUtilisateur){
            return true;
        }
    }
    return false;
}

function loupkill(name,message) {
	for(i = 0; i<Players.length; i++){
	   if (Players[i].role == "Loup") {
		   message.author = Players[i].idJoueur;
		   message.author.send("bite");
	   }
	   console.log(message.author.id)
	   message.author.id = Players[0].idJoueur;
	   console.log(message.author.id)
	   //message.author.send(message.author.username+ ' Want to kills : '+  name);
    }
}

function reveal(nomUtilisateur){
    var nomRole;
    for(i = 0; i<Players.length;i++){
        if(Players[i].nom == nomUtilisateur){
           Players[i].role;
        }
    }
    return null;
}

// phase debug section
nbPlayer = Players.length;
nbLoup = Math.floor(nbPlayer/4);
generateIDs(nbPlayer);
// end of debug section
function generateIDs(n){
    var ids = [];
    for(i = 0; i<n;i++){
        ids.push(i);
    }

    ids = knuthfisheryates(ids);

    var index, cartesDispo = n - nbLoup;
    for(index = 0;index<nbLoup;index++){
        Players[ids[index]].setRole = Role[0];
    }

 
    for(index = 0;index<cartesDispo;index++){
        if(index >=6){
            Players[ids[index+nbLoup]].setRole = Role[7];
        }else{
            Players[ids[index+nbLoup]].setRole = Role[index+1] ;
        }  
	}


}
function knuthfisheryates(arr) {
    var i, temp, j, len = arr.length;
    for (i = 0; i < len; i++) {
        j = ~~(Math.random() * (i + 1));
        temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

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
