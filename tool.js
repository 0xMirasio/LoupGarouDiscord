module.exports = {

    knuthfisheryates : function(arr) {
    var i, temp, j, len = arr.length;
    for (i = 0; i < len; i++) {
        j = ~~(Math.random() * (i + 1));
        temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
},


annonceRole : function(tabJoueurs, PM) {
	for (i=0; i<tabJoueurs.length ; i++) {
        var playerToContact = tabJoueurs[i].nom
		for (j=0; j<PM.length; j++) {
			if (playerToContact == PM[j].author.username) {
                PM[j].author.send("-------------------DEBUT NOUVELLE PARTIE-------------------------");
                PM[j].author.send("/list");
				PM[j].author.send("Ton role est : " + tabJoueurs[i].role);
			}
		}
	}
},

annonceDesLoups : function(tabJoueurs, PM) {
    var fx = '';
    for (i=0; i<tabJoueurs.length ; i++) {

        var playerToContact = tabJoueurs[i].nom
        if (tabJoueurs[i].role == "Loup") {
            fx += playerToContact + ",";
       
        }
    }
    for (i=0; i<tabJoueurs.length ; i++) {
        var playerToContact = tabJoueurs[i].nom
        for (j=0; j<PM.length; j++) {
	    	if (playerToContact == PM[j].author.username && tabJoueurs[i].role == "Loup") {
		    	PM[j].author.send("Liste des loups : "+fx);
	    	}
        }
    }
},

//fonction pour cupidon
link : function(nomJoueur1, nomJoueur2, tabJoueurs){
	var cpt = 0;
	//On utilise le fait de pouvoir rajouter des attributs à la volée
	for(joueur in tabJoueur){
		if(joueur.nom == nomJoueur1 || joueur.nom == nomJoueur2){
			jouer.linked = 1;
			cpt++;
		}
	}
	if(cpt != 2){
		//Message d'erreur : 1 ou 2 joueur non existant(s)
	}
},

//initialise le tableau de vote et de aVoté pour n joueur
initVotes :function(n, votes, aVote){
	for(i=0;i<n;i++){
		votes.push(0);
		aVote.push(-1);
    }
    return votes,aVote;
},

//remise à 0 entre chaque tour
resetVotes: function(votes,aVote){
	for(i=0; i<votes.length; i++){
		votes[i]=0;
		aVote[i]=-1;
    }
    return votes,aVote;
},

//Fonction pour la voyante
reveal : function(nomJoueur, tabJoueurs){
    var role = null;
    for(i = 0; i<tabJoueurs.length;i++){
        if(tabJoueurs[i].nom == nomJoueur){
          role =  tabJoueurs[i].role;
        }
    }
    return role;
},

contains : function(nomJoueur, tabJoueurs){
    for(i = 0; i<tabJoueurs.length; i++){
        if(tabJoueurs[i].nom == nomJoueur){
            return true;
        }
    }
    return false;
},

loupkill : function(name,message, tabJoueurs) {
	for(i = 0; i<tabJoueurs.length; i++){
	   if (tabJoueurs[i].role == "Loup") {
		   message.author = tabJoueurs[i].idJoueur;
		   message.author.send("bite");
	   }
	   console.log(message.author.id)
	   message.author.id = tabJoueurs[0].idJoueur;
	   console.log(message.author.id)
    }
},

checkRole : function(nomJoueur, role, tabJoueurs){
    for(i = 0; i<tabJoueurs.length;i++){
        if(tabJoueurs[i].nom == nomJoueur && tabJoueurs[i].role == role){
           return i;
        }
    }
    return -1;
},
checkPlayer : function(name, tabJoueurs) {
    for(i = 0; i<tabJoueurs.length;i++){
        if(tabJoueurs[i].nom == name){
           return 1;
        }
    }
    return -1;
},

resultatVote : function(votes){
	max = 0;
	for(i=0; i<votes.length; i++){
		if(votes[i] > max){
			max = votes[i];
		}
	}
	return max;
},


containsIndice : function(nomJoueur, tabJoueurs){
	for(i = 0; i<tabJoueurs.length; i++){
        if(tabJoueurs[i].nom == nomJoueur){
            return i;
        }
    }
    return -1;
},

//fonction pour tuer en général (Loup, village, chasseur..)
kill : function(nomJoueur, tabJoueurs){
	index = containsIndice(nomJoueur, tabJoueurs);
	//Verifier index ?

	if(tabJoueurs[i].estVivant == 1){
		//On tue le joueur
		tabJoueurs[i].estVivant = 0;

		//On regarde si le joueur mort est lié à quelqu'un d'autre
		if(tabJoueurs[i].hasAttribute(linked)){
			for(joueur in tabJoueurs){
				if(joueur.hasAttribute(linked) && joueur.nom != nomJoueur){
					joueur.estVivant = 0;
				}
			}
		}
	}else{
		//Message d'erreur : joueur déjà mort
	}
},

retirerJoueur : function(nomJoueur, tabJoueurs){
    for(i = 0; i<tabJoueurs.length; i++){
        if(tabJoueurs[i].nom == nomJoueur){
            tabJoueurs.splice(i,1);
            return tabJoueurs;
        }
    }
    return 0;  
},

checkEgalite : function(max, votes){
    var index, cpt=0;
    for(i=0; i<votes.length; i++){
        if(votes[i] == max){
            index = i;
            cpt++;
        }
    }
    if(cpt == 1){
        return index;
    }
    return -1;
}

}