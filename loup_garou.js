const Discord = require('discord.js')
const time = require('easytimer.js')
const tool = require('./tool') 
const bot = new Discord.Client()
require('events').EventEmitter.defaultMaxListeners = 25;

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
var rolesDispo = ["Sorcière","Voyante","Cupidon","Chasseur", "Noctambule", "Ange_dechu", "Chien-loup", "Salvateur", "Loup_garou_blanc", "Enfant-sauvage"];
var rolesChoisis = [];
var strRolesChoisis;
var votes = []  //tableau pour le nombre de vote sur chaque joueur
var aVote = []  //tableau pour savoir qui a voté pour qui pour le tour actuel
var PM=  [] // tableau pour sauvegarder les object "message" de l'API Discord afin de pouvoir MP les loups
var loupCanKill = 0; // variable pour savoir si les loups peuvent tuer
var phaseVillage = false;
var phaseChasseur = false;
var joueurATuer;  //Variable utilisée pour connaitre le joueur à tuer
var max,index;
var cpt=0;
var sorciere, voyante, cupidon, chasseur, noctambule, angeDechu, chienLoup, salvateur, lgb, enfantSauvage; //Variable pour stocker les rôles spéciaux
var amoureux = [];
var messagesVotes = [];



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
				strRolesChoisis = tool.toStringRoles(rolesChoisis,nbLoup,nbSV);

                // nbLoup = Math.floor(nbPlayer/4) +1;
                // nbLoup = 2 // a changer, FOR DEBUG ONLY
                message.channel.send("Nombre de Loup-Garou : " + nbLoup);
                Players = generateIDs(nbPlayer,nbLoup, Players, rolesChoisis);
               
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
					noctambule.dernierJoueurVisite = null; //Variable pour stocker le dernier joueur auquel le noctambule a rendu visite
					noctambule.peuxDormir = false;
				}

				angeDechu = getJoueurRole("Ange_dechu", Players);
				if(angeDechu != -1){
					angeDechu.peuxGagner = false;
					angeDechu.idJoueur.send("Pour gagner, vous devez faire en sorte de vous faire éliminer lors du 1er vote du village.\nAutrement, vous deviendrez **Villageois**");
				}

				chienLoup = getJoueurRole("Chien-loup", Players);
				if(chienLoup !=-1){
					chienLoup.change = false;
				}
				
				salvateur = getJoueurRole("Salvateur", Players);
				if(salvateur != -1){
					salvateur.peuxSauver = false;
					salvateur.dernierJoueurSauve = null;
				}

				lgb = getJoueurRole("Loup_garou_blanc", Players);
				if(lgb !=-1){
					nbLoup++;
					lgb.peuxTuerLoup = false;
					lgb.aTueLoup = null;
					lgb.subRole = lgb.role;
					lgb.role = "Loup-Garou";
					lgb.getRole = function(){return this.subRole};
				}

				enfantSauvage = getJoueurRole("Enfant-sauvage", Players);
				if(enfantSauvage !=-1){
					enfantSauvage.peuxChoisirModele = true;
					enfantSauvage.joueurModele = null;
				}

				console.log("Début de partie");
                await tool.annonceRole(Players, PM);
				await tool.annonceDesLoups(Players,PM);
				await message.channel.send('**Début de la partie...**');

                game_start(message);
                
            }
            else {
                message.channel.send('La partie a déja débuté, commande : **/loupStop** pour terminer la partie');
            }
        }
    
    }
});

// OK (/play)
bot.on('message', async message => {	
	var nomJoueur = message.author.username;
	var idJoueur = message.author;
	if (message.content === '/play') {
		if(hasStarted == 0) {
				if(!tool.contains(nomJoueur, Players)){
					Players.push(new Player(nomJoueur,idJoueur))
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


// OK (leave)
bot.on('message', message => {    
    if (message.content === '/leave') {
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
        
    }
})


//Commande pour ajouter un rôle
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


//Commande pour supprimer un rôle
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


//Commande pour afficher la liste des roles 
bot.on('message', async message => {
    if (message.content === '/roleList') {

		if(cpt == 0){
			strRolesChoisis = tool.toStringRoles(rolesChoisis,nbLoup,nbSV);
		}
		message.channel.send(strRolesChoisis);
		
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
		message.channel.send('Liste des commandes :  \n **/loupStart **Débute la partie **(ALL)** \n** /loupStop** Termine la partie  **(ALL)** \n **/play** Vous ajoute à la partie **(ALL)** \n **/leave** Quitte la partie **(ALL)** \n **/roleDispo** Liste des roles disponibles **(ALL)** \n **/roleList** Liste les roles de la partie  **(ALL)**\n **/add** Ajoute un role à la partie **(ALL)**\n **/del** Supprime un role de la partie **(ALL)** \n **/list** Affiche les joueurs vivants **(ALL)**') 
	    message.channel.send('**/kill** [PLAYER] Envoyez un MP à LoupGarou-Bot pour désigner un joueur (autre qu\'un loup) à tuer pendant la nuit **(Loup-Garou)** \n **/curse** [PLAYER] Envoyez un MP à LoupGarou-Bot pour tuez un joueur  **(Sorcière)**  \n **/save** Envoyez un MP à LoupGarou-Bot pour sauver un joueur **(Sorcière)** \n **/reveal** [PLAYER] Envoyez un MP à LoupGarou-Bot pour afficher le role du joueur **(Voyante)**\n **/link** [PLAYER1] [PLAYER2] Envoyez un MP à LoupGarou-Bot pour lier 2 joueurs **(Cupidon)**\n **/hunt** [PLAYER] Envoyez un MP à LoupGarou-Bot pour tuer un joueur **(Chasseur)**');
		message.channel.send('**/sleep** [PLAYER] Envoyez un MP à LoupGarou-Bot pour aller dormir chez un joueur (1 joueur différent chaque tour) **(Noctambule)**\n **/change** Envoyez un MP à LoupGarou-Bot pour devenir Loup-Garou **(Chien-Loup)**\n **/protect** [PLAYER] Envoyez un MP à LoupGarou-Bot pour protéger un joueur durant la nuit (1 joueur différent chaque tour) **(Salvateur)**\n **/wolfKill** [PLAYER_LOUP]Envoyez un MP à LoupGarou-Bot pour tuer un Loup-Garou au choix **(Loup-Garou Blanc)**\n  **/vote** [PLAYER] votez un joueur que vous pensez être un loup **(ALL)** \n');
		message.channel.send('**/modele** [PLAYER] Envoyez un MP à LoupGarou-Bot pour choisir le joueur modèle **(Enfant Sauvage)**\n');
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

		var indexLoup = tool.checkRole(message.author.username, "Loup-Garou", Players);
		
		//Si le joueur est un loup, en vie, et que les loups peuvent voter
		if(hasStarted == 1 && indexLoup != -1 && Players[indexLoup].estVivant == 1 && loupCanKill == 1){

			//Si le noctambule est chez le loup 
			if(Players[indexLoup].hasOwnProperty("noctambule") ){
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
					message.reply("Vous n'avez pas le droit de vous designer !");
				}else if(Players[indexJoueurDesigne].role == "Loup-Garou"){
					message.reply("Vous n'avez pas le droit de désigner un autre Loup-Garou !");
				}else{
					//On vote pour le joueur désigné et on envoie un message aux autres loups
					voter(message.author.username, joueurDesigne);
					message.reply("Vous souhaitez tuer **"+joueurDesigne+"**");
					var nomLoup = message.author.username;
					
					var nomAutreLoup = '';
					
					for (i=0; i<Players.length; i++) {
						if(Players[i].role == 'Loup-Garou' && Players[i].nom != nomLoup) {
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

		if(hasStarted == 1 && chasseur !=-1){

			var indexChasseur = tool.checkRole(message.author.username, chasseur.getRole(), Players);
			
			if(phaseChasseur && chasseur.peuxTuer && !chasseur.estVivant) {
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
			}else{
				message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
			}
		}else{
			message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
		}
		
	}
});


//Commande pour que les habitants puissent voter l'élimination de quelqu'un
bot.on('message', message => {
    if (message.content.startsWith('/vote')) {
	   
		
		if(hasStarted == 1){
			
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
			}else{
				message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
			}

		}else{
			message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
		}
		
    }
});


// OK : reveal the role of a player (voyante)
bot.on('message', message => {	
	if (message.content.startsWith('/reveal')) {
		
		if (hasStarted == 1 && voyante !=-1 && tool.checkRole(message.author.username,voyante.getRole(),Players) != -1 && voyante.estVivant == 1 && voyante.peuxVoir && !voyante.hasOwnProperty("noctambule")){
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
					message.reply("**"+joueurAReveler + '** est : **'+Players[index].getRole()+"**");
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
		if(hasStarted == 1 && sorciere !=-1 && tool.checkRole(message.author.username, sorciere.getRole(), Players) != -1 && sorciere.estVivant && sorciere.peuxAgir && sorciere.peuxTuer && !sorciere.hasOwnProperty("noctambule")){

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

		if( hasStarted == 1 && sorciere !=-1 && tool.checkRole(message.author.username, sorciere.getRole(), Players) != -1 && sorciere.estVivant && sorciere.peuxAgir && sorciere.peuxSauver && !sorciere.hasOwnProperty("noctambule")){
			
			sorciere.peuxSauver = false;

			joueurATuer.estSauve = true;

			message.reply("Vous venez de sauver **"+ joueurATuer.nom+"**");
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}

	}
});


//Commande pour cupidon
bot.on('message', message => {	
	if (message.content.startsWith('/link')) {

		if(hasStarted == 1 && cupidon!=-1 && tool.checkRole(message.author.username, cupidon.getRole(), Players) != -1 && cupidon.estVivant && cupidon.peuxLier){

			var joueur1 = message.content.split(" ")[1];
			var joueur2 = message.content.split(" ")[2];
			var index1 = tool.containsIndice(joueur1, Players);
			var index2 = tool.containsIndice(joueur2, Players);

			if (index1 == -1 || index2 == -1) {
				message.reply("Un des joueurs n'existe pas !");
			}
			else {
				cupidon.peuxLier = false;	
				Players[index1].linked = true;
				Players[index2].linked = true;

				Players[index1].idJoueur.send("Vous êtes amoureux avec **"+Players[index2].nom+"**");
				Players[index2].idJoueur.send("Vous êtes amoureux avec **"+Players[index1].nom+"**");
				
				if( (Players[index1].role == "Loup-Garou" && Players[index2].role != "Loup-Garou") 
					|| (Players[index2].role == "Loup-Garou" && Players[index1].role != "Loup-Garou") ){

					Players[index1].idJoueur.send("Vos condition de victoire ont changé. Vous et **"+Players[index2].nom+"** devez rester en vie et éliminer tout le monde");
					Players[index2].idJoueur.send("Vos condition de victoire ont changé. Vous et **"+Players[index1].nom+"** devez rester en vie et éliminer tout le monde");
				}

				amoureux.push(Players[index1]);
				amoureux.push(Players[index2]);

				message.reply("Vous venez de lier **"+joueur1+"** et **"+joueur2+"**");
			}
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}

	}
});

//Commande pour le noctambule
bot.on('message', message => {	
	if (message.content.startsWith('/sleep')) {

		if(hasStarted == 1 && noctambule !=-1 && tool.checkRole(message.author.username, noctambule.getRole(), Players) != -1 && noctambule.estVivant && noctambule.peuxDormir){

			var joueurDesigne = message.content.split(" ")[1];
			var indexJoueurDesigne = tool.containsIndice(joueurDesigne, Players);

			if (indexJoueurDesigne == -1) {
				message.reply("Ce joueur n'existe pas !");
			
			}
			//Check que le joueur désigné est en vie
			else if(!Players[indexJoueurDesigne].estVivant){
				message.reply("Ce joueur est mort");
			}else if(noctambule.dernierJoueurVisite == Players[indexJoueurDesigne]){
				message.reply("Vous ne pouvez pas dormir chez le même joueur 2 fois de suite");
			}else if(noctambule.nom == joueurDesigne){
				message.reply("Vous ne pouvez pas dormir chez vous !");
			}else{
				noctambule.peuxDormir = false;
				noctambule.dernierJoueurVisite = Players[indexJoueurDesigne];

				noctambule.idJoueur.send("Vous allez dormir chez **"+joueurDesigne+"**");
				Players[indexJoueurDesigne].idJoueur.send("**"+noctambule+"** vient dormir chez vous. Vous serez privé.e de vos pouvoirs cette nuit");
				
				Players[indexJoueurDesigne].noctambule = true;
			}
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}

	}
});


//Commande pour le chien Loup
bot.on('message', message => {	
	if (message.content === '/change') {

		if(hasStarted == 1 && chienLoup !=-1 && tool.checkRole(message.author.username, chienLoup.getRole(), Players) != -1 && chienLoup.estVivant){
			chienLoup.change = true;
			chienLoup.idJoueur.send("Vous êtes à présent un **Loup-Garou**");
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}
	}
});

//Commande pour le salvateur
bot.on('message', message =>{
	if(message.content.startsWith('/protect')){
		
		if( hasStarted == 1 && salvateur !=-1 && tool.checkRole(message.author.username, salvateur.getRole(), Players) != -1 && salvateur.estVivant && salvateur.peuxSauver && !salvateur.hasOwnProperty("noctambule")){
			var joueurDesigne = message.content.split(" ")[1];
			var indexJoueurDesigne = tool.containsIndice(joueurDesigne, Players);

			if (indexJoueurDesigne == -1) {
				message.reply("Ce joueur n'existe pas !");
			}else if(!Players[indexJoueurDesigne].estVivant){
				message.reply("Ce joueur est mort");
			}else if(salvateur.dernierJoueurSauve == Players[indexJoueurDesigne]){
				message.reply("Vous ne pouvez pas protéger le même joueur 2 fois de suite");
			}else{
				Players[indexJoueurDesigne].estSauve = true;
				salvateur.dernierJoueurSauve = Players[indexJoueurDesigne];
				message.reply("Vous avez décidé de protéger **"+salvateur.dernierJoueurSauve.nom+"**");
			}
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}
	}
});


//Commande pour le loup blanc
bot.on('message', message =>{
	if(message.content.startsWith('/wolfKill')){
		
		if(hasStarted == 1&& lgb !=-1){
			
			indexLoup = tool.checkRole(message.author.username, "Loup-Garou" , Players);
			
			if(indexLoup != -1 && Players[indexLoup].hasOwnProperty('subRole') && Players[indexLoup].subRole == lgb.getRole() && lgb.estVivant && lgb.peuxTuerLoup && !lgb.hasOwnProperty("noctambule") ){
				var loupDesigne = message.content.split(" ")[1];
				var indexLoupDesigne = tool.containsIndice(loupDesigne, Players);

				if (indexLoupDesigne == -1) {
					message.reply("Ce joueur n'existe pas !");
				}else if(Players[indexLoupDesigne].getRole() != "Loup-Garou"){
					message.reply("Ce joueur n'est pas un loup !");
				}else if(!Players[indexLoupDesigne].estVivant){
					message.reply("Ce Loup est mort !");
				}else if(lgb.nom == loupDesigne){
					message.reply("Vous n'avez pas le droit de vous designer !");
				}else{
					lgb.aTueLoup = Players[indexLoupDesigne];
					lgb.peuxTuerLoup = false;
					message.reply("Vous avez tué **"+loupDesigne+"**");
				}
			}else{
				message.reply("Vous n'avez pas le droit d'utilser cette commande !");
			}

		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}
		
	}
});


//Commande pour l'enfant sauvage
bot.on('message', message => {
	if(message.content.startsWith('/modele')){
		
		if(hasStarted == 1 && enfantSauvage !=-1 && tool.checkRole(message.author.username, enfantSauvage.getRole() , Players) != -1 && enfantSauvage.estVivant && enfantSauvage.peuxChoisirModele){
			var joueurDesigne = message.content.split(" ")[1];
			var indexJoueurDesigne = tool.containsIndice(joueurDesigne, Players);

			if (indexJoueurDesigne == -1) {
				message.reply("Ce joueur n'existe pas !");
			}else if(!Players[indexJoueurDesigne].estVivant){
				message.reply("Ce Loup est mort !");
			}else if(enfantSauvage.nom == joueurDesigne){
				message.reply("Vous n'avez pas le droit de vous prendre comme modèle !");
			}else{
				enfantSauvage.joueurModele = Players[indexJoueurDesigne];
				enfantSauvage.peuxChoisirModele = false;
				message.reply("Vous avez choisi **"+joueurDesigne+"** comme joueur modèle.\nS'il meurt vous deviendrez **Loup-Garou**");
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
	
	getRole(){
		return this.role;
	}
	toString(){
		return this.nom + ' : ' + this.getRole();
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
        tabJoueurs[ids[index]].setRole("Loup-Garou");
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

	//On édite les messages de la liste des votes
	if(messagesVotes.length != 0){
		messagesVotes[votant].edit("**"+Players[votant].nom+"** : "+votes[votant]+".\t\t\t\t**"+Players[votant].nom+"** --> "+ ((aVote[votant] !=-1) ? "**"+Players[aVote[votant]].nom+"**" : "**rien**") );
		messagesVotes[vote].edit("**"+Players[vote].nom+"** : "+votes[vote]+".\t\t\t\t**"+Players[vote].nom+"** --> "+ ((aVote[vote] !=-1)? "**"+Players[aVote[vote]].nom+"**" : "**rien**") );	
	}
	
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
function checkAmoureux(message, joueur){
	if(joueur != -1){
		message.channel.send("**"+joueurATuer.nom+"** était, de plus, follement amoureux de **"+joueur.nom + "** !\nCe.tte dernier.e meurt malheureusement avec lui/elle, il/elle était **"+joueur.getRole()+"**");
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
			if(joueurATuer.hasOwnProperty('estSauve')){
				delete joueurATuer.estSauve;
			}else{
				retourKill = kill(joueurATuer,Players);
				message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.getRole()+"**");
				cptMort++;
				//Cas Amoureux
				cptMort += await checkAmoureux(message,retourKill);
			}

		}
			
	}


	if(lgb != -1 && lgb.aTueLoup != null && lgb.aTueLoup.estVivant){
		
		//Si le loup designé n'est pas protégé
		if(lgb.aTueLoup.hasOwnProperty('estSauve')){
			delete lgb.aTueLoup.estSauve;
		}else{
			//On tue le loup désigné
			retourKill = kill(lgb.aTueLoup,Players);
			cptMort++
			
			message.channel.send("**"+lgb.aTueLoup.nom+"** a été éliminé.e!\nIl/Elle etait **"+lgb.aTueLoup.getRole()+"**");
			cptMort += await checkAmoureux(message,retourKill);
		}
		lgb.aTueLoup = null;
	}

	//Check si la sorcière a tué quelqu'un
	if(sorciere !=-1 && sorciere.hasOwnProperty('aTue') && sorciere.aTue != null && sorciere.aTue.estVivant){
		
		joueurATuer = sorciere.aTue;
		var retourKill = kill(sorciere.aTue, Players);
		message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.getRole()+"**");
		cptMort++;

		//Cas Amoureux
		cptMort += await checkAmoureux(message,retourKill);

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

	if(noctambule != -1 && noctambule.dernierJoueurVisite != null){
		if(noctambule.dernierJoueurVisite.hasOwnProperty("noctambule")){
			delete noctambule.dernierJoueurVisite.noctambule;
		}else{
			noctambule.dernierJoueurVisite = null;
		}
	}

	if(salvateur != -1 && salvateur.dernierJoueurSauve != null){
		if(salvateur.dernierJoueurSauve.hasOwnProperty("estSauve")){
			delete salvateur.dernierJoueurSauve.estSauve;
		}
	}

	if(enfantSauvage !=-1 && enfantSauvage.joueurModele != null && !enfantSauvage.joueurModele.estVivant){
		enfantSauvage.subRole = enfantSauvage.role;
		enfantSauvage.role = "Loup-Garou";
		enfantSauvage.getRole = function(){return this.subRole};
		await enfantSauvage.idJoueur.send("Votre modèle est mort. Vous êtes à présent un **Loup-Garou**");
		await tool.annonceDesLoups(Players,PM);
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
			
			message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.getRole()+"**");
			
			//Cas Amoureux
			await checkAmoureux(message,retourKill);

		}else{
			message.channel.send("Les habitants n'ont pas réussi à se décider");
		}
	}else{
		message.channel.send("Les habitants n'ont voté pour personne");
	}


	//Check l'ange dechu
	if(angeDechu !=-1 && angeDechu.getRole() == "Ange_dechu"){
		if(cpt == 1){
			if(angeDechu.estVivant){
				angeDechu.subRole = "Villageois";
				angeDechu.idJoueur.send("Vos conditions de victoire ont changé, vous êtes devenu **Villageois**");
			}else{
				angeDechu.peuxGagner = true;
			}
		}
	}
	
	if(enfantSauvage !=-1 && enfantSauvage.joueurModele != null && !enfantSauvage.joueurModele.estVivant){
		enfantSauvage.subRole = enfantSauvage.role;
		enfantSauvage.role = "Loup-Garou";
		enfantSauvage.getRole = function(){return this.subRole};
		await enfantSauvage.idJoueur.send("Votre modèle est mort. Vous êtes à présent un **Loup-Garou**");
		await tool.annonceDesLoups(Players,PM);
	}

	var datasVotes = tool.resetVotes(votes,aVote);
	votes = datasVotes[0];
	aVote = datasVotes[1];

	chasseur_time(message, "jour");
	
}

function game_start(message) {

	cpt++;
	message.channel.send('DEBUT NUIT : '+ cpt);
	chienLoup_time(message);
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


async function chienLoup_time(message){
	if(chienLoup != -1 && chienLoup.role == "Chien-loup"){
		
		var timer = new time.Timer();

		message.channel.send("\n-------------------------------\nLe Chien Loup a **20** secondes pour choisir son camp");
		await chienLoup.idJoueur.send("Vous avez **20** secondes pour choisir entre rester **Villageois** (ne rien faire) ou devenir un **Loup-Garou** (/change)");


		timer.start({countdown: true, startValues: {seconds: 20}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
		});

		timer.addEventListener('targetAchieved', function (e) {
			
			message.channel.send("**Fin du temps !\n**");

			if(chienLoup.change){
				chienLoup.subRole = chienLoup.role;
				chienLoup.role = "Loup-Garou";
				chienLoup.getRole = function(){return this.subRole};
				nbLoup++;

				tool.annonceDesLoups(Players,PM);

			}else{
				chienLoup.subRole = chienLoup.role;
				chienLoup.role = "Villageois";				
				chienLoup.getRole = function() {return this.subRole};
				nbSV++;
			}
			cupidon_time(message);
		});

	}else{
		cupidon_time(message);
	}
	
}

async function cupidon_time(message){
	if(cupidon != -1 && cupidon.estVivant && cupidon.peuxLier){
		
		var timer = new time.Timer();

		message.channel.send("\n-------------------------------\nCupidon à **40** secondes pour sélectionner 2 personnes dont le destin sera lié pour le reste de la partie !");
		await cupidon.idJoueur.send("Vous avez **40** secondes pour désigner 2 joueurs à lier (/link [nom1] [nom2]) !");

		timer.start({countdown: true, startValues: {seconds: 40}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
		});

		timer.addEventListener('targetAchieved', function (e) {

			message.channel.send("**Fin du temps !\n**");

			cupidon.peuxLier = false;
			enfantSauvage_time(message);
		});

	}else{
		enfantSauvage_time(message);
	}
}


async function enfantSauvage_time(message){
	if(enfantSauvage !=-1 && enfantSauvage.estVivant && enfantSauvage.peuxChoisirModele){

		var timer = new time.Timer();

		message.channel.send("\n-------------------------------\nL'enfant sauvage à **20** secondes pour sélectionner 1 joueur qui deviendra son modèle !");
		await enfantSauvage.idJoueur.send("Vous avez **20** secondes pour choisir un joueur qui sera votre modèle (/modele [nom]). A sa mort, vous deviendrez **Loup-Garou** !");

		timer.start({countdown: true, startValues: {seconds: 20}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
		});

		timer.addEventListener('targetAchieved', function (e) {

			message.channel.send("**Fin du temps !\n**");
			enfantSauvage.peuxChoisirModele = false;

			noctambule_time(message);
		});


	}else{
		noctambule_time(message)
	}
}


async function noctambule_time(message){
	if(noctambule !=-1 && noctambule.estVivant){
		noctambule.peuxDormir = true;

		var timer = new time.Timer();

		message.channel.send("\n-------------------------------\nLe noctambule à **20** secondes pour décider chez qui il va aller dormir! Cette personne sera privée de ses pouvoirs pour la nuit");
		await noctambule.idJoueur.send("Vous avez **20** secondes pour choisir chez qui aller dormir (/sleep [nom]) !");

		timer.start({countdown: true, startValues: {seconds: 20}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
		});

		timer.addEventListener('targetAchieved', function (e) {

			message.channel.send("**Fin du temps !\n**");

			noctambule.peuxDormir = false;
			salvateur_time(message);
		});
	}else{
		salvateur_time(message);
	}
}


async function salvateur_time(message){

	if(salvateur != -1 && salvateur.estVivant){

		if(salvateur.hasOwnProperty("noctambule") ){
			await salvateur.idJoueur.send("Vous n'avez pas vos pouvoirs cette nuit !");

			loupandvoyante_time(message);
		}else{
			salvateur.peuxSauver = true;

			message.channel.send("\n-------------------------------\nLe Salvateur à **20** secondes pour choisir une personne à protéger !");
			await salvateur.idJoueur.send("Vous avez **20** secondes pour choisir quelqu'un à protéger (/protect [nom]) !");
			
			var timer = new time.Timer();			

			timer.start({countdown: true, startValues: {seconds: 20}});
			timer.addEventListener('secondsUpdated', function (e) {
					if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
						message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
					};
			});

			timer.addEventListener('targetAchieved', function (e) {
				salvateur.peuxSauver = false;
				
				loupandvoyante_time(message);
			});
		
		}
	}else{
		loupandvoyante_time(message);
	}

	
}


async function loupandvoyante_time(message) {
	joueurATuer = 0;

	message.channel.send('\n-------------------------------\nLes loups ont **30s** pour choisir leur victime...');
	message.channel.send("/list");
	loupCanKill = 1;

	//Check si la voyante existe et si elle est en vie

	if(voyante != -1 && voyante.estVivant){

		//Si le noctambule dors chez la voyante
		if(voyante.hasOwnProperty("noctambule") ){
			await voyante.idJoueur.send("Vous n'avez pas vos pouvoirs cette nuit !");
		}else{
			voyante.idJoueur.send("/list");
			//Liste des joueurs déjà vu
			voyante.idJoueur.send(tool.roleDejaVu(voyante));
			await voyante.idJoueur.send("Vous avez **30s** pour révéler le rôle d'une personne !");
			voyante.peuxVoir = true;
		}
		
		message.channel.send('\nLa voyante a **30s** pour reveler une personne...');
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
			
		lgb_time(message);
	})

	
}

async function lgb_time(message){

	//Check si le lgb est en vie
	if(cpt%2 == 0 && lgb != -1 && lgb.estVivant){
		
		//Check si le noctambule est venu chez lui
		if(lgb.hasOwnProperty("noctambule") ){
			await lgb.idJoueur.send("Vous n'avez pas vos pouvoirs cette nuit !");
		}else{
			lgb.peuxTuerLoup = true;
			await lgb.idJoueur.send("Vous avez **20s** pour tuer ou non un **Loup-Garou** (/wolfKill [nom] )!");
		}
		var timer = new time.Timer();

		await lgb.idJoueur.send(tool.getLoupsGarou(Players));
		message.channel.send('\nLe Loup-Garou Blanc a **20s** pour tuer un loup...');

		timer.start({countdown: true, startValues: {seconds: 20}});
		timer.addEventListener('secondsUpdated', function (e) {
			if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
				message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
			};
		});


		timer.addEventListener('targetAchieved', function (e) {
		
			message.channel.send("**Fin du temps !\n**");
		
			lgb.peuxTuerLoup = false;	
			sorciere_time(message,joueurATuer);
		})

	}else{
		sorciere_time(message,joueurATuer);
	}

	
}


async function sorciere_time(message, joueurATuer) {
	
	//Check si la sorcière existe et si elle est en vie
	if(sorciere !=-1 && sorciere.estVivant){

		
		var timer = new time.Timer();

		message.channel.send("\n-------------------------------\nLa Sorcière à **20** secondes pour utiliser ses pouvoirs !");
		
		//Si le noctambule dors chez la sorcière
		if(sorciere.hasOwnProperty("noctambule") ){
			await sorciere.idJoueur.send("Vous n'avez pas vos pouvoirs cette nuit !\n");
			// deliberationNuit(message,joueurATuer);
			
		}else{
			sorciere.peuxAgir = true;
			//Envoie un message en fonction du vote des loups
			if ( (max == 0 || joueurATuer == 0 || joueurATuer.hasOwnProperty('estSauve')) && sorciere.peuxTuer) {
				await sorciere.idJoueur.send("Personne n'a été désigné par les loups. Vous pouvez utilisez votre potion de mort (/curse [nom]) ou ne rien faire");
			}
			else if(max !=0 && joueurATuer != 0 && sorciere.peuxSauver) {	
				await sorciere.idJoueur.send("**"+joueurATuer.nom +"** a été désigné par les loups, Vous pouvez utilisez votre potion de mort (/curse [nom]) sur quelqu'un ou sauver **"+joueurATuer.nom + "** (/save)");
			
			}else if(sorciere.peuxTuer){
				await sorciere.idJoueur.send("Vous pouvez utilisez votre potion de mort (/curse [nom]) ou ne rien faire");
			}
		}
			
			//Debut du timer
			timer.start({countdown: true, startValues: {seconds: 20}});
			timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
			});


			//A la fin du timer, on annonce les résultats concernant les actions de la nuit
			//Vote des loups, sorcière, etc..
			timer.addEventListener('targetAchieved', function (e) {
				
				message.channel.send("**Fin du temps !\n**");
				sorciere.peuxAgir = false;
				
				deliberationNuit(message,joueurATuer);
				
			});

		
	}else{
		deliberationNuit(message,joueurATuer);
	}
	
}

//fonction village
async function village_time(message){
	phaseVillage = true;

	
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
	
	if(!chasseur.estVivant && chasseur.peuxTuer){
		phaseChasseur = true;

		var timer = new time.Timer();

		message.channel.send("\n-------------------------------\nLe Chasseur à **30** secondes pour se venger !");
		await chasseur.idJoueur.send("Vous avez **30** secondes pour désigner quelqu'un à tuer (/kill [nom]) !");
		chasseur.idJoueur.send("/list");

		timer.start({countdown: true, startValues: {seconds: 30}});
		timer.addEventListener('secondsUpdated', function (e) {
				if (timer.getTimeValues().toString().split("0:00:")[1] % 10 == 0 && timer.getTimeValues().toString().split("0:00:")[1] != '00') {
					message.channel.send(timer.getTimeValues().toString().split("0:00:")[1] +" seconds left !");
				};
		});

			timer.addEventListener('targetAchieved', async function (e) {

				message.channel.send("**Fin du temps !\n**");

				chasseur.peuxTuer = false;
				
				if(chasseur.hasOwnProperty('aTue')){
					joueurATuer = chasseur.aTue;

					var retourKill = kill(chasseur.aTue, Players);
					message.channel.send("**"+joueurATuer.nom+"** a été éliminé.e!\nIl/Elle etait **"+joueurATuer.getRole()+"**");
					
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





