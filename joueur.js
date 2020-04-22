const tool = require('./tool') ;

class Player{
	constructor(nom, id, role){
		this.nom = nom;
		this.idJoueur = id;
		this.estVivant = true;
        this.role = role || null;
        this.peuxAgir = false;
        this.tempsDeJeu = 20;
        // this.unique = false;
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
    
    action(message, params){
        this.idJoueur.send("Vous n'avez aucun pouvoir");
    }

   async sendMessageRole(){
        await this.idJoueur.send("Vous êtes : **"+this.getRole()+"**", {files : ["./img/"+this.getRole()+".png"] });
        await this.idJoueur.send("Votre but est d'éliminer tous les **Loup-Garou**.");
    }

    messageJoueur(){}

    messageChannel(){}

}


//--------------------------------
//|         VILLAGEOIS           |
//--------------------------------
class Villageois extends Player{
    constructor(nom,id){
        super(nom, id, "Villageois");
    }

}

//--------------------------------
//|         LOUP-GAROU           |
//--------------------------------
class LoupGarou extends Player{
    constructor(nom, id, votes, aVote){
        super(nom, id, "Loup-Garou");

        this.votes = votes || null;
        this.aVote = aVote || null;

        this.peuxManger = false;
    }

    async action(message,params){

        //Si le joueur est un loup, en vie, et que les loups peuvent voter
		if(params.length == 2 && this.estVivant && this.peuxManger && !this.hasOwnProperty("noctambule")){

			
            //Check que le joueur désigné existe 
            var nomJoueurDesigne = params[0];
            var tabJoueurs = params[1];

            var indexJoueurDesigne = tool.containsIndice(nomJoueurDesigne, tabJoueurs);
            if (indexJoueurDesigne == -1) {
                message.reply("Ce joueur n'existe pas !");
            //Check que le joueur désigné est en vie
            }else if(!tabJoueurs[indexJoueurDesigne].estVivant){
                message.reply("Ce joueur est déjà mort !");
            }else if(this.nom == nomJoueurDesigne){
                message.reply("Vous n'avez pas le droit de vous designer !");
            }else if(tabJoueurs[indexJoueurDesigne].role == "Loup-Garou"){
                message.reply("Vous n'avez pas le droit de désigner un autre Loup-Garou !");
            }else{
                //On vote pour le joueur désigné et on envoie un message aux autres loups
                
                await this.voter(this.nom, nomJoueurDesigne, tabJoueurs);
                
                message.reply("Vous souhaitez tuer **"+nomJoueurDesigne+"**");
                
                
                var nomAutreLoup = "";
                
                for (i=0; i<tabJoueurs.length; i++) {
                    if(tabJoueurs[i].role == "Loup-Garou" && tabJoueurs[i].nom != this.nom) {
                        nomAutreLoup = tabJoueurs[i].nom;
                        tabJoueurs[i].idJoueur.send("**"+this.nom +'** souhaite tuer **'+ nomJoueurDesigne+"**");
                    }
                }
            }
				
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
        }
        

    }

    messageJoueur(){
        var str="";
        if(this.hasOwnProperty("noctambule")){
            str+= "Vous n'avez pas vos pouvoirs cette nuit !\n";
        }else{
            str+= "Vous avez **"+this.tempsDeJeu+"** secondes pour désigner quelqu'un à tuer (/action [nom])";
        }
        return str;
    }

    messageChannel(){
        return "\n-------------------------------\nLes **Loup-Garou** ont **"+ this.tempsDeJeu +"** pour choisir leur victime...";
    }

    async sendMessageRole(){
        await this.idJoueur.send("Vous êtes : **"+this.getRole()+"**", {files : ["./img/"+this.getRole()+".png"] } );
        await this.idJoueur.send("Votre but est d'éliminer tous les **Villageois**.");
    }


    voter(nomVotant, nomVote, tabJoueurs){
        var votant = tool.containsIndice(nomVotant,tabJoueurs);
        var vote = tool.containsIndice(nomVote,tabJoueurs);
    
        //Si le joueur a déjà voté, on retire le vote précédent
        if(this.aVote[votant] != -1){
            this.votes[this.aVote[votant]]--;
        }
        
        //On incrémente ensuite le nombre de vote du joueur voté 
        this.votes[vote]++;
        //On met a jour aVoté
        this.aVote[votant] = vote;   
    }

}


//------------------------------
//|         CHASSEUR           |
//------------------------------
class Chasseur extends Player{
    constructor(nom, id){
        super(nom, id, "Chasseur");

        this.peuxAgir = true;
        this.aTue = null;
        
    }

    action(message, params){

        if(params.length == 2 && !this.estVivant && this.peuxAgir) {

            var nomJoueurDesigne = params[0];
            var tabJoueurs = params[1];

            var indexJoueurDesigne = tool.containsIndice(nomJoueurDesigne, tabJoueurs);

            if (indexJoueurDesigne == -1) {
                message.reply("Ce joueur n'existe pas !");
            //Check que le joueur désigné est en vie
            }else if(!tabJoueurs[indexJoueurDesigne].estVivant){
                message.reply("Ce joueur est déjà mort !");

            //Check que le joueur désigné n'est pas le chasseur
            }else if(this.nom == nomJoueurDesigne){
                message.reply("Vous n'avez pas le droit de vous designer");
            }else{
                this.aTue = tabJoueurs[indexJoueurDesigne];
                message.reply("Vous souhaitez tuer **"+nomJoueurDesigne+"**");
            }
        }else{
            message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
        }
    }

    messageJoueur(){
     
        return "Vous avez **"+this.tempsDeJeu+"** secondes pour désigner quelqu'un à tuer (/action [nom]) !";
        
    }

    messageChannel(){
        return "\n-------------------------------\nLe **Chasseur** à **"+this.tempsDeJeu+"** secondes pour se venger !";
    }

    
}


//-----------------------------
//|         VOYANTE           |
//-----------------------------

class Voyante extends Player{
    constructor(nom,id){
       super(nom,id,"Voyante");

        this.dejaVu = []; //Tableau pour stocker les joueurs dont les rôles sont déjà connus par la voyante
        this.dejaVu.push(this);
    }

    action(message, params){

        if (params.length == 2 && this.estVivant && this.peuxAgir && !this.hasOwnProperty("noctambule")){
            var nomJoueurDesigne = params[0],
                tabJoueurs = params[1];

                var indexJoueurDesigne = tool.containsIndice(nomJoueurDesigne, tabJoueurs);

                if (indexJoueurDesigne == -1) {
                    message.reply("Ce joueur n'existe pas !");
                }else if (this.dejaVu.includes(tabJoueurs[indexJoueurDesigne])) {
                        message.reply("Vous connaissez déjà le rôle de ce joueur");	
                //Check que le joueur désigné est en vie
                }else if(!tabJoueurs[indexJoueurDesigne].estVivant){
                    message.reply("Ce joueur est mort !");
                }else{
                    message.reply("**"+nomJoueurDesigne+"** est : **"+tabJoueurs[indexJoueurDesigne].getRole()+"**", {files : ["./img/"+tabJoueurs[indexJoueurDesigne].getRole()+".png"] } );
                    this.dejaVu.push(tabJoueurs[indexJoueurDesigne]);
                    this.peuxAgir = false;
                }
        }else{
            message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
        }
            
    }

    messageJoueur(){

        var str="";
        if(this.hasOwnProperty("noctambule")){
            str+= "Vous n'avez pas vos pouvoirs cette nuit !\n";
        }else{
            str+= tool.roleDejaVu(this);
            str+= "\nVous avez **"+this.tempsDeJeu+"** secondes pour révéler le rôle d'une personne (/action [nom)!";;
        }

        return str;
    }

    messageChannel(){
        return "\n-------------------------------\nLa **Voyante** a **"+this.tempsDeJeu+"** secondes pour reveler une personne...";
    }


}



//-----------------------------
//|         CUPIDON           |
//-----------------------------

class Cupidon extends Player{
    constructor(nom,id){
        super(nom,id,"Cupidon");

        this.tempsDeJeu = 40;
        this.unique = true;
        this.amoureux = null;
    }

    action(message, params){

        if(params.length == 3 && this.estVivant && this.peuxAgir){

			var joueur1 = params[0];
            var joueur2 = params[1];
            var tabJoueurs = params[2];
			var index1 = tool.containsIndice(joueur1, tabJoueurs);
			var index2 = tool.containsIndice(joueur2, tabJoueurs);

			if (index1 == -1 || index2 == -1) {
				message.reply("Un des joueurs n'existe pas !");
			}
			else {
				this.peuxLier = false;	
				tabJoueurs[index1].linked = true;
				tabJoueurs[index2].linked = true;

				tabJoueurs[index1].idJoueur.send("Vous êtes amoureux avec **"+tabJoueurs[index2].nom+"**");
				tabJoueurs[index2].idJoueur.send("Vous êtes amoureux avec **"+tabJoueurs[index1].nom+"**");
				
				if( (tabJoueurs[index1].role == "Loup-Garou" && tabJoueurs[index2].role != "Loup-Garou") 
					|| (tabJoueurs[index2].role == "Loup-Garou" && tabJoueurs[index1].role != "Loup-Garou") ){

					tabJoueurs[index1].idJoueur.send("Vos condition de victoire ont changé. Vous et **"+tabJoueurs[index2].nom+"** devez rester en vie et éliminer tout le monde");
					tabJoueurs[index2].idJoueur.send("Vos condition de victoire ont changé. Vous et **"+tabJoueurs[index1].nom+"** devez rester en vie et éliminer tout le monde");
				}

				this.amoureux.push(tabJoueurs[index1]);
				this.amoureux.push(tabJoueurs[index2]);

				message.reply("Vous venez de lier **"+joueur1+"** et **"+joueur2+"**");
			}
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}
            
    }

    messageJoueur(){
        return "Vous avez **"+this.tempsDeJeu+"** secondes pour désigner 2 joueurs à lier (/action [nom1] [nom2]) !";
    }

    messageChannel(){
        return "\n-------------------------------\n**Cupidon** à **"+this.tempsDeJeu+"** secondes pour sélectionner 2 personnes dont le destin sera lié pour le reste de la partie !";
    }


}


//-----------------------------
//|         SORCIERE          |
//-----------------------------

class Sorciere extends Player{
    constructor(nom, id){
        super(nom, id, "Sorciere");

        this.peuxTuer = true;
        this.peuxSauver = true;
        this.aTue = null;
        this.joueurATuer = null;
    }

    action(message, params){

        console.log(params.length);
            if(params[0] == "save" && params.length == 2){
                this.save();
            }else if(params.length == 2){
                var nomJoueurDesigne = params[0];
                var tabJoueurs = params[1];
                this.curse(nomJoueurDesigne,tabJoueurs);
            }else{
                message.reply("Mauvais usage de la commande");
            }
        
    }

    save(){
        if(this.estVivant && this.peuxAgir && this.peuxSauver && this.joueurATuer != null && !this.hasOwnProperty("noctambule")){
			this.peuxSauver = false;
			this.joueurATuer.estSauve = true;
			this.idJoueur.send("Vous venez de sauver **"+ this.joueurATuer.nom+"**");
		}else{
			this.idJoueur.send("Vous n'avez pas le droit d'utilser cette commande !");
		}
    }

    curse(nomJoueurDesigne, tabJoueurs){

        //Si la sorcière est vivante, qu'elle peut agir et tuer
		if(this.estVivant && this.peuxAgir && this.peuxTuer && !this.hasOwnProperty("noctambule")){

			var index = tool.containsIndice(nomJoueurDesigne, tabJoueurs);
			if (index == -1) {
				this.idJoueur.send("Ce joueur n'existe pas !");
			}else if(this.nom == nomJoueurDesigne){
				this.idJoueur.send("Vous ne pouvez pas vous tuer !");
			//Check que le joueur désigné est en vie
			}else if(!tabJoueurs[index].estVivant){
				this.idJoueur.send("Ce joueur est mort !");
			}else{
				this.aTue = tabJoueurs[index];
				this.peuxTuer = false;
				this.idJoueur.send("Vous venez de tuer **"+ nomJoueurDesigne+"**");
			}
		}else{
			this.idJoueur.send("Vous n'avez pas le droit d'utilser cette commande !");
        }	
        
    }

    messageJoueur(){
        if(this.hasOwnProperty("noctambule")){
            return "Vous n'avez pas vos pouvoirs cette nuit !\n";
        }else{
            var str = "Vous avez **"+this.tempsDeJeu+"** secondes pour utiliser vos pouvoirs !";
            if (  (this.joueurATuer == null || this.joueurATuer.hasOwnProperty('estSauve')) && this.peuxTuer) {
				str +="\nPersonne n'a été désigné par les loups. Vous pouvez utilisez votre potion de mort (/action [nom]) ou ne rien faire";
			}
			else if(this.joueurATuer != null && this.peuxSauver) {	
				str+="\n**"+this.joueurATuer.nom +"** a été désigné par les loups, Vous pouvez utilisez votre potion de mort (/action [nom]) sur quelqu'un ou sauver **"+this.joueurATuer.nom + "** (/action save)";
			
			}else if(this.peuxTuer){
				str+="\nVous pouvez utilisez votre potion de mort (/action [nom]) ou ne rien faire";
			}else{
                str+="\nVous ne pouvez rien faire cette nuit";
            }
            return str;
        }
    }

    messageChannel(){
        return "\n-------------------------------\nLa **Sorcière** à **"+this.tempsDeJeu+"** secondes pour utiliser ses pouvoirs !";
    }

}


//-----------------------------
//|         SALVATEUR         |
//-----------------------------
class Salvateur extends Player{
    constructor(nom, id){
        super(nom,id,"Salvateur");

        this.dernierJoueurSauve = null;
    }


    action(message, params){

        if (params.length == 2 && this.estVivant && this.peuxAgir && !this.hasOwnProperty("noctambule")){
            var nomJoueurDesigne = params[0],
            tabJoueurs = params[1];

            var indexJoueurDesigne = tool.containsIndice(nomJoueurDesigne, tabJoueurs);

            if (indexJoueurDesigne == -1) {
                message.reply("Ce joueur n'existe pas !");
            }else if(!tabJoueurs[indexJoueurDesigne].estVivant){
                message.reply("Ce joueur est mort");
            }else if(this.dernierJoueurSauve == tabJoueurs[indexJoueurDesigne]){
                message.reply("Vous ne pouvez pas protéger le même joueur 2 fois de suite");
            }else{
                tabJoueurs[indexJoueurDesigne].estSauve = true;
                this.dernierJoueurSauve = tabJoueurs[indexJoueurDesigne];
                message.reply("Vous avez décidé de protéger **"+this.dernierJoueurSauve.nom+"**");
            }

        }else{
            message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
        }
    
    }

    messageJoueur(){
        if(this.hasOwnProperty("noctambule")){
            return "Vous n'avez pas vos pouvoirs cette nuit !\n";
        }else{
            return "Vous avez **"+this.tempsDeJeu+"** secondes pour choisir quelqu'un à protéger (/action [nom]) !";
        }
    }

    messageChannel(){
        return "\n-------------------------------\nLe **Salvateur** à **"+this.tempsDeJeu+"** secondes pour choisir une personne à protéger !";
    }


    resetSalvateur(){
        if(this.dernierJoueurSauve != null && this.dernierJoueurSauve.hasOwnProperty("estSauve"))
            delete this.dernierJoueurSauve.estSauve;      
    }

}

//-----------------------------
//|         NOCTAMBULE        |
//-----------------------------
class Noctambule extends Player{
    constructor(nom, id){
        super(nom, id, "Noctambule");

        this.dernierJoueurVisite = null; //Variable pour stocker le dernier joueur auquel le noctambule a rendu visite
    }

    action(message, params){

        if (params.length == 2 && this.estVivant && this.peuxAgir){
            var nomJoueurDesigne = params[0],
            tabJoueurs = params[1];
           
            var indexJoueurDesigne = tool.containsIndice(nomJoueurDesigne, tabJoueurs);

			if (indexJoueurDesigne == -1) {
				message.reply("Ce joueur n'existe pas !");
			}
			//Check que le joueur désigné est en vie
			else if(!tabJoueurs[indexJoueurDesigne].estVivant){
				message.reply("Ce joueur est mort");
			}else if(this.dernierJoueurVisite == tabJoueurs[indexJoueurDesigne]){
				message.reply("Vous ne pouvez pas dormir chez le même joueur 2 fois de suite");
			}else if(this.nom == nomJoueurDesigne){
				message.reply("Vous ne pouvez pas dormir chez vous !");
			}else{
				this.peuxDormir = false;
				this.dernierJoueurVisite = tabJoueurs[indexJoueurDesigne];

				this.idJoueur.send("Vous allez dormir chez **"+nomJoueurDesigne+"**");
				tabJoueurs[indexJoueurDesigne].idJoueur.send("**"+this+"** vient dormir chez vous. Vous serez privé.e de vos pouvoirs cette nuit");
				
				tabJoueurs[indexJoueurDesigne].noctambule = true;
			}
        }else{
            message.reply("Vous n'avez pas le droit d'utilisez cette commande ! ");
        }
    }

    messageJoueur(){
        return "Vous avez **"+this.tempsDeJeu+"** secondes pour choisir chez qui aller dormir (/action [nom]) !";  
    }

    messageChannel(){
        return "\n-------------------------------\nLe **Noctambule** à **"+this.tempsDeJeu+"** secondes pour décider chez qui il va aller dormir! Cette personne sera privée de ses pouvoirs pour la nuit";
    }

    resetNoctambule(){
        if(this.dernierJoueurVisite != null){
            if(this.dernierJoueurVisite.hasOwnProperty("noctambule")){
                delete this.dernierJoueurVisite.noctambule;
            }else{
                this.dernierJoueurVisite = null;
            }
        }
    }

}


//----------------------------------
//|        LOUP-GAROU BLANC        |
//----------------------------------

class LoupGarouBlanc extends LoupGarou{
    constructor(nom, id){
        super(nom, id);

        this.aTueLoup = null;
        this.subRole = "Loup_garou_blanc";
        this.getRole = function(){return this.subRole};
        this.tabJoueurs = null;
    }

    action(message, params){
			
			if(params.length == 2 && this.estVivant && (this.peuxAgir || this.peuxManger) && !this.hasOwnProperty("noctambule") ){

                if(this.peuxManger){
                    super.action(message,params);
                }else{
                    this.mangerLoup(message,params);
                }            
			}else{
				message.reply("Vous n'avez pas le droit d'utilser cette commande !");
			}    
    }

    messageJoueur(){
        var str ="";

        if(this.peuxManger){
            str+= super.messageJoueur();
        }else{
            if(this.hasOwnProperty("noctambule") ){
                str += "Vous n'avez pas vos pouvoirs cette nuit !";
            }else{
                str+= this.idJoueur.send(tool.getLoupsGarou(this.tabJoueurs));
                str+= "\nVous avez **"+this.tempsDeJeu+"** pour tuer ou non un **Loup-Garou** (/action [nom])!";   
            }
        }
        
        return str;
    }

    messageChannel(){
        if(this.peuxManger){
            return super.messageChannel();
        }
       return "\n-------------------------------\nLe **Loup-Garou Blanc** a **"+this.tempsDeJeu+"** pour tuer un loup...";
    }

    async sendMessageRole(){
        await this.idJoueur.send("Vous êtes : **"+this.getRole()+"**", {files : ["./img/"+this.getRole()+".png"] });
        await this.idJoueur.send("1 tour sur 2, vous pouvez éliminer un autre **Loup-Garou**.\nVotre but est d'être le dernier en vie.");
    }


    mangerLoup(message, params){
        var loupDesigne = params[0];
        var tabJoueurs = params[1];
        var indexLoupDesigne = tool.containsIndice(loupDesigne, tabJoueurs);

        if (indexLoupDesigne == -1) {
            message.reply("Ce joueur n'existe pas !");
        }else if(tabJoueurs[indexLoupDesigne].role != "Loup-Garou"){
            message.reply("Ce joueur n'est pas un loup !");
        }else if(!tabJoueurs[indexLoupDesigne].estVivant){
            message.reply("Ce Loup est mort !");
        }else if(this.nom == loupDesigne){
            message.reply("Vous n'avez pas le droit de vous designer !");
        }else{
            this.aTueLoup = tabJoueurs[indexLoupDesigne];
            this.peuxAgir = false;
            message.reply("Vous avez tué **"+loupDesigne+"**");
        }
    }

}


//----------------------------
//|        ANGE DECHU        |
//----------------------------

class AngDechu extends Player{
    constructor(nom,id){
        super(nom, id, "Ange_dechu");
     
        this.peuxGagner = false;
    }

    checkVictoire(joueurATuer){
        if(this == joueurATuer && !this.estVivant){
            this.peuxGagner = true;
        }else{
            this.subRole = this.role;
            this.role = "Villageois";
            this.getRole = function() {return this.subRole};
            this.idJoueur.send("Vos conditions de victoire ont changé, vous êtes devenu **Villageois**.\nVotre but est d'éliminer tous les **Loup-Garou**");
        }
    }

    async sendMessageRole(){ 
        await this.idJoueur.send("Vous êtes : **"+this.role+"**", {files : ["./img/"+this.role+".png"] });
        await this.idJoueur.send("Votre but est de vous faire éliminer par les villageois lors du 1er vote.");
    }

}


//----------------------------
//|        CHIEN-LOUP        |
//----------------------------

class ChienLoup extends LoupGarou{
    constructor(nom, id){
        super(nom, id);
        this.role = "Villageois";
        this.tempsDeJeu = 20;
        this.subRole = "Chien-loup";				
        this.getRole = function() {return this.subRole};
    }

    action(message, params){
        if(params.length == 2 && this.estVivant && (this.peuxAgir || this.peuxManger) ){

            if(this.peuxManger){
                super.action(message,params);
            }else{
                this.changerRole(message,params);
            }
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}
    }

    changerRole(message, params){
        if(params[0] == "change"){
            var tabJoueurs = params[1];
            
            this.idJoueur.send("Vos conditions de victoire ont changé, Vous êtes devenu un **Loup-Garou**.\nVotre but est d'éliminer tous les **Villageois**");
            this.role = "Loup-Garou";
            this.tempsDeJeu = 30;
            tool.annonceDesLoups(tabJoueurs);
           
        }else{
            message.reply("Mauvais usage de la commande !");
        }
    }


    messageJoueur(){
        if(this.peuxManger){
            return super.messageJoueur();
        }

        return "Vous avez **"+this.tempsDeJeu+"** secondes pour choisir entre rester **Villageois** (ne rien faire) ou devenir un **Loup-Garou** (/action change)"  }
        

    messageChannel(){
        if(this.peuxManger){
            return super.messageChannel();
        }
        return "\n-------------------------------\nLe **Chien-Loup** a **"+this.tempsDeJeu+"** secondes pour choisir son camp";
    }

    async sendMessageRole(){
        await this.idJoueur.send("Vous êtes : **"+this.getRole()+"**", {files : ["./img/"+this.getRole()+".png"] } );
        await this.idJoueur.send("Votre but est d'éliminer tous les **Loup-Garou**.");
    }
    
}


//--------------------------------
//|        ENFANT SAUVAGE        |
//--------------------------------
class EnfantSauvage extends LoupGarou{
    constructor(nom,id){
        super(nom, id);

        this.role = "Villageois";
        this.subRole ="Enfant-sauvage";
        this.getRole = function(){return this.subRole};
        this.joueurModele = null;
    }

    action(message, params){

        if(params.length == 2 && this.estVivant && (this.peuxAgir || this.peuxManger) ){
            
            if(this.peuxManger){
                super.action(message,params);
            }else{ 
                this.choisirModele(message,params)
            }
		}else{
			message.reply("Vous n'avez pas le droit d'utilser cette commande !");
		}
    }

    choisirModele(message,params){
        var nomJoueurDesigne = params[0]; 
        var tabJoueurs = params[1];
        var indexJoueurDesigne = tool.containsIndice(nomJoueurDesigne, tabJoueurs);

        if (indexJoueurDesigne == -1) {
            message.reply("Ce joueur n'existe pas !");
        }else if(!tabJoueurs[indexJoueurDesigne].estVivant){
            message.reply("Ce joueur est mort !");
        }else if(tabJoueurs.nom == nomJoueurDesigne){
            message.reply("Vous n'avez pas le droit de vous prendre comme modèle !");
        }else{
            this.joueurModele = tabJoueurs[indexJoueurDesigne];
            this.peuxAgir = false;
            message.reply("Vous avez choisi **"+nomJoueurDesigne+"** comme joueur modèle.\nS'il meurt vous deviendrez **Loup-Garou**");
        }    
    }

    messageJoueur(){
        if(this.peuxManger){
            return super.messageJoueur();
        }
        return "Vous avez **"+this.tempsDeJeu+"** secondes pour choisir un joueur qui sera votre modèle (/action [nom]). A sa mort, vous deviendrez **Loup-Garou** !";
    }

    messageChannel(){
        if(this.peuxManger){
            return super.messageChannel();
        }
        return "\n-------------------------------\nL'**Enfant sauvage** à **"+this.tempsDeJeu+"** secondes pour sélectionner 1 joueur qui deviendra son modèle !";
    }

    async sendMessageRole(){
        await this.idJoueur.send("Vous êtes : **"+this.getRole()+"**", {files : ["./img/"+this.getRole()+".png"] } );
        await this.idJoueur.send("Votre but est d'éliminer tous les **Loup-Garou**.");
    }

    checkModele(tabJoueurs){
        if( this.joueurModele != null && !this.joueurModele.estVivant){
            this.role = "Loup-Garou";
            this.idJoueur.send("Vos conditions de victoire ont changé. Votre modèle est mort et vous êtes devenu un **Loup-Garou**.\nVotre but est d'éliminer tous les **Villageois**");
            tool.annonceDesLoups(tabJoueurs);
        }
    }
}


//---------------------------------------
//|        INFECT PERE DES LOUPS        |
//---------------------------------------

class InfectPereDesLoups extends LoupGarou{
    constructor(nom,id){
        super(nom, id);
        
        this.subRole ="Infect_pere_des_loups";
        this.getRole = function(){return this.subRole};

        this.tempsDeJeu = 20;
        this.peuxInfecter = true;
        this.joueurInfecte = null;
        this.joueurATuer = null
    }

    action(message, params){
            
        if(this.peuxManger){
            super.action(message,params);
        }else{ 
            this.infecter(message,params);
        }
        
    }

    infecter(message,params){

        if(params.length == 1 && this.estVivant && (this.peuxAgir && this.peuxInfecter)  && this.joueurATuer != null && !this.hasOwnProperty("noctambule")){
                    
            this.joueurInfecte = this.joueurATuer;
            this.joueurInfecte.estInfecte = true;
            this.peuxInfecter = false;
            message.reply("Vous avez infecté **"+this.joueurATuer.nom+"**");
            
        }else{
            message.reply("Vous n'avez pas le droit d'utilser cette commande !");
        }
        
    }

    infecteDeviensLG(tabJoueurs){
        
        this.joueurInfecte.subRole = this.joueurInfecte.role;
        this.joueurInfecte.role = "Loup-Garou";
        this.joueurInfecte.getRole = function(){return this.subRole};
        this.joueurInfecte.votes = this.votes;
        this.joueurInfecte.aVote = this.aVote;
        this.joueurInfecte.peuxManger = false;

        this.joueurInfecte.newAction = this.action;
        this.joueurInfecte.newMessageJoueur = this.messageJoueur;
        this.joueurInfecte.newMessageChannel = this.messageChannel;
        

        this.joueurInfecte.oldAction = this.joueurInfecte.action;
        this.joueurInfecte.oldMessageJoueur = this.joueurInfecte.messageJoueur;
        this.joueurInfecte.oldMessageChannel = this.joueurInfecte.messageChannel;

        this.joueurInfecte.action = function(message, params){
            if(this.peuxManger){
                this.newAction(message,params);
            }else{
                this.oldAction(message,params);
            }
        }
    
        this.joueurInfecte.messageJoueur = function(){
            if(this.peuxManger){
                return this.newMessageJoueur();
            }
            return this.oldMessageJoueur();
        }
            
    
        this.joueurInfecte.messageChannel = function (){
            if(this.peuxManger){
                return this.newMessageChannel();
            }
            return this.oldMessageChannel();
        }

        this.joueurInfecte.voter = this.voter;

        this.joueurInfecte.idJoueur.send("Vos conditions de victoire ont changé. Vous êtes à présent un **Loup-Garou**.\nVous conservez vos pouvoirs si vous en aviez et pouvez toujours les utilisers");
        tool.annonceDesLoups(tabJoueurs);
        delete this.joueurInfecte.estInfecte;

    }
    

    messageJoueur(){
        if(this.peuxManger){
            return super.messageJoueur();
        }else{
            if(this.joueurATuer != null && this.peuxInfecter){
                return "Vous avez **"+this.tempsDeJeu+"** secondes pour infecter ou non **"+ this.joueurATuer.nom +"** (/action ).\n S'il n'est pas protégé et qu'il survit cette nuit, il deviendra un **Loup-Garou**!";
            }else{
                return "Vous ne pouvez rien faire cette nuit";
            }
        }
        
    }

    messageChannel(){
        if(this.peuxManger){
            return super.messageChannel();
        }
        return "\n-------------------------------\nL'**Infect père des loups** à **"+this.tempsDeJeu+"** secondes pour infecter le joueur désigné par les loups !";
    }
}

exports.Player = Player;
exports.Villageois = Villageois;
exports.LoupGarou = LoupGarou;
exports.Chasseur = Chasseur;
exports.Voyante = Voyante;
exports.Cupidon = Cupidon;
exports.Sorciere = Sorciere;
exports.Salvateur = Salvateur;
exports.Noctambule = Noctambule;
exports.LoupGarouBlanc = LoupGarouBlanc;
exports.AngDechu = AngDechu;
exports.ChienLoup = ChienLoup;
exports.EnfantSauvage = EnfantSauvage;
exports.InfectPereDesLoups = InfectPereDesLoups;