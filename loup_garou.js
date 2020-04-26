const Discord = require('discord.js');
const time = require('easytimer.js');
const tool = require('./tool') ;
const {Player, Villageois, LoupGarou, Chasseur, Voyante, Cupidon, Sorciere, Salvateur, Noctambule, LoupGarouBlanc, AngDechu, ChienLoup, EnfantSauvage, InfectPereDesLoups, JoueurDeFlute} = require('./joueur.js');
const bot = new Discord.Client();
const dictionnaire = new Map([["Voyante", Voyante],["Villageois", Villageois],["Loup-Garou",LoupGarou],
							["Chasseur", Chasseur], ["Cupidon",Cupidon], ["Sorciere",Sorciere], ["Salvateur",Salvateur],
							["Noctambule", Noctambule], ["Loup_garou_blanc",LoupGarouBlanc], ["Ange", AngDechu],["Chien-loup",ChienLoup],
							 ["Enfant-sauvage",EnfantSauvage], ["Pere_des_loups",InfectPereDesLoups], ["Joueur_flute", JoueurDeFlute] ]);
const tabEmojiVotes = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🇦','🇧','🇨','🇩','🇪','🇫'];

require('events').EventEmitter.defaultMaxListeners = 15;

bot.on('ready', function () {
  console.log("Connected")
})

bot.login('token here');

// VAR GLOBAL SECTION
var nbPlayer = 0;
var hasStarted = 0;
var nomsJoueurs = [];
var Players = [];
var nbLoup = 0;
var nbSV = 0; //Nombre de simples villageois
// var Role = ["Loup","Sorcière","Voyante","Cupidon","Chasseur","LoupBlanc","Voleur","Villageois"];
var rolesDispo = ["Sorciere","Voyante","Cupidon","Chasseur", "Noctambule",  "Chien-loup", "Salvateur", "Loup_garou_blanc", "Enfant-sauvage" , "Pere_des_loups", "Joueur_flute"];
// "Ange",
var rolesChoisis = [];
var strRolesChoisis;
var votes = []  //tableau pour le nombre de vote sur chaque joueur
var aVote = []  //tableau pour savoir qui a voté pour qui pour le tour actuel
var phaseVillage = false;
var joueurATuer;  //Variable utilisée pour connaitre le joueur à tuer
var max,index;
var cpt=0;
var sorciere, voyante, cupidon, chasseur, noctambule, angeDechu, chienLoup, salvateur, lgb, enfantSauvage, ipl, jdf; //Variable pour stocker les rôles spéciaux
var amoureux = [];
var messagesVotes = [], joueursVotes = [];
var ordrePremiereNuit = ["Chien-loup","Cupidon","Enfant-sauvage","Noctambule","Salvateur","Voyante","Loup-Garou","Loup_garou_blanc", "Pere_des_loups", "Sorciere", "Joueur_flute"];
var ordreNuit = ["Noctambule","Salvateur","Voyante","Loup-Garou","Loup_garou_blanc", "Pere_des_loups", "Sorciere", "Joueur_flute"];
var cptOrdre = 0;
var embedPlayersMessage = null;
var embedJeuPrincipal = null;
var embedVotes = null;
var votesCollector;


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

				if(embedPlayersMessage != null){
					embedPlayersMessage.delete();
				}

				console.log(nomsJoueurs);
				
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

				angeDechu = getJoueurRole("Ange", Players);

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
				if(enfantSauvage != -1){
					enfantSauvage.votes = votes;
					enfantSauvage.aVote = aVote;
				}


				ipl = getJoueurRole("Pere_des_loups", Players);
				if(ipl != -1){
					ipl.votes = votes;
					ipl.aVote = aVote;
				}

				jdf = getJoueurRole("Joueur_flute", Players);

				
				console.log("Début de partie");

                await tool.annonceRole(Players);
				await tool.annonceDesLoups(Players);
				await message.channel.send('**Début de la partie...**');
				
				await tool.sleep(2000);

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
					nomsJoueurs.push(nomJoueur);

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

bot.on('message', async message =>{
	if(message.content === '/menu' && embedPlayersMessage == null && hasStarted === 0){
		
		var embedMessage = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Loup Garou')
			.setAuthor(""+bot.user.username, 'https://icon-library.net/images/yellow-discord-icon/yellow-discord-icon-24.jpg')
			.setDescription('Liste des Joueurs')
			
			await message.channel.send(embedMessage)
			.then(embedMessage =>{embedPlayersMessage = embedMessage})
			
			embedPlayersMessage.react('✅');
			embedPlayersMessage.react('❎');

			const filterCheck = (reaction, user) =>{
				return reaction.emoji.name === '✅' && user.id != bot.user.id;
			}
			
			
			const collectorCheck = embedPlayersMessage.createReactionCollector(filterCheck);
			collectorCheck.on('collect', (reaction , user) =>{
				let index = nomsJoueurs.indexOf(user.username);
				let fields = [];

				if(index == -1){
					nomsJoueurs.push(user.username);
					
					Players.push(new Player(user.username,user));
					nbPlayer++;
					console.log(Players);
					nbLoup = Math.floor(nbPlayer/5) +1;
					nbSV = nbPlayer-nbLoup-rolesChoisis.length;
					if(nbSV<0){
						nbSV=0;
					}
					
				}
				for(nomJoueur of nomsJoueurs){
					fields.push({
						name : '\u200b',
						value : nomJoueur+" :white_check_mark:"	
					});
				}

				let newEmbed = new Discord.MessageEmbed(embedPlayersMessage.embeds[0]);
				newEmbed.fields = fields;
				embedPlayersMessage.edit(newEmbed);
				
			});


			const filterCross = (reaction, user) =>{
				return reaction.emoji.name === '❎' && user.id != bot.user.id;
			}

			const collectorCross = embedPlayersMessage.createReactionCollector(filterCross);
			
			collectorCross.on('collect', (reaction , user) =>{
				let index = nomsJoueurs.indexOf(user.username);
				let fields = [];
				if(index != -1){
					nomsJoueurs.splice(index,1);	

					var retour = tool.retirerJoueur(user.username,Players);
					if(retour){
						nbPlayer--;

						nbLoup = Math.floor(nbPlayer/5) +1;
						nbSV= nbPlayer-nbLoup-rolesChoisis.length;
					}

				}

				for(nomJoueur of nomsJoueurs){
					fields.push({
						name : '\u200b',
						value : nomJoueur+" :white_check_mark:"	
					});
				}
				let newEmbed = new Discord.MessageEmbed(embedPlayersMessage.embeds[0]);
				newEmbed.fields = fields;
				embedPlayersMessage.edit(newEmbed);

			});
	}
});

// bot.on('message', message =>{
// 	if(message.content.startsWith("@gayrasio") ){
// 		message.delete();
// 	}
// });

//Commande pour quitter la partie
bot.on('message', message => {    
    if (message.content === '/leave') {
		
		if(hasStarted == 0) {
			var nomJoueur = message.author.username;
			var retour = tool.retirerJoueur(nomJoueur,Players);
			if(retour){
				nbPlayer--;

				let index = nomsJoueurs.indexOf(nomJoueur);
				if(index !=-1){
					nomsJoueurs.splice(index,1);
				}

				nbLoup = Math.floor(nbPlayer/5) +1;
				nbSV= nbPlayer-nbLoup-rolesChoisis.length;

				message.channel.send("**"+nomJoueur + "** à quitté la partie !");
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
	if (hasStarted === 0 && message.content === '/help') {
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

		// delMessage(message);
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

	// delMessage(message);
			
});

//----------------------CLASSE ET FONCTIONS--------------------//

function delMessage(message){
	if (embedJeuPrincipal != null && message.channel == embedJeuPrincipal.channel){
		message.delete();
	}
}

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
async function voter(nomVotant, nomVote){
	let votant = tool.containsIndice(nomVotant,Players);
	let vote = tool.containsIndice(nomVote,Players);
	let ancienVote = -1;

	//Si le joueur a déjà voté, on retire le vote précédent
	if(aVote[votant] != -1){
		ancienVote  = aVote[votant];

		votes[aVote[votant]]--;

		if(messagesVotes.length != 0 && joueursVotes.length != 0 ){
			messagesVotes[ancienVote] =  votes[ancienVote]+" vote(s)"; 
			joueursVotes[ancienVote] = "**"+Players[ancienVote].nom+"** --> "+ ((aVote[ancienVote] !=-1)? "**"+Players[aVote[ancienVote]].nom+"**" : "**Personne**");
		}

	}
	
	//On incrémente ensuite le nombre de vote du joueur voté 
	 votes[vote]++;
	//On met a jour aVoté
	 aVote[votant] = vote;

	//On édite les messages de la liste des votes
	if(messagesVotes.length != 0 && joueursVotes.length != 0 ){

		messagesVotes[votant] = votes[votant]+" votes(s)"; 
		messagesVotes[vote] =  votes[vote]+" vote(s)"; 
		joueursVotes[votant] = "**"+Players[votant].nom+"** --> "+ ((aVote[votant] !=-1) ? "**"+Players[aVote[votant]].nom+"**" : "**Personne**");
		joueursVotes[vote] = "**"+Players[vote].nom+"** --> "+ ((aVote[vote] !=-1)? "**"+Players[aVote[vote]].nom+"**" : "**Personne**");

		oldEmbedFields = embedVotes.embeds[0].fields;
		newEmbedFields = [];
		for(let i in Players){
			if(i == votant || i == vote || (ancienVote !=-1 && i == ancienVote)){
				newEmbedFields.push({
					name : Players[i].nom,
					value : messagesVotes[i],
					inline : true
				});
				newEmbedFields.push({
					name : joueursVotes[i],
					value: '\u200b',
					inline : true
				});
				newEmbedFields.push({
					name : '\u200b',
					value: '\u200b',
					inline : true
				});
			}else {
				newEmbedFields.push(oldEmbedFields[3*i], oldEmbedFields[3*i+1],oldEmbedFields[3*i+2]);
			}

		}
		
		let newEmbed = new Discord.MessageEmbed(embedVotes.embeds[0]);
		newEmbed.fields = newEmbedFields;
		await embedVotes.edit(newEmbed);
			
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

function messageTuer(joueurATuer){
	let str = "";
	let cptMort = 1;
	retourKill = kill(joueurATuer);
	str +=  "**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.getRole()+"**\n";
	
	let datas = checkAmoureux(retourKill);
	cptMort+= datas[0];
	str+= datas[1];
	
	return [cptMort,str];
}


//Check si un amoureux a été tué
//Renvoie 1 si c'est le cas, 0 sinon
function checkAmoureux(joueur){
	let str = "";
	if(joueur != -1){
		str+=  "**"+joueurATuer.nom+"** était, de plus, follement amoureux de **"+joueur.nom + "** !\nCe.tte dernier.e meurt malheureusement avec lui/elle, il/elle était **"+joueur.getRole()+"**\n";
		return [1,str];
	}
	return [0,str];
}


//Récupère un joueur à partir de son rôle
//ou retourn -1 si le rôle n'existe pas dans la partie 
function getJoueurRole(role, tabJoueurs){
	var index = tool.existeRole(role, tabJoueurs);
	return (index != -1) ? tabJoueurs[index] : index;
}


//Tue ou non le(s) joueur(s) désigné(s) durant la nuit par les loups/loup blanc/sorcière

async function deliberationNuit(message, joueurATuer){
	let cptMort = 0;
	let str = "";
	let datas;
	//Si les loups ont voté
	
	// console.log(joueurATuer);

	if (max != 0) {
		//Qu'il n'y a pas d'égalité
		if (joueurATuer != null) {

			if(joueurATuer.hasOwnProperty('estSauve') || joueurATuer.hasOwnProperty("estInfecte") ){
				if(joueurATuer.hasOwnProperty("estSauve")){
					delete joueurATuer.estSauve;
				}else{
					ipl.infecteDeviensLG(Players);
				}	
			}else{
				datas = messageTuer(joueurATuer);
				cptMort += datas[0];
				str+= datas[1];

				console.log(datas, str);
				 
			}

		}
			
	}


	//Check si le loup blanc a tué un loup
	if(lgb != -1 && lgb.estVivant && lgb.aTueLoup != null && lgb.aTueLoup.estVivant){
		
		//Si le loup designé n'est pas protégé
		if(lgb.aTueLoup.hasOwnProperty('estSauve')){
			delete lgb.aTueLoup.estSauve;
		}else{
			datas = messageTuer(lgb.aTueLoup);
			cptMort += datas[0];
			str+= datas[1];
		}
	}

	//Check si la sorcière a tué quelqu'un
	if(sorciere !=-1 && sorciere.hasOwnProperty('aTue') && sorciere.aTue != null && sorciere.aTue.estVivant){	

		datas = await messageTuer(sorciere.aTue);
		cptMort += datas[0];
		str+= datas[1];
	
	}


	//Check le compteur de mort et les votes pour afficher la phrase correspondante
	if(cptMort == 0){
		str += "Personne n'est mort cette nuit..";
	}


	console.log("avant crash  : " +str);
	//Maj Embed du jeu principal
	let embedFields = [{
		name : '\u200b',
		value : str
	}];
	let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0])
	.setDescription("FIN NUIT "+cpt);
	newEmbed.fields = embedFields;
	await embedJeuPrincipal.edit(newEmbed);

	await tool.sleep(5000);
	


	//Enleve la propriété noctambule des joueurs
	if(noctambule != -1 && noctambule.estVivant){
		noctambule.resetNoctambule();
	}

	//Enleve la propriété estSauve des joueurs
	if(salvateur != -1 && salvateur.estVivant){
		salvateur.resetSalvateur()
	}

	//Check si le modèle de l'enfant sauvage a été tué
	if(enfantSauvage !=-1 && enfantSauvage.estVivant){
		enfantSauvage.checkModele(Players);
	}

	tool.resetVotes(votes,aVote);

	chasseur_time(message, "nuit");
	
}


//Tue ou non le(s) joueur(s) désigné(s) durant la journée par les villageois
async function deliberationJour(message){
	let str = "";
	let datas;

	max = tool.resultatVote(votes);

	if (max != 0)  {
		index = tool.checkEgalite(max, votes);
		if (index != -1) {
			
			joueurATuer = Players[index];

			datas = messageTuer(joueurATuer);
			str+= datas[1];

		}else{
			str += "Les habitants n'ont pas réussi à se décider";
		}
	}else{
		str +="Les habitants n'ont voté pour personne";
	}


	//Maj Embed du jeu principal
	let embedFields = [{
		name : '\u200b',
		value : str
	}];
	let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0])
	.setDescription("FIN JOUR "+cpt);
	newEmbed.fields = embedFields;
	await embedJeuPrincipal.edit(newEmbed);

	await tool.sleep(5000);


	// Check l'ange dechu
	if(angeDechu !=-1 && cpt == 1){
		angeDechu.checkVictoire(joueurATuer);
	}
	
	//Check si le modèle de l'enfant sauvage a été tué
	if(enfantSauvage !=-1 && enfantSauvage.estVivant){
		enfantSauvage.checkModele(Players);
	}

 	tool.resetVotes(votes,aVote);

	chasseur_time(message, "jour");
}


async function game_start(message) {
	cpt++;

	if (embedJeuPrincipal == null){
		let embedMessage = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Jeu Principal')
			.setAuthor(""+bot.user.username, 'https://icon-library.net/images/yellow-discord-icon/yellow-discord-icon-24.jpg')
			.setThumbnail('https://i.pinimg.com/originals/06/ff/c8/06ffc8658488b63b89041cb300172d83.jpg')
			.setDescription('NUIT '+ cpt)
			
			await message.channel.send(embedMessage)
			.then(async embedMessage =>{ embedJeuPrincipal = await embedMessage})
	}else{
		let newEmbed = await new Discord.MessageEmbed(embedJeuPrincipal.embeds[0])
		.setThumbnail('https://i.pinimg.com/originals/06/ff/c8/06ffc8658488b63b89041cb300172d83.jpg')
		.setDescription('NUIT '+ cpt);

		await embedJeuPrincipal.edit(newEmbed);
	}
	

	https://i.pinimg.com/originals/06/ff/c8/06ffc8658488b63b89041cb300172d83.jpg

	let arrayOrdre = [];
	if(cpt == 1){
		arrayOrdre = ordrePremiereNuit;
	}else{
		arrayOrdre = ordreNuit;
	}


	var joueur = getJoueurRole(arrayOrdre[cptOrdre],Players);
	joueur_time(message, joueur, arrayOrdre);

	//TEST
	// village_time(message);
}

async function terminerJeu(){
	let str ="";
	let dataCheckFin = tool.checkFinJeu(Players,angeDechu,lgb, jdf);
	let jeuEstFini = dataCheckFin[0];
	let retourCheckFin = dataCheckFin[1];

	if(jeuEstFini){
		switch(retourCheckFin){
			case 0 : 
				str+="La partie est terminée ! Les villageois ont gagnés !\n";
				break;
			case 1 :
				str+="La partie est terminée ! Les loups-garou ont gagné !\n";
				break;
			case 2 :
				str+="La partie est terminée ! Personne n'a gagné !\n";
				break;
			case 3 :
				str+="La partie est terminée ! L'ange déchu a gagné !\n";
				break;
			case 4 :
				str+="La partie est terminée ! Le couple traitre : **"+amoureux[0].nom+"** et **"+amoureux[1].nom+"**; a gagné !\n"; 
				break;
			case 5 : 
				str+="La partie est terminée ! Le Loup-Garou Blanc a gagné!\n";
				break;
			case 6 :
				str+="La partie est terminée ! Le Joueur de flute a gagné\n";
				break;
			case 7 : 
				str+="La partie est terminée ! Les Amoureux ont gagné\n";
		}
		str+="\n-----JOUEURS DE LA PARTIE-----\n";
		
		for(i = 0;i<Players.length;i++){
			str+= await "**"+Players[i]+ ((Players[i].hasOwnProperty('linked') ? " (Amoureux)" : "")) +"**\n";
		}


		//Maj Embed du jeu principal
		let embedFields = [{
			name : '\u200b',
			value : str
		}];
		let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0])
		.setDescription("FIN JEU ");
		newEmbed.fields = embedFields;
		await embedJeuPrincipal.edit(newEmbed);

		await tool.sleep(5000);


		await embedJeuPrincipal.delete();
		if(embedVotes != null){
			await embedVotes.delete();
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
			// game_start(message);
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
	
	
	let embedFields = [{
		name : '\u200b',
		value : joueur.messageChannel()
	}];

	let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0]);
	newEmbed.fields = embedFields;
	await embedJeuPrincipal.edit(newEmbed);
	
	if(!joueur.hasOwnProperty("noctambule")){
		joueur.peuxAgir = true;
	}
	
	await joueur.idJoueur.send(joueur.messageJoueur());

	let tempsChrono = joueur.tempsDeJeu;
	let timer = new time.Timer();

	
	timer.start({countdown: true, startValues: {seconds: tempsChrono}});
	timer.addEventListener('secondsUpdated', function (e) {
		if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
			
			let embedFields = [embedJeuPrincipal.embeds[0].fields[0]]
			embedFields.push({
				name : 'Temps restant :',
				value : timer.getTimeValues().toString().split("0:00:")[1]+" secondes ! "
			});
			let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0]);
			newEmbed.fields = embedFields;
			embedJeuPrincipal.edit(newEmbed);

		};
	});

	
	timer.addEventListener('targetAchieved', async function (e) {

		joueur.peuxAgir = false;

		cptOrdre++;
		cptOrdre %= arrayOrdre.length;


		if(cptOrdre == 0){
			deliberationNuit(message, joueurATuer);
			// game_start(message);
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

	var loups=[]

	for(i=0;i<Players.length;i++){
		if(Players[i].role == "Loup-Garou" && Players[i].estVivant){
			loups.push(Players[i]);
		}
	}

	let embedFields = [{
		name : '\u200b',
		value : loups[0].messageChannel()
	}];
	//TODO AJOUTER JOUEURS EN VIE

	let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0]);
	newEmbed.fields = embedFields;
	await embedJeuPrincipal.edit(newEmbed);



	for(let loup of loups){
		loup.idJoueur.send(loup.messageJoueur());
		loup.peuxManger = true;
	}
	
	var tempsChrono = loups[0].tempsDeJeu;

	var timer = new time.Timer();

	
	timer.start({countdown: true, startValues: {seconds: tempsChrono}});
	timer.addEventListener('secondsUpdated', function (e) {
		if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {

			let embedFields = [embedJeuPrincipal.embeds[0].fields[0]]
			embedFields.push({
				name : 'Temps restant :',
				value : timer.getTimeValues().toString().split("0:00:")[1]+" secondes ! "
			});
			let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0]);
			newEmbed.fields = embedFields;
			embedJeuPrincipal.edit(newEmbed);
		};
	});

	timer.addEventListener('targetAchieved', async function (e) {
		
		for(let loup of loups){
			loup.peuxManger = false;
		}

		max = tool.resultatVote(votes);
		
		// console.log(max);

		if (max != 0)  {
			index = tool.checkEgalite(max, votes);
			if (index != -1) {
				joueurATuer = Players[index];
				sorciere.joueurATuer = joueurATuer;
				ipl.joueurATuer = joueurATuer;
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
	
	//Embed jeu Principal
	let embedFields = []
	embedFields.push({
		name : '\u200b',
		value : "-------------------------------\nLe village à **75** secondes pour décider de la personne à éliminer (/vote [nom]) !"
	});
	let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0])
	.setDescription("JOUR "+cpt)
	.setThumbnail(' https://images.assetsdelivery.com/compings_v2/studiobarcelona/studiobarcelona1605/studiobarcelona160500031.jpg');
	newEmbed.fields = embedFields;

	await embedJeuPrincipal.edit(newEmbed);
	

	embedFields = [];	

	for(i=0;i<Players.length;i++){
		if(Players[i].estVivant){
			let nbVotes = votes[i]+" vote(s)" ;
			let voteJoueur = "**"+Players[i].nom+"** --> "+ ((aVote[i] != -1)? "**"+Players[aVote[i]].nom+"**" : "**Personne**");

			embedFields.push({
				name : Players[i].nom,
				value : nbVotes,
				inline : true
			 });
			 embedFields.push({
				 name : voteJoueur,
				 value: '\u200b',
				 inline : true
			 })

			 embedFields.push({
				name : '\u200b',
				value: '\u200b',
				inline : true
			})
			
			 messagesVotes.push(nbVotes);
			 joueursVotes.push(voteJoueur);
			
		}else{

			embedFields.push({
				name : Players[i]+" :x:",
				value : '\u200b',
				inline : true
			})
			embedFields.push({
				 name : '\u200b',
				 value: '\u200b',
				 inline : true
			 })

			embedFields.push({
				name : '\u200b',
				value: '\u200b',
				inline : true
			})
		}
	}
			

	//Embed des votes
	if(embedVotes == null){

		let embedMessage = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle('Liste des votes')
		.setThumbnail('https://www.pngrepo.com/download/41069/village.png')
		.setAuthor(""+bot.user.username, 'https://icon-library.net/images/yellow-discord-icon/yellow-discord-icon-24.jpg');
		
		embedMessage.fields = embedFields;

		await message.channel.send(embedMessage)
		.then(embedMessage => {embedVotes = embedMessage});

		
		for(i=0; i<Players.length;i++){
			await embedVotes.react(tabEmojiVotes[i]);
		}
		
		let filter = (reaction, user) =>{
			return user.id != bot.user.id;
		}
		
		votesCollector = embedVotes.createReactionCollector(filter);

		console.log("sensé mettre le collect");
		await votesCollector.on('collect', (reaction , user) =>{
			let indexVotant = nomsJoueurs.indexOf(user.username);

			if(Players[indexVotant].estVivant){
				let indexVote = tabEmojiVotes.indexOf(reaction.emoji.name);
				if(indexVote != -1){
					if(Players[indexVote].estVivant){
						voter(user.username, nomsJoueurs[indexVote]);
					}
				}
			}

		});
		console.log("sensé se passer après le collect");

	
	}else{
		let newEmbed = new Discord.MessageEmbed(embedVotes.embeds[0]);
		newEmbed.fields = embedFields;

		await embedVotes.edit(newEmbed);
	}
	

	
	phaseVillage = true;
	joueurATuer = null;

	var timer = new time.Timer();

	timer.start({countdown: true, startValues: {seconds: 20}});
	timer.addEventListener('secondsUpdated', function (e) {
			if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
				
				let embedFields = [embedJeuPrincipal.embeds[0].fields[0]]
				embedFields.push({
					name : 'Temps restant :',
					value : timer.getTimeValues().toString().split("0:00:")[1]+" secondes ! "
				});
				let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0]);
				newEmbed.fields = embedFields;
				embedJeuPrincipal.edit(newEmbed);

			};
	});

	timer.addEventListener('targetAchieved', function (e) {

		phaseVillage = false;
		messagesVotes = [];
		deliberationJour(message);
	});
}


//fonction chasseur
async function chasseur_time(message, temps){
	
	if(chasseur != -1 && !chasseur.estVivant && chasseur.peuxAgir){


		let embedFields = [{
			name : '\u200b',
			value : chasseur.messageChannel()
		}];
	
		let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0]);
		newEmbed.fields = embedFields;
		await embedJeuPrincipal.edit(newEmbed);
		await chasseur.idJoueur.send(chasseur.messageJoueur());
		

		var tempsChrono = chasseur.tempsDeJeu;
		var timer = new time.Timer();

		
		timer.start({countdown: true, startValues: {seconds: tempsChrono}});
		timer.addEventListener('secondsUpdated', function (e) {
			if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
				
				let embedFields = [embedJeuPrincipal.embeds[0].fields[0]]
				embedFields.push({
					name : 'Temps restant :',
					value : timer.getTimeValues().toString().split("0:00:")[1]+" secondes ! "
				});
				let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0]);
				newEmbed.fields = embedFields;
				embedJeuPrincipal.edit(newEmbed);

			};
		});

		timer.addEventListener('targetAchieved', async function (e) {
			chasseur.peuxAgir = false;
			let str = "";

			if(chasseur.aTue != null){
				str =  messageTuer(chasseur.aTue)[1];
			}else {
				str+="Le chasseur n'a tué personne";
			}


			let embedFields = [{
				name : '\u200b',
				value : str
			}];
		
			let newEmbed = new Discord.MessageEmbed(embedJeuPrincipal.embeds[0]);
			newEmbed.fields = embedFields;
			await embedJeuPrincipal.edit(newEmbed);

			await tool.sleep(5000);

			await terminerJeu();

			if(temps == "jour"){
				game_start(message);
			}else{
				village_time(message);
			}

		});
	}else{

		await terminerJeu();
		
		if(temps == "jour"){
			game_start(message);
		}else{
			village_time(message);
		}

	}

}



