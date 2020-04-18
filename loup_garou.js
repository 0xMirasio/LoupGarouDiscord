const Discord = require('discord.js')
const time = require('easytimer.js')
const tool = require('./tool') 
const bot = new Discord.Client()
require('events').EventEmitter.defaultMaxListeners = 20;

bot.on('ready', function () {
  console.log("Connected")
})

bot.login('token here');

// VAR GLOBAL SECTION
var nbPlayer = 0;
var hasStarted = 0;
var Players = [];
var nbLoup = 0;
var nbSV = 0; //Nombre de simples villageois
// var Role = ["Loup","Sorcière","Voyante","Cupidon","Chasseur","LoupBlanc","Voleur","Villageois"];
var rolesDispo = ["Sorcière","Voyante","Cupidon","Chasseur", "Noctambule"];
var rolesChoisis = [];
var votes = []  //tableau pour le nombre de vote sur chaque joueur
var aVote = []  //tableau pour savoir qui a voté pour qui pour le tour actuel
var PM=  [] // tableau pour sauvegarder les object "message" de l'API Discord afin de pouvoir MP les loups
var loupCanKill = 0; // variable pour savoir si les loups peuvent tuer
var phaseVillage = false;
var phaseChasseur = false;
var joueurATuer;  //Variable utilisée pour connaitre le joueur à tuer
var max,index;
var cpt=0;
var sorciere, voyante, cupidon, chasseur, noctambule; //Variable pour stocker les rôles spéciaux


//END OF VAR GLOBAL SECTION

// START OF EVENT FUNCTION

//----------------------BOT LISTENERS--------------------//

// OK (/loupStart)
//Ajout d'un cas else if qui vérifie qu'il y a autant de joueurs que de rôles
bot.on('message', async message => {

    if (message.content === '/loupStart') {
        if (nbPlayer < 1) {
            message.channel.send('Pas assez de joueur pour lancez ! (Min : 5)')
        }else if (nbPlayer != rolesChoisis.length+nbLoup+nbSV){
            message.channel.send('Pas assez de rôles pour le nombre de joueur');
        }else {
            if(hasStarted === 0) {
                hasStarted = 1;
                nbPlayer = Players.length
                // nbLoup = Math.floor(nbPlayer/4) +1;
                // nbLoup = 2 // a changer, FOR DEBUG ONLY
                message.channel.send("Nombre de Loup : " + nbLoup);
                Players = generateIDs(nbPlayer,nbLoup, Players, rolesChoisis);
                console.log("Début de partie");
                await tool.annonceRole(Players, PM);
				await tool.annonceDesLoups(Players,PM);

				//initialisation des votes
				var dataVotes = tool.initVotes(nbPlayer,votes,aVote);
				votes = dataVotes[0];
				aVote = dataVotes[1];

				//Initialisation des rôles spéciaux
				sorciere = getJoueurRole("Sorcière", Players);
				if(sorciere !=-1){
					sorciere.peuxAgir = false; //attribut pour savoir si la sorcière peut effectuer une action
					sorciere.peuxTuer = true; //attribut pour savoir si la sorcière peut tuer
					sorciere.peuxSauver = true; //attribut pour savoir si la sorcière peut sauver
				}
				
				voyante = getJoueurRole("Voyante", Players);
				if(voyante !=-1){
					voyante.peuxVoir = false; // attribut pour savoir si la voyante peut lire un role 
					voyante.dejaVu = []; //Tableau pour stocker les joueurs dont les rôles sont déjà connus par la voyante
					voyante.dejaVu.push(voyante);
				}
				

				cupidon = getJoueurRole("Cupidon", Players);
				if(cupidon!=-1){
					cupidon.peuxLier = true; //attribut pour savoir si cupidon peut lier deux joueurs
				}

				chasseur = getJoueurRole("Chasseur", Players);
				if(chasseur !=-1){
					chasseur.peuxTuer = true; //attribut pour savoir si le chasseur peut tuer
				}

				noctambule = getJoueurRole("Noctambule", Players);
				if(noctambule){
					noctambule.dejaDormi = [] //Tableau pour stocker les joueurs chez lesquels le noctambule a déjà dormi
					noctambule.peuxDormir = false;
				}

                message.channel.send('**Début de la partie...**');
                game_start(message);
                
            }
            else {
                message.channel.send('La partie a déja débuté, commande : **/loupStop** pour terminer la partie');
            }
        }
    
    }
});

// OK (/play)
bot.on('message', message => {	
	var nomJoueur = message.author.username;
	var idJoueur = message.author;
	if (message.content === '/play') {
		if(hasStarted == 0) {
				//if(!tool.contains(nomJoueur, Players)){
					Players.push(new Player(nomJoueur,idJoueur))
					PM.push(message);
					nbPlayer++;
					message.channel.send("Ajout de **" + nomJoueur + "** à la partie");
					message.channel.send("Nombre de joueurs actuels : " + nbPlayer);

					//maj 
					nbLoup = Math.floor(nbPlayer/5) +1;
					nbSV= nbPlayer-nbLoup-rolesChoisis.length;
				//}
				//else{
				//	message.channel.send("Joueur déjà présent  !");
				//}	
		}
		else {
			message.channel.send("La partie à déja commencé, tu ne peux rejoindre ! ");
		}		
	}
		
});


// OK (leave)
bot.on('message', message => {    
    if (message.content === '/leave') {
        var joueur = message.author.username;
		var retour = tool.retirerJoueur(joueur,Players);
		console.log(retour);
        if(retour){
			nbPlayer--;

			nbLoup = Math.floor(nbPlayer/5) +1;
			nbSV= nbPlayer-nbLoup-rolesChoisis.length;

			message.channel.send("**"+joueur + "** à quitté la partie !");
        }else{
			message.channel.send("Ce joueur n'est pas présent dans la partie"); 
        }
        
    }
})


//Commande pour ajouter un rôle
bot.on('message', message => {
    if (message.content.startsWith('/addRole')) {
		var roleAjout = message.content.split(" ")[1];
        //On ajoute un role uniquement s'il y en a moins que le nombre de joueurs
        // if(rolesChoisis.length < Players.length-nbLoup-nbSV){ 
		var datas = tool.ajouterRole(roleAjout, rolesDispo, rolesChoisis, nbSV);
		rolesDispo = datas[0] ;
		rolesChoisis = datas[1];
		nbSV = datas[3];
		console.log("nb loup : "+nbLoup);
		console.log("nb SV : "+nbSV);
		console.log("nb role speciaux : "+rolesChoisis.length);
		console.log("nb joueur : "+nbPlayer);
		message.channel.send(datas[2]);
        // }else{
        //     message.channel.send('Vous ne pouvez pas ajouter de rôle supplémentaire');
        // }
    }
});


//Commande pour supprimer un rôle
bot.on('message', message => {
    if (message.content.startsWith('/delRole')) {
		var roleSupp = message.content.split(" ")[1];
        //On supprime un role uniquement s'il y en a à supprimer
        if(rolesChoisis.length+nbLoup+nbSV > 0){
            var datas = tool.supprimerRole(roleSupp, rolesDispo, rolesChoisis, nbSV);
            rolesDispo = datas[0] ;
			rolesChoisis = datas[1];
			nbSV = datas[3];
			console.log("nb loup : "+nbLoup);
			console.log("nb SV : "+nbSV);
			console.log("nb role speciaux : "+rolesChoisis.length);
			console.log("nb joueur : "+nbPlayer);
			message.channel.send(datas[2]);
        }else{
            message.channel.send('Vous ne pouvez pas supprimer plus de rôles');
        }
    }
});


//Commande pour afficher la liste des roles 
bot.on('message', message => {
    if (message.content === '/roleList') {
       message.channel.send(tool.toStringRoles(rolesChoisis,nbLoup,nbSV));
    }
});

bot.on('message', message => {
    if (message.content === '/roleDispo') {
       message.channel.send(tool.toStringRolesDispo(rolesDispo));
    }
});


// OK (list)
bot.on('message', message => {	
	if (message.content === '/list') {
		var fx= '';
		for (i=0 ; i<Players.length ; i++) {
			if (Players[i].estVivant) {
				fx = Players[i].nom + "  " +  fx;
			}
		}
		message.channel.send("Les joueurs vivants sont : **"+ fx+"**");
	} 
})


// OK : command help
bot.on('message', message => {	
	if (message.content === '/help') {
		message.channel.send('Liste des commandes :  \n **/loupStart **Débute la partie **(ALL)** \n** /loupStop** Termine la partie  **(ALL)** \n **/play** Vous ajoute à la partie **(ALL)** \n **/leave** Quitte la partie **(ALL)** \n **/vote** [PLAYER] votez un joueur que vous pensez être un loup **(ALL)** \n **/kill** [PLAYER] Envoyez un MP à LoupGarou-Bot pour tuez un joueur pendant la nuit **(loup-garou)** \n **/curse** [PLAYER] Envoyez un MP à LoupGarou-Bot pour tuez un joueur  **(sorcière)**  \n **/save** Envoyez un MP à LoupGarou-Bot pour sauver un joueur **(sorcière)** \n **/reveal** [PLAYER] Affiche le role du joueur **(Voyante)**') 
	   message.channel.send('**/roleDispo** Liste des roles disponibles **(ALL)** \n **/roleList** Liste les roles de la partie  **(ALL)**\n **/addRole** Ajoute un role à la partie **(ALL)**\n **/delRole** Supprime un role de la partie **(ALL)** \n **/link** [PLAYER1] [PLAYER2] Lie 2 joueurs **(Cupidon)**\n **/list** Affiche les joueurs vivants **(ALL)**');
	}
})


// TODO : quand toute sera fini, remettre tout les valeurs a zero
bot.on('message', message => {	
if (message.content === '/loupStop') {
message.channel.send("Fin de la partie...");
process.exit()
} 
});




// OK (/kill)
//Commande pour que les loups puissent voter l'élimination de quelqu'un
bot.on('message', message => {	
	if (message.content.startsWith('/kill')) {

		var indexLoup = tool.checkRole(message.author.username, "Loup", Players);
		
		//Si le joueur est un loup, en vie, et que les loups peuvent voter
		if(indexLoup != -1 && Players[indexLoup].estVivant == 1 && loupCanKill == 1){

			//Si le noctambule est chez le loup 
			if(Players[indexLoup].hasOwnProperty("noctambule") ){
				delete Players[indexLoup].noctambule;
				message.reply("Vous n'avez pas vos pouvoirs cette nuit !");
			}else{

				//Check que le joueur désigné existe 
				var joueurDesigne = message.content.split(" ")[1];
				var indexJoueurDesigne = tool.containsIndice(joueurDesigne, Players);
				if (indexJoueurDesigne == -1) {
					message.reply("Ce joueur n'existe pas !");
				//Check que le joueur désigné est en vie
				}else if(!Players[indexJoueurDesigne].estVivant){
					message.reply("Ce joueur est déjà mort !");
				}else if(joueurDesigne == Players[indexLoup].nom){
					message.reply("Vous n'avez pas le droit de vous designer");
				}else{
					//On vote pour le joueur désigné et on envoie un message aux autres loups
					voter(message.author.username, joueurDesigne);
					message.reply("Vous souhaitez tuer **"+joueurDesigne+"**");
					var nomLoup = message.author.username;
					
					var nomAutreLoup = '';
					
					for (i=0; i<Players.length; i++) {
						if(Players[i].role == 'Loup' && Players[i].nom != nomLoup) {
							nomAutreLoup = Players[i].nom;
							Players[i].idJoueur.send("**"+nomLoup +'** souhaite tuer **'+ joueurDesigne+"**");
						}
					}
				}
			}

			
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}
	}

});

//Commande pour la vengeance du chasseur
bot.on('message', message => {
	if (message.content.startsWith('/hunt')) {
		
		var indexChasseur = tool.checkRole(message.author.username, "Chasseur", Players);

		if(indexChasseur != -1 && phaseChasseur && chasseur.peuxTuer && !chasseur.estVivant) {
			var joueurDesigne = message.content.split(" ")[1];
			var indexJoueurDesigne = tool.containsIndice(joueurDesigne, Players);
			if (indexJoueurDesigne == -1) {
				message.reply("Ce joueur n'existe pas !");
			//Check que le joueur désigné est en vie
			}else if(!Players[indexJoueurDesigne].estVivant){
				message.reply("Ce joueur est déjà mort !");

			//Check que le joueur désigné n'est pas le chasseur
			}else if(joueurDesigne == Players[indexChasseur].nom){
				message.reply("Vous n'avez pas le droit de vous designer");
			}else{
				message.reply("Vous souhaitez tuer **"+joueurDesigne+"**");
				chasseur.aTue = Players[indexJoueurDesigne];
				chasseur.peuxTuer = false;
			}
		}
	}
});


//Commande pour que les habitants puissent voter l'élimination de quelqu'un
bot.on('message', message => {
    if (message.content.startsWith('/vote')) {
	   index = tool.containsIndice(message.author.username, Players);

	   if(Players[index].estVivant && phaseVillage){
			var joueurDesigne = message.content.split(" ")[1];
			var indexJoueurDesigne = tool.containsIndice(joueurDesigne, Players);
			if (indexJoueurDesigne == -1) {
				message.reply("Ce joueur n'existe pas !");

			//Check que le joueur désigné est en vie
			}else if(!Players[indexJoueurDesigne].estVivant){
				message.reply("Ce joueur est mort !");
			}else{
				voter(message.author.username, joueurDesigne);
				message.reply("Vous souhaitez eliminer **"+joueurDesigne+"**.");
				Players[indexJoueurDesigne].idJoueur.send("**"+message.author.username + "** souhaite vous éliminer.");
			}
	   }
    }
});


// OK : reveal the role of a player (voyante)
bot.on('message', message => {	
	if (message.content.startsWith('/reveal')) {
		
		if (tool.checkRole(message.author.username,voyante.role,Players) != -1 && voyante.estVivant == 1 && voyante.peuxVoir){
			var joueurAReveler = message.content.split(" ")[1];
			var index = tool.containsIndice(joueurAReveler, Players);

			if (index == -1) {
				message.reply("Ce joueur n'existe pas !");
			}else{
				
				if (voyante.dejaVu.includes(Players[index])) {
					message.reply("Vous connaissez déjà le rôle de ce joueur");
					
				//Check que le joueur désigné est en vie
				}else if(!Players[index].estVivant){
					message.reply("Ce joueur est mort !");
				}else{
					// var role = tool.reveal(joueurAReveler, Players);
					message.reply("**"+joueurAReveler + '** est : **'+Players[index].role+"**");
					voyante.dejaVu.push(Players[index]);
					voyante.peuxVoir = false;
				}
					
			}
		}else{
			message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
		}

	} 
});


//OK (Sorciere curse)
bot.on('message', message => {	
	if (message.content.startsWith('/curse')) {
		
		//Si la sorcière est vivante, qu'elle peut agir et tuer
		if(tool.checkRole(message.author.username, sorciere.role, Players) != -1 && sorciere.estVivant && sorciere.peuxAgir && sorciere.peuxTuer){

			var joueurMaudit = message.content.split(" ")[1]

			var index = tool.containsIndice(joueurMaudit, Players);
			if (index == -1) {
				message.reply("Ce joueur n'existe pas !");
			}else if(sorciere.nom == joueurMaudit){
				message.reply("Vous ne pouvez pas vous tuer !");
			//Check que le joueur désigné est en vie
			}else if(!Players[index].estVivant){
				message.reply("Ce joueur est mort !");
			}else{
				sorciere.aTue = Players[index];
				sorciere.peuxTuer = false;
				message.reply("Vous venez de tuer **"+ joueurMaudit+"**");
			}
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}		
	} 
});

// OK (Sorcière save)
bot.on('message', message => {	
	if (message.content === '/save') {

		if(tool.checkRole(message.author.username, sorciere.role, Players) != -1 && sorciere.estVivant && sorciere.peuxAgir && sorciere.peuxSauver){
			
			joueurATuer.estSauve = true;
			sorciere.peuxSauver = false;	
			message.reply("Vous venez de sauver **"+ joueurATuer.nom+"**");
			
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}

	}
});

bot.on('message', message => {	
	if (message.content.startsWith('/link')) {

		if(tool.checkRole(message.author.username, cupidon.role, Players) != -1 && cupidon.estVivant && cupidon.peuxLier){

			var joueur1 = message.content.split(" ")[1];
			var joueur2 = message.content.split(" ")[2];
			var index1 = tool.containsIndice(joueur1, Players);
			var index2 = tool.containsIndice(joueur2, Players);

			if (index1 == -1 || index2 == -1) {
				message.reply("Un des joueurs n'existe pas !");
			}
			else {
				Players[index1].linked = true;
				Players[index2].linked = true;
				cupidon.peuxLier = false;	
				message.reply("Vous venez de lier **"+joueur1+"** et **"+joueur2+"**.");
			}
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}

	}
});

//Commande pour le noctambule
bot.on('message', message => {	
	if (message.content.startsWith('/sleep')) {

		if(tool.checkRole(message.author.username, noctambule.role, Players) != -1 && noctambule.estVivant && noctambule.peuxDormir){

			var joueurDesigne = message.content.split(" ")[1];
			var indexJoueurDesigne = tool.containsIndice(joueurDesigne, Players);

			if (indexJoueurDesigne == -1) {
				message.reply("Ce joueur n'existe pas !");
			}else if(noctambule.dejaDormi.includes(Players[indexJoueurDesigne])){
				message.reply("Vous avez déjà dormi chez ce joueur");
			}
			else {
				noctambule.peuxDormir = false;
				noctambule.dejaDormi.push(Players[indexJoueurDesigne]);
				Players[indexJoueurDesigne].idJoueur.send("**"+noctambule.nom+"** est venu dormir chez vous cette nuit chez vous. Vous êtes privé de vos pouvoirs cette nuit");
				Players[indexJoueurDesigne].noctambule = true;
			}
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}

	}
});



//----------------------CLASSE ET FONCTIONS--------------------//


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


function generateIDs(n,nbLoup,tabJoueurs,tabRolesChoisis){
    var ids = [];
    for(i = 0; i<n;i++){
        ids.push(i);
    }

    ids = tool.knuthfisheryates(ids);

    var index, cartesDispo = n - nbLoup;
    for(index = 0;index<nbLoup;index++){
        tabJoueurs[ids[index]].setRole("Loup");
    }

 
    for(index = 0;index<cartesDispo;index++){
        if(index >=tabRolesChoisis.length){
            tabJoueurs[ids[index+nbLoup]].setRole("Villageois");
        }else{
            tabJoueurs[ids[index+nbLoup]].setRole(tabRolesChoisis[index]) ;
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


//fonction pour tuer en général (Loup, village, chasseur..)
// function kill(nomJoueur, tabJoueurs){
// 	index = tools.containsIndice(nomJoueur, tabJoueurs);
// 	//Verifier index ?

// 	if(tabJoueurs[index].estVivant){
// 		//On tue le joueur
// 		tabJoueurs[i].estVivant = false;

// 		//On regarde si le joueur mort est lié à quelqu'un d'autre
		// if(tabJoueurs[i].hasAttribute(linked)){
		// 	for(joueur in tabJoueurs){
		// 		if(joueur.hasAttribute(linked) && joueur.nom != nomJoueur){
		// 			joueur.estVivant = false;
		// 			return joueur.nom;
		// 		}
		// 	}
		// }
// 	}else{
// 		//Message d'erreur : joueur déjà mort
// 	}
// 	return -1;
// }

function kill(joueur, tabJoueurs){

	if(joueur.estVivant){
		joueur.estVivant = false;
	}

	if(joueur.hasOwnProperty('linked')){
		for(i=0; i<tabJoueurs.length; i++){
			if(tabJoueurs[i].hasOwnProperty('linked') && joueur.nom != tabJoueurs[i].nom){
				tabJoueurs[i].estVivant = false;
				return tabJoueurs[i];
			}
		}
	}
	return -1;
}

//Check si un amoureux a été tué
function checkAmoureux(message, joueur){
	if(joueur != -1){
		message.channel.send("**"+joueurATuer.nom+"** était, de plus, follement amoureux de **"+joueur.nom + "** !\nCe dernier meurt malheureusement avec lui/elle, il/elle était **"+joueur.role+"**");
		return 1;
	}
	return 0;
}

function getJoueurRole(role, tabJoueurs){
	var index = tool.existeRole(role, tabJoueurs);
	if(index !=-1){
		return tabJoueurs[index];
	}
	return index;
}

async function deliberationNuit(message, joueurATuer){
	var cptMort = 0;
	//Si les loups ont voté
	if (max != 0) {
		//Qu'il n'y a pas d'égalité
		if (joueurATuer != 0) {
			var retourKill = -1;
			if(joueurATuer.hasOwnProperty('estSauve') && joueurATuer.estSauve){
				joueurATuer.estSauve = false;
			}else{
				retourKill = kill(joueurATuer,Players);
				message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.role+"**");
				cptMort++
				//Cas Amoureux
				await checkAmoureux(message,retourKill);
			}

		}
			
	}

	//Check si la sorcière a tué quelqu'un
	if(sorciere !=-1 && sorciere.hasOwnProperty('aTue') && sorciere.aTue != null && sorciere.aTue != joueurATuer){
		
		if(cptMort != 2 || !sorciere.aTue.hasOwnProperty('linked')){
			
			joueurATuer = sorciere.aTue;
			var retourKill = kill(sorciere.aTue, Players);
			message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.role+"**");
			cptMort++;

			//Cas Amoureux
			await checkAmoureux(message,retourKill);

		}
		
		sorciere.aTue = null;
	}

	//Check le compteur de mort et les votes pour afficher la phrase correspondante
	if(cptMort == 0 && max == 0){
		message.channel.send("Personne n'est mort cette nuit..");
	}else if(cptMort == 0 && joueurATuer == 0){
		message.channel.send("Les loups n'ont pas réussi a se départager! *Personne ne meurs*...");
	}
	else if(cptMort == 0){
		message.channel.send("Personne n'est mort cette nuit..");
	}

	var datasVotes = tool.resetVotes(votes,aVote);
	votes = datasVotes[0];
	aVote = datasVotes[1];
		
	chasseur_time(message, "nuit");
	
}


async function deliberationJour(message){
	
	max = tool.resultatVote(votes);

	if (max != 0)  {
		index = tool.checkEgalite(max, votes);
		if (index != -1) {
			joueurATuer = Players[index];
			
			var retourKill = kill(joueurATuer,Players);
			message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.role+"**");
			
			//Cas Amoureux
			await checkAmoureux(message,retourKill);

		}else{
			message.channel.send("Les habitants n'ont pas réussi à se décider");
		}
	}else{
		message.channel.send("Les habitants n'ont voté pour personne");
	}
	
	var datasVotes = tool.resetVotes(votes,aVote);
	votes = datasVotes[0];
	aVote = datasVotes[1];

	chasseur_time(message, "jour");
	
}



function game_start(message) {

	cpt++;
	message.channel.send('DEBUT NUIT : '+ cpt);
	message.channel.send('-------------------------------------------------------------------\n\n');
	cupidon_time(message);
}

async function terminerJeu(message){
	var dataCheckFin = tool.checkFinJeu(Players);
	var jeuEstFini = dataCheckFin[0];
	var retourCheckFin = dataCheckFin[1];

	if(jeuEstFini){
		switch(retourCheckFin){
			case 0 : 
				await message.channel.send("La partie est terminée ! Les villageois ont gagnés !");
				break;
			case 1 :
				await message.channel.send("La partie est terminée ! Les loups ont gagné !");
				break;
			case 2 :
				await message.channel.send("La partie est terminée ! Personne n'a gagné !");
		}
		process.exit();
	}
}


//----------------------JEU PRINCIPAL--------------------//

function cupidon_time(message){
	if(cupidon != -1 && cupidon.estVivant && cupidon.peuxLier){
		
		var timer = new time.Timer();

		message.channel.send("\nCupidon à **30** secondes pour sélectionner 2 joueurs dont le destin sera lié pour le reste de la partie !");
		cupidon.idJoueur.send("Vous avez **30** secondes pour désigner 2 joueurs à lier (/link [nom1] [nom2]) !");

		timer.start({countdown: true, startValues: {seconds: 30}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
		});

		timer.addEventListener('targetAchieved', function (e) {
			cupidon.peuxLier = false;
			noctambule_time(message);
		});

	}else{
		noctambule_time(message);
	}
}


function loupandvoyante_time(message) {
	joueurATuer = 0;

	message.channel.send('\nLes loups ont **30s** pour choisir leur victime...');
	message.channel.send("/list");
	loupCanKill = 1;

	//Check si la voyante existe et si elle est en vie

	if(voyante != -1 && voyante.estVivant){

		//Si le noctambule dors chez la voyante
		if(voyante.hasOwnProperty("noctambule") ){
			delete voyante.noctambule;
			voyante.idJoueur.send("Vous n'avez pas vos pouvoirs cette nuit !");
		}else{
			message.channel.send('\nLa voyante a **30s** pour reveler une personne...');
			voyante.idJoueur.send("/list");
			//Liste des joueurs déjà vu
			voyante.idJoueur.send(tool.roleDejaVu(voyante));
			voyante.idJoueur.send("Vous avez **30s** pour révéler le rôle d'une personne !");
			voyante.peuxVoir = true;
		}
	}
	
	
	
	var timer = new time.Timer();
	
	var datasVotes = tool.resetVotes(votes,aVote);
	votes = datasVotes[0];
	aVote = datasVotes[1];
	
	timer.start({countdown: true, startValues: {seconds: 30}});
	timer.addEventListener('secondsUpdated', function (e) {
		if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
			message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
		};
	});

	timer.addEventListener('targetAchieved', function (e) {
		message.channel.send("**Fin du temps !\n**");
		loupCanKill = 0;
		
		voyante.peuxVoir = false;

		max = tool.resultatVote(votes);

		if (max != 0)  {
			index = tool.checkEgalite(max, votes);
			if (index != -1) {
				joueurATuer = Players[index];
			}
		}
			
		sorciere_time(message,joueurATuer);
	})

	
}


function sorciere_time(message, joueurATuer) {
	
	//Check si la sorcière existe et si elle est en vie
	if(sorciere !=-1 && sorciere.estVivant){

		//Si le noctambule dors chez la sorcière
		if(sorciere.hasOwnProperty("noctambule") ){
			delete sorciere.noctambule;
			sorciere.idJoueur.send("Vous n'avez pas vos pouvoirs cette nuit !");
			deliberationNuit(message,joueurATuer);
			
		}else{

			sorciere.peuxAgir = true;
			var timer = new time.Timer();
			var tempsTimer = 30;

			if(!sorciere.peuxSauver && !sorciere.peuxTuer){
				tempsTimer = 5;
			}
			
			//Envoie un message en fonction du vote des loups
			if ( (max == 0 || joueurATuer == 0) && sorciere.peuxTuer) {
				sorciere.idJoueur.send("Personne n'a été tué. Vous pouvez utilisez votre potion de mort (/curse [nom]) ou ne rien faire");
			}
			else if(max !=0 && joueurATuer != 0 && sorciere.peuxSauver) {	
				sorciere.idJoueur.send("**"+joueurATuer.nom +"** a été tué par les loups, Vous pouvez utilisez votre potion de mort (/curse [nom]) sur quelqu'un ou sauver **"+joueurATuer.nom + "** (/save)");
			
			}else if(sorciere.peuxTuer){
				sorciere.idJoueur.send("Vous pouvez utilisez votre potion de mort (/curse [nom]) ou ne rien faire");
			}

			message.channel.send("\nLa Sorcière à **30** secondes pour utiliser ses pouvoirs !");
			//Debut du timer
			timer.start({countdown: true, startValues: {seconds: tempsTimer}});
			timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
			});


			//A la fin du timer, on annonce les résultats concernant les actions de la nuit
			//Vote des loups, sorcière, etc..
			timer.addEventListener('targetAchieved', function (e) {
				

				message.channel.send("Fin du temps !\n");
				sorciere.peuxAgir = false;
				
				deliberationNuit(message,joueurATuer);
				
			});
		}

	}else{
		deliberationNuit(message,joueurATuer);
	}
	
}

//fonction village
function village_time(message){
	phaseVillage = true;
	
	var timer = new time.Timer();

	message.channel.send("\nLe village à **30** secondes pour décider de la personne à éliminer !");
	message.channel.send("/list");

	timer.start({countdown: true, startValues: {seconds: 30}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
		});

		timer.addEventListener('targetAchieved', function (e) {
			phaseVillage = false;
			deliberationJour(message);
		});
}



//fonction chasseur
async function chasseur_time(message, temps){
	
	if(!chasseur.estVivant && chasseur.peuxTuer){
		phaseChasseur = true;
		var timer = new time.Timer();

		message.channel.send("\nLe Chasseur à **30** secondes pour se venger !");
		chasseur.idJoueur.send("Vous avez **30** secondes pour désigner quelqu'un à tuer (/kill [nom]) !");
		chasseur.idJoueur.send("/list");

		timer.start({countdown: true, startValues: {seconds: 30}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
		});

			timer.addEventListener('targetAchieved', async function (e) {
				chasseur.peuxTuer = false;
				
				if(chasseur.hasOwnProperty('aTue')){
					joueurATuer = chasseur.aTue;

					var retourKill = kill(chasseur.aTue, Players);
					message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.role+"**");
					
					//Cas Amoureux
					await CheckAmoureux(message,retourKill);
				}

				await terminerJeu(message);

				if(temps == "jour"){
					game_start(message);
				}else{
					village_time(message);
				}

			});
	}else{

		await terminerJeu(message);
		
		if(temps == "jour"){
			game_start(message);
		}else{
			village_time(message);
		}

	}

}

function noctambule_time(message){
	if(noctambule !=-1 && noctambule.estVivant){
		noctambule.peuxDormir = true;
		var timer = new time.Timer();

		message.channel.send("\nLe noctambule à **30** secondes pour décider chez qui il va aller dormir! Cette personne sera privée de ses pouvoirs pour la nuit");
		noctambule.idJoueur.send("Vous avez **30** secondes pour choisir chez qui aller dormir (/sleep [nom]) !");

		timer.start({countdown: true, startValues: {seconds: 30}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
		});

		timer.addEventListener('targetAchieved', function (e) {
			noctambule.peuxDormir = false;
			loupandvoyante_time(message);
		});
	}else{
		loupandvoyante_time(message);
	}
}


