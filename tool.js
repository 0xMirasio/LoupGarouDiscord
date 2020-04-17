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


//-------------------ANNONCES --------------------//
annonceRole : function(tabJoueurs, PM) {
	for (i=0; i<tabJoueurs.length ; i++) {
        var playerToContact = tabJoueurs[i].nom
		for (j=0; j<PM.length; j++) {
			if (playerToContact == PM[j].author.username) {
                PM[j].author.send("-------------------DEBUT NOUVELLE PARTIE-------------------------");
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
            fx += "**"+playerToContact + "**   ";
       
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


//-------------------VOTES--------------------//

//initialise le tableau de vote et de aVoté pour n joueur
initVotes :function(n, votes, aVote){
	for(i=0;i<n;i++){
		votes.push(0);
		aVote.push(-1);
    }
    return [votes,aVote];
},

//remise à 0 entre chaque tour
resetVotes: function(votes,aVote){
	for(i=0; i<votes.length; i++){
		votes[i] = 0;
		aVote[i ]= -1;
    }
    console.log(votes+"  |  "+aVote);
    return [votes,aVote];
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



//-------------------FONCTION DIVERSES--------------------//

// //fonction pour cupidon
// link : function(nomJoueur1, nomJoueur2, tabJoueurs){
// 	var cpt = 0;
// 	//On utilise le fait de pouvoir rajouter des attributs à la volée
// 	for(joueur in tabJoueur){
// 		if(joueur.nom == nomJoueur1 || joueur.nom == nomJoueur2){
// 			jouer.linked = true;
// 			cpt++;
// 		}
// 	}
// },


//Fonction pour la voyante
reveal : function(nomJoueur, tabJoueurs){
    var role = null;
    for(i = 0; i<tabJoueurs.length;i++){
        if(tabJoueurs[i].nom == nomJoueur){
          role = tabJoueurs[i].role;
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
	   message.author.id = tabJoueurs[0].idJoueur;
    }
},

//Check si un joueur donné a le role "role"
//Renvoie l'indice du joueur dans le tableau de joueur si c'est le cas
//-1 sinon
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

existeRole : function(role,tabJoueurs){
    for(i=0;i<tabJoueurs.length;i++){
        if(tabJoueurs[i].role==role){
            return i;
        }
    }
    return -1;
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


containsIndice : function(nomJoueur, tabJoueurs){
	for(i = 0; i<tabJoueurs.length; i++){
        if(tabJoueurs[i].nom == nomJoueur){
            return i;
        }
    }
    return -1;
},

checkFinJeu : function(tabJoueurs){
    var nbLoup = 0, 
    nbVillageois = 0;
    for(i=0; i<tabJoueurs.length; i++){
        if(tabJoueurs[i].estVivant && tabJoueurs[i].role == "Loup"){
            nbLoup++;
        }else if(tabJoueurs[i].estVivant){
            nbVillageois++;
        }
    }

    if(nbLoup+nbVillageois == 0){
        return [true,2];
    }else if(nbLoup == 0){
        return [true,0];
    }else if(nbVillageois <= 1) {
        return [true,1];
    }

    return [false,0];
},

//-------------------GESTION ROLES--------------------//

//Ajoute le role aux roles choisis s'il existe et n'est déjà pas présent dans les roles choisis
//Renvoie les tableaux de role dispo et choisis modifiés ou non et un message sur le succès ou non de la fonction
ajouterRole : function(role, tabRolesDispo, tabRolesChoisis, nbSV){
    switch(role){
        case "Villageois" : 
            nbSV++;
            res = "Rôle correctement ajouté";
            break;
        default:
            var indexDispo = -1, indexChoisi = -1, res="";

            //On regarde si le role choisi existe en tant que role disponible
            for(i=0; i<tabRolesDispo.length;i++){
                if(tabRolesDispo[i]==role){
                    indexDispo = i;
                }
            }
            //On met le role dans roleschoisis et on le retire de roledispo
            if(indexDispo != -1){
                tabRolesChoisis.push(role);
                tabRolesDispo.splice(indexDispo,1);
                
                if(nbSV > 0){
                   nbSV--; 
                }
                res = "Rôle correctement ajouté";
            }
            else{
                //Sinon on regarde si le rôle à déja été choisi et on retourne un message d'erreur
                for(i=0; i<tabRolesChoisis.length;i++){
                    if(tabRolesChoisis[i]==role){
                        indexChoisi = i;
                    }
                }
        
                if(indexChoisi != -1){
                    res = "Rôle déjà choisi !";
                }else{
                    res = "Rôle inexistant, veuillez réessayer";
                }
            }
    } 
    return [tabRolesDispo, tabRolesChoisis, res, nbSV];    
},


//Supprime le role des roles choisi s'il existe
//Renvoie les tableaux de role dispo et choisis modifiés ou non et un message sur le succès ou non de la fonction
supprimerRole : function(role, tabRolesDispo, tabRolesChoisis, nbSV){
    switch(role){
        case "Villageois" : 
            if(nbSV > 0){
                nbSV--;
                res = "Rôle correctement supprimé";
            }else{
                res = "Vous ne pouvez pas supprimer plus de villageois";
            }
            
            break;
        default:
            var indexChoisi = -1, res="";

            //On regarde si le role choisi existe dans rolechoisi
            for(i=0; i<tabRolesChoisis.length;i++){
                if(tabRolesChoisis[i]==role){
                    indexChoisi = i;
                }
            }
            //On met le role dans rolesdispo et on le retire de rolechoisi
            if(indexChoisi != -1){
                tabRolesDispo.push(role);
                tabRolesChoisis.splice(indexChoisi,1);

                nbSV++;

                res = "Rôle correctement supprimé";
            }
            else{
                //Sinon on  retourne un message d'erreur
                    res = "Rôle non choisi ou inexistant, veuillez réessayer";
            }
    }
    return [tabRolesDispo, tabRolesChoisis, res, nbSV];    
},

//Renvoie un String affichant la liste des roles
toStringRoles: function(tabRolesChoisis, nbLoup, nbSV){
    var res ="";
    if(nbLoup > 0){
        res+= "Loup : x"+nbLoup;
    }
    if(nbSV > 0){
        res+= "\nVillageois : x"+nbSV;
    }
    for(i=0;i<tabRolesChoisis.length;i++){
        res+="\n"+tabRolesChoisis[i];
    }
    return res;
},

//met à jour le tableau de roles disponibles en fonction du tableau de roles déjà choisi
majRolesDispo : function(tabRolesDispo, tabRolesChoisis){
    for(i=0; i<tabRolesChoisis.length;i++){
       for(j=0;j<tabRolesDispo.length;i++){
           if(tabRolesChoisis[i] == tabRolesDispo[j]){
               tabRolesDispo.splice(j,1);
               break;
           }
       }
    }
},

toStringRolesDispo : function(tabRolesDispo){
    res="";
    for(i=0; i<tabRolesDispo.length;i++){
        res+=tabRolesDispo[i]+"  ";
    }
    return res;
}


}