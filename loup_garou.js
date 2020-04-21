const Discord = require('discord.js');
const time = require('easytimer.js');
const tool = require('./tool') ;
const {Player, Villageois, LoupGarou, Chasseur, Voyante, Cupidon, Sorciere, Salvateur, Noctambule, LoupGarouBlanc, AngDechu, ChienLoup, EnfantSauvage} = require('./joueur.js');
const bot = new Discord.Client();
const dictionnaire = new Map([["Voyante", Voyante],["Villageois", Villageois],["Loup-Garou",LoupGarou],["Chasseur", Chasseur], ["Cupidon",Cupidon], ["Sorciere",Sorciere], ["Salvateur",Salvateur],
				["Noctambule", Noctambule], ["Loup_garou_blanc",LoupGarouBlanc], ["Ange_dechu", AngDechu],["Chien-loup",ChienLoup], ["Enfant-sauvage",EnfantSauvage] ]);

require('events').EventEmitter.defaultMaxListeners = 12;

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
var rolesDispo = ["Sorciere","Voyante","Cupidon","Chasseur", "Noctambule", "Ange_dechu", "Chien-loup", "Salvateur", "Loup_garou_blanc", "Enfant-sauvage"];
var rolesChoisis = [];
var strRolesChoisis;
var votes = []  //tableau pour le nombre de vote sur chaque joueur
var aVote = []  //tableau pour savoir qui a voté pour qui pour le tour actuel
var PM=  [] // tableau pour sauvegarder les object "message" de l'API Discord afin de pouvoir MP les loups
var phaseVillage = false;
var joueurATuer;  //Variable utilisée pour connaitre le joueur à tuer
var max,index;
var cpt=0;
var sorciere, voyante, cupidon, chasseur, noctambule, angeDechu, chienLoup, salvateur, lgb, enfantSauvage; //Variable pour stocker les rôles spéciaux
var amoureux = [];
var messagesVotes = [];
var ordrePremiereNuit = ["Chien-loup","Cupidon","Enfant-sauvage","Noctambule","Salvateur","Voyante","Loup-Garou","Loup_garou_blanc","Sorciere"];
var ordreNuit = ["Noctambule","Salvateur","Voyante","Loup-Garou","Loup_garou_blanc","Sorciere"];
var cptOrdre = 0;



//END OF VAR GLOBAL SECTION

// START OF EVENT FUNCTION

//----------------------BOT LISTENERS--------------------//

//Démarre la partie
bot.on('message', async message => {

    if (message.content === '/loupStart') {
        if (nbPlayer < 1) {
            message.channel.send('Pas assez de joueur pour lancez ! (Min : 5)')
        }else if (nbPlayer != rolesChoisis.length+nbLoup+nbSV){
            message.channel.send('Pas assez de rôles pour le nombre de joueur');
        }else {
            if(hasStarted === 0) {
                hasStarted = 1;
				nbPlayer = Players.length;
				strRolesChoisis = tool.toStringRoles(rolesChoisis,nbLoup,nbSV);

                // nbLoup = Math.floor(nbPlayer/4) +1;
                // nbLoup = 2 // a changer, FOR DEBUG ONLY
                message.channel.send("Nombre de Loup-Garou : " + nbLoup);
				
				
				
				Players = generateIDs(nbPlayer,nbLoup, Players, rolesChoisis);
               
				//initialisation des votes
				await tool.initVotes(nbPlayer,votes,aVote);
				

				// Récupération des rôles spéciaux et ajout de certaines variables
				sorciere = getJoueurRole("Sorciere", Players);

				voyante = getJoueurRole("Voyante", Players);
				
				cupidon = getJoueurRole("Cupidon", Players);
				if(cupidon !=-1){
					cupidon.amoureux = amoureux;
				}

				chasseur = getJoueurRole("Chasseur", Players);

				noctambule = getJoueurRole("Noctambule", Players);

				angeDechu = getJoueurRole("Ange_dechu", Players);

				chienLoup = getJoueurRole("Chien-loup", Players);
				if(chienLoup != -1){
					chienLoup.votes = votes;
					chienLoup.aVote = aVote;
				}

				salvateur = getJoueurRole("Salvateur", Players);

				lgb = getJoueurRole("Loup_garou_blanc", Players);
				if(lgb != -1){
					lgb.tabJoueurs = Players;
					lgb.votes = votes;
					lgb.aVote = aVote;
				}

				enfantSauvage = getJoueurRole("Enfant-sauvage", Players);
				
				console.log("Début de partie");

                await tool.annonceRole(Players);
				await tool.annonceDesLoups(Players);
				await message.channel.send('**Début de la partie...**');

                game_start(message);       
            }
            else {
                message.channel.send('La partie a déja débuté, commande : **/loupStop** pour terminer la partie');
            }
        }
    
    }
});

//Commande pour rejoindre la partie
bot.on('message', async message => {	
	var nomJoueur = message.author.username;
	var idJoueur = message.author;
	if (message.content === '/play') {
		
		if(hasStarted == 0) {
				if(!tool.contains(nomJoueur, Players)){
					
					Players.push(new Player(nomJoueur,idJoueur));
					PM.push(message);
					await nbPlayer++;
					message.channel.send("Ajout de **" + nomJoueur + "** à la partie");
					message.channel.send("Nombre de joueurs actuels : " + nbPlayer);
					//maj 
					nbLoup = Math.floor(nbPlayer/5) +1;
					
					nbSV = nbPlayer-nbLoup-rolesChoisis.length;

					if(nbSV<0){
						nbSV=0;
					}

				}
				else{
					message.channel.send("Joueur déjà présent  !");
				}	
		}
		else {
			message.channel.send("La partie à déja commencé, tu ne peux rejoindre ! ");
		}		
	}
		
});


//Commande pour quitter la partie
bot.on('message', message => {    
    if (message.content === '/leave') {
		
		if(hasStarted == 0) {
			var joueur = message.author.username;
			var retour = tool.retirerJoueur(joueur,Players);
			if(retour){
				nbPlayer--;

				nbLoup = Math.floor(nbPlayer/5) +1;
				nbSV= nbPlayer-nbLoup-rolesChoisis.length;

				message.channel.send("**"+joueur + "** à quitté la partie !");
			}else{
				message.channel.send("Ce joueur n'est pas présent dans la partie"); 
			}
		}else{
			message.channel.send("Vous ne pouvez quitter une partie en cours ! ");
		}
    }
})


//Commande pour ajouter un rôle dans la liste des rôles choisis
//Remplace un Villageois s'il y en a au moins 1
bot.on('message', message => {
    if (message.content.startsWith('/add')) {
		var roleAjout = message.content.split(" ")[1];
        //On ajoute un role uniquement s'il y en a moins que le nombre de joueurs
        // if(rolesChoisis.length < Players.length-nbLoup-nbSV){ 
		var datas = tool.ajouterRole(roleAjout, rolesDispo, rolesChoisis, nbSV);
		rolesDispo = datas[0] ;
		rolesChoisis = datas[1];
		nbSV = datas[3];
		message.channel.send(datas[2]);
        // }else{
        //     message.channel.send('Vous ne pouvez pas ajouter de rôle supplémentaire');
        // }
    }
});


//Commande pour supprimer un rôle de la liste des rôles choisis
//Supprimer un rôle spécial ajoute un villageois
//On peut supprimer des Villageois mais pas de Loup-Garou pour le moment
bot.on('message', message => {
    if (message.content.startsWith('/del')) {
		var roleSupp = message.content.split(" ")[1];
        //On supprime un role uniquement s'il y en a à supprimer
        if(rolesChoisis.length+nbLoup+nbSV > 0){
            var datas = tool.supprimerRole(roleSupp, rolesDispo, rolesChoisis, nbSV);
            rolesDispo = datas[0] ;
			rolesChoisis = datas[1];
			nbSV = datas[3];
			message.channel.send(datas[2]);
        }else{
            message.channel.send('Vous ne pouvez pas supprimer plus de rôles');
        }
    }
});


//Commande pour afficher la liste des roles choisis pour la partie en cours
bot.on('message', async message => {
    if (message.content === '/roleList') {

		if(cpt == 0){
			strRolesChoisis = tool.toStringRoles(rolesChoisis,nbLoup,nbSV);
		}
		message.channel.send(strRolesChoisis);
		
    }
});

//Commande pour afficher la liste des roles disponibles pour la partie en cours
bot.on('message', message => {
    if (message.content === '/roleDispo') {
       message.channel.send(tool.toStringRolesDispo(rolesDispo));
    }
});


//Liste des joueurs en vie
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


//Commande affichant la liste des autres commandes et leurs descriptions
bot.on('message', message => {	
	if (message.content === '/help') {
		message.channel.send('Liste des commandes :  \n **/loupStart **Débute la partie **(ALL)** \n** /loupStop** Termine la partie  **(ALL)** \n **/play** Vous ajoute à la partie **(ALL)** \n **/leave** Quitte la partie **(ALL)** \n **/roleDispo** Liste des roles disponibles **(ALL)** \n **/roleList** Liste les roles de la partie  **(ALL)**\n **/add** Ajoute un role à la partie **(ALL)**\n **/del** Supprime un role de la partie **(ALL)** \n **/list** Affiche les joueurs vivants **(ALL)**\n');
		message.channel.send("**/vote** [PLAYER] Votez un joueur que vous pensez être un loup **(ALL)** \n **/action** [PARAMETRE] Execute la commande associé à votre rôle et au déroulement du jeu (ex : tour de la voyante, **/action [nom]** permet de révéler un joueur) **(ALL)**\n");
	}
})


//Arrête le processus du bot 
//A ne pas utiliser en pleine partie
bot.on('message', message => {	
	if (message.content === '/loupStop') {
		message.channel.send("Fin de la partie...");
		process.exit()
	}	 	
});


//Commande pour que les habitants puissent voter l'élimination de quelqu'un
bot.on('message', message => {
    if (message.content.startsWith('/vote')) {
	   
		index = tool.containsIndice(message.author.username, Players);

		if(hasStarted == 1 && index !=-1 && Players[index].estVivant && phaseVillage){
		
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
			
		}else{
			message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
		}
		
    }
});


//Commande contextuelle utilisable par tous les rôles
//N'a d'effet sur un personnage que lorsque c'est son tour
bot.on('message', message => {	
	if (message.content.startsWith('/action')) {

		var indexJoueur = tool.containsIndice(message.author.username, Players);

		if(indexJoueur != -1){
			var data = message.content.split(" ");
			var params = [];
			for(i=1;i<data.length;i++){
				params.push(data[i]);
			}
			params.push(Players);
			Players[indexJoueur].action(message,params);
		}	
	}
			
});

//----------------------CLASSE ET FONCTIONS--------------------//



//Attribue un rôle a chaque joueur aléatoirement en fonction des rôles choisis
function generateIDs(n,nbLoup,tabJoueurs,tabRolesChoisis){
	var ids = [];
	var nomJoueur, idJoueur;
    for(i = 0; i<n;i++){
        ids.push(i);
	}


    ids = tool.knuthfisheryates(ids);

    var index, cartesDispo = n - nbLoup;
    for(index = 0;index<nbLoup;index++){
		nomJoueur = tabJoueurs[ids[index]].nom;
		idJoueur = tabJoueurs[ids[index]].idJoueur;
        tabJoueurs[ids[index]] = new (dictionnaire.get("Loup-Garou"))(nomJoueur,idJoueur,votes,aVote);
	}
	
	

 
    for(index = 0;index<cartesDispo;index++){

		

		nomJoueur = tabJoueurs[ids[index+nbLoup]].nom;
		idJoueur = tabJoueurs[ids[index+nbLoup]].idJoueur;
		
        if(index >=tabRolesChoisis.length){
			
            tabJoueurs[ids[index+nbLoup]] = new (dictionnaire.get("Villageois"))(nomJoueur,idJoueur) ;
        }else{
            tabJoueurs[ids[index+nbLoup]] = new (dictionnaire.get(rolesChoisis[index]))(nomJoueur,idJoueur) ;
		}  
	}
	return tabJoueurs;
}


//Permet de voter
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

	//On édite les messages de la liste des votes
	if(messagesVotes.length != 0){
		messagesVotes[votant].edit("**"+Players[votant].nom+"** : "+votes[votant]+".\t\t\t\t**"+Players[votant].nom+"** --> "+ ((aVote[votant] !=-1) ? "**"+Players[aVote[votant]].nom+"**" : "**rien**") );
		messagesVotes[vote].edit("**"+Players[vote].nom+"** : "+votes[vote]+".\t\t\t\t**"+Players[vote].nom+"** --> "+ ((aVote[vote] !=-1)? "**"+Players[aVote[vote]].nom+"**" : "**rien**") );	
	}
	
}


//Permet de tuer un joueur/les amoureux
function kill(joueur){

	if(joueur.estVivant){
		joueur.estVivant = false;
	}

	if(amoureux.includes(joueur)){
		for(i=0; i<amoureux.length; i++){
			if(amoureux[i].nom != joueur.nom){
				amoureux[i].estVivant = false;
				return amoureux[i]; 
			}
		}
	}
	return -1;
}

//Check si un amoureux a été tué
//Renvoie 1 si c'est le cas, 0 sinon
function checkAmoureux(message, joueur){
	if(joueur != -1){
		message.channel.send("**"+joueurATuer.nom+"** était, de plus, follement amoureux de **"+joueur.nom + "** !\nCe.tte dernier.e meurt malheureusement avec lui/elle, il/elle était **"+joueur.getRole()+"**");
		return 1;
	}
	return 0;
}


//Récupère un joueur à partir de son rôle
//ou retourn -1 si le rôle n'existe pas dans la partie 
function getJoueurRole(role, tabJoueurs){
	var index = tool.existeRole(role, tabJoueurs);
	return (index != -1) ? tabJoueurs[index] : index;
}


//Tue ou non le(s) joueur(s) désigné(s) durant la nuit par les loups/loup blanc/sorcière
async function deliberationNuit(message, joueurATuer){
	var cptMort = 0;
	//Si les loups ont voté
	
	// console.log(joueurATuer);

	if (max != 0) {
		//Qu'il n'y a pas d'égalité
		if (joueurATuer != null) {
			var retourKill = -1;
			if(joueurATuer.hasOwnProperty('estSauve')){
				delete joueurATuer.estSauve;
			}else{
				retourKill = kill(joueurATuer);
				message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.getRole()+"**");
				cptMort++;
				//Cas Amoureux
				cptMort += await checkAmoureux(message,retourKill);
			}

		}
			
	}


	//Check si le loup blanc a tué un loup
	if(lgb != -1 && lgb.estVivant && lgb.aTueLoup != null && lgb.aTueLoup.estVivant){
		
		//Si le loup designé n'est pas protégé
		if(lgb.aTueLoup.hasOwnProperty('estSauve')){
			delete lgb.aTueLoup.estSauve;
		}else{
			//On tue le loup désigné
			retourKill = kill(lgb.aTueLoup);
			cptMort++
			
			message.channel.send("**"+lgb.aTueLoup.nom+"** a été éliminé.e!\nIl/Elle etait **"+lgb.aTueLoup.getRole()+"**");
			cptMort += await checkAmoureux(message,retourKill);
		}
	}

	//Check si la sorcière a tué quelqu'un
	if(sorciere !=-1 && sorciere.hasOwnProperty('aTue') && sorciere.aTue != null && sorciere.aTue.estVivant){
		
		joueurATuer = sorciere.aTue;
		var retourKill = kill(sorciere.aTue);
		message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.getRole()+"**");
		cptMort++;

		//Cas Amoureux
		cptMort += await checkAmoureux(message,retourKill);
	}


	//Check le compteur de mort et les votes pour afficher la phrase correspondante
	if(cptMort == 0){
		message.channel.send("Personne n'est mort cette nuit..");
	}

	//Enleve la propriété noctambule des joueurs
	if(noctambule != -1 && noctambule.estVivant){
		noctambule.resetNoctambule();
	}

	//Enleve la propriété estSauve des joueurs
	if(salvateur != -1 && salvateur.estVivant){
		salvateur.resetSalvateur()
	}

	//Check si le modèle de l'enfant sauvage a été tué
	if(enfantSauvage !=-1){
		enfantSauvage.checkModele(Players);
	}

	tool.resetVotes(votes,aVote);

	chasseur_time(message, "nuit");
	
}


//Tue ou non le(s) joueur(s) désigné(s) durant la journée par les villageois
async function deliberationJour(message){
	
	max = tool.resultatVote(votes);

	if (max != 0)  {
		index = tool.checkEgalite(max, votes);
		if (index != -1) {
			
			joueurATuer = Players[index];

			var retourKill = kill(joueurATuer);
			
			message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.getRole()+"**");
			
			//Cas Amoureux
			await checkAmoureux(message,retourKill);

		}else{
			message.channel.send("Les habitants n'ont pas réussi à se décider");
		}
	}else{
		message.channel.send("Les habitants n'ont voté pour personne");
	}


	// Check l'ange dechu
	if(angeDechu !=-1 && cpt == 1){
		angeDechu.checkVictoire(joueurATuer);
	}
	
	//Check si le modèle de l'enfant sauvage a été tué
	if(enfantSauvage !=-1){
		enfantSauvage.checkModele(Players);
	}

 	tool.resetVotes(votes,aVote);

	chasseur_time(message, "jour");
}


function game_start(message) {
	cpt++;
	message.channel.send('DEBUT NUIT : '+ cpt);
	// chienLoup_time(message);


	var arrayOrdre = [];
	if(cpt == 1){
		arrayOrdre = ordrePremiereNuit;
	}else{
		arrayOrdre = ordreNuit;
	}

	var joueur = getJoueurRole(arrayOrdre[cptOrdre],Players);
	joueur_time(message, joueur, arrayOrdre);
}

async function terminerJeu(message){
	var dataCheckFin = tool.checkFinJeu(Players,angeDechu,lgb);
	var jeuEstFini = dataCheckFin[0];
	var retourCheckFin = dataCheckFin[1];

	if(jeuEstFini){
		switch(retourCheckFin){
			case 0 : 
				await message.channel.send("La partie est terminée ! Les villageois ont gagnés !");
				break;
			case 1 :
				await message.channel.send("La partie est terminée ! Les loups-garou ont gagné !");
				break;
			case 2 :
				await message.channel.send("La partie est terminée ! Personne n'a gagné !");
				break;
			case 3 :
				await message.channel.send("La partie est terminée ! L'ange déchu a gagné !");
				break;
			case 4 :
				await message.channel.send("La partie est terminée ! Le couple traitre : **"+amoureux[0].nom+"** et **"+amoureux[1].nom+"**; a gagné !"); 
			case 5 : 
				await message.channel.send("La partie est terminée ! le Loup-Garou Blanc a gagné!"); 
		}
		await message.channel.send("\n\n\n-----JOUEURS DE LA PARTIE-----\n");
		
		for(i = 0;i<Players.length;i++){
			await message.channel.send("**"+Players[i]+ ((Players[i].hasOwnProperty('linked') ? " (Amoureux)" : "")) +"**\n");
		}
		process.exit();
	}
}


//-------------------------------------------------------//
//|						JEU PRINCIPAL					|//
//|														|//
//-------------------------------------------------------//


async function joueur_time(message, joueur, arrayOrdre){
	
	if(joueur !=-1 && joueur.estVivant){
	
		switch(joueur.getRole()){
			case "Loup_garou_blanc":
				if(cpt%2 == 0){
					joueur_time_action(message, joueur, arrayOrdre);
				}else{
					cptOrdre++;
					cptOrdre %= arrayOrdre.length;
					
					joueur = await getJoueurRole(arrayOrdre[cptOrdre],Players);
					joueur_time(message, joueur, arrayOrdre);
				}
				break;
			default : 
					joueur_time_action(message, joueur, arrayOrdre);
		}

	}else{

		cptOrdre++;
		cptOrdre %= arrayOrdre.length;

		
		if(cptOrdre == 0){
			deliberationNuit(message, joueurATuer);
		}else{
			if(arrayOrdre[cptOrdre] == "Loup-Garou"){
				loup_time(message, arrayOrdre);
			}else{
				joueur = await getJoueurRole(arrayOrdre[cptOrdre],Players);
				joueur_time(message, joueur, arrayOrdre);
			}
				
		}
	}
		
}


async function joueur_time_action(message,joueur, arrayOrdre){
	
	await message.channel.send(joueur.messageChannel());
	await joueur.idJoueur.send(joueur.messageJoueur());
	
	if(!joueur.hasOwnProperty("noctambule")){
		joueur.peuxAgir = true;
	}

	var tempsChrono = joueur.tempsDeJeu;
	var timer = new time.Timer();

	
	timer.start({countdown: true, startValues: {seconds: tempsChrono}});
	timer.addEventListener('secondsUpdated', function (e) {
		if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
			message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
		};
	});

	
	timer.addEventListener('targetAchieved', async function (e) {

		message.channel.send("**Fin du temps !\n**");

		joueur.peuxAgir = false;

		cptOrdre++;
		cptOrdre %= arrayOrdre.length;


		if(cptOrdre == 0){
			deliberationNuit(message, joueurATuer);
		}else{
			if(arrayOrdre[cptOrdre] == "Loup-Garou"){
				loup_time(message, arrayOrdre);
			}else{
				joueur = await getJoueurRole(arrayOrdre[cptOrdre],Players);
				joueur_time(message, joueur, arrayOrdre);
			}
		}
		
	});
	
}




async function loup_time(message, arrayOrdre) {
	
	console.log("LOUP TIME");
	joueurATuer = null;

	tool.resetVotes(votes,aVote);

	var loups=[];

	for(i=0;i<Players.length;i++){
		if(Players[i].role == "Loup-Garou" && Players[i].estVivant){
			Players[i].peuxManger = true;
			Players[i].idJoueur.send(Players[i].messageJoueur());
			loups.push(Players[i]);
		}
	}

	await message.channel.send(loups[0].messageChannel());
	await message.channel.send("/list");
	
	var tempsChrono = loups[0].tempsDeJeu;

	var timer = new time.Timer();

	
	timer.start({countdown: true, startValues: {seconds: tempsChrono}});
	timer.addEventListener('secondsUpdated', function (e) {
		if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
			message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
		};
	});

	timer.addEventListener('targetAchieved', async function (e) {
		message.channel.send("**Fin du temps !\n**");
		
		for(var loup of loups){
			loup.peuxManger = false;
		}

		max = tool.resultatVote(votes);
		
		// console.log(max);

		if (max != 0)  {
			index = tool.checkEgalite(max, votes);
			if (index != -1) {
				joueurATuer = Players[index];
				sorciere.joueurATuer = joueurATuer;
			}
		}

		// console.log(joueurATuer);


		cptOrdre++;
		cptOrdre %= arrayOrdre.length;

		joueur = await getJoueurRole(arrayOrdre[cptOrdre],Players);

		joueur_time(message,joueur, arrayOrdre);
	});

	
}


//fonction village
async function village_time(message){
	phaseVillage = true;
	joueurATuer = null;
	
	var timer = new time.Timer();

	//Récupère les messages pour la liste des votes
	message.channel.send("-----Liste des votes-----")
	for(i=0;i<Players.length;i++){
		if(Players[i].estVivant){
			await message.channel.send("**"+Players[i].nom+"** : "+votes[i]+".\t\t\t\t**"+Players[i].nom+"** --> "+ ((aVote[i] != -1)? "**"+Players[aVote[i]].nom+"**" : "**Personne**") )
				.then( async message => await messagesVotes.push(message));
			
		}else{
			await messagesVotes.push(null);
		}
	}
	
	message.channel.send("\n-------------------------------\nLe village à **75** secondes pour décider de la personne à éliminer (/vote [nom]) !");
	message.channel.send("/list");

	timer.start({countdown: true, startValues: {seconds: 75}});
	timer.addEventListener('secondsUpdated', function (e) {
			if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
				message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
			};
	});

	timer.addEventListener('targetAchieved', function (e) {
		message.channel.send("**Fin du temps !\n**");

		phaseVillage = false;
		messagesVotes = [];
		deliberationJour(message);
	});
}



//fonction chasseur
async function chasseur_time(message, temps){
	
	if(chasseur != -1 && !chasseur.estVivant && chasseur.peuxAgir){

		await message.channel.send(chasseur.messageChannel());
		await chasseur.idJoueur.send(chasseur.messageJoueur());
		
		var tempsChrono = chasseur.tempsDeJeu;
		var timer = new time.Timer();

		
		timer.start({countdown: true, startValues: {seconds: tempsChrono}});
		timer.addEventListener('secondsUpdated', function (e) {
			if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
				message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
			};
		});

		timer.addEventListener('targetAchieved', async function (e) {

			message.channel.send("**Fin du temps !\n**");

			chasseur.peuxAgir = false;
			
			if(chasseur.aTue != null){
				joueurATuer = chasseur.aTue;
				var retourKill = kill(chasseur.aTue);
				message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.getRole()+"**");
				
				//Cas Amoureux
				await checkAmoureux(message,retourKill);
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



