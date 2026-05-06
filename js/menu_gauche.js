//=================================================================================================================================================================
// GESTION DU MENU DEROULANT
//=================================================================================================================================================================

//FONCTION POUR OUVRIR LE MENU DEROULANT A GAUCHE ------------------------------------------------------------------------------------------------------------------

const menu_listes = document.querySelector(".menu_listes");
const button_menu_gauche = document.querySelector(".button_menu_gauche");

button_menu_gauche.addEventListener("click", () => {
    menu_listes.classList.toggle("menu_open");
})




//FONCTION POUR OUVRIR/FERMER LES LISTES DANS LE MENU DEROULANT ------------------------------------------------------------------------------------------------------------

const btn_sec_menu = document.querySelectorAll(".btn-section-menu");
const menu_sec = document.querySelectorAll(".menu_deroulant_gauche > section");

btn_sec_menu.forEach(btn => {
    btn.addEventListener("click", () => {
        // On enlève la classe active de tous les boutons et on la met sur celui cliqué
        btn_sec_menu.forEach(e => e.classList.remove("btn_open"));
        btn.classList.add("btn_open");

        const nom_onglet = btn.textContent.trim(); //recupère le nom du menu qu'on a cliqué en supprimant les espaces avec trim();

        if (nom_onglet === "Matières" || nom_onglet === "Historique des placements") {
            ouvrir_details_liste(nom_onglet); // Appelle la super-fonction
            return; // On arrête là !
        }

        // Comportement classique pour Etudiants et Salles
        menu_sec.forEach(sec => {
            if (sec.classList.contains(btn.dataset.sec)) sec.classList.add("sec_open");
            else sec.classList.remove("sec_open");
        });
    });
});




//FONCTION POUR CREER LES BLOCS DANS LE MENU --------------------------------------------------------------------------------------------------------------------------------

function bloc_listes(liste) {
    let bloc_el = document.createElement("li");
    bloc_el.dataset.name = liste;

    bloc_el.innerHTML = `
        <div class="nom_element">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.5613 10.7815C20.8422 11.0628 21 11.444 21 11.8415C21 12.239 20.8422 12.6203 20.5613 12.9015L14.9053 18.5605C14.6239 18.8419 14.2423 19 13.8443 19C13.4464 19 13.0647 18.8419 12.7833 18.5605C12.5019 18.2791 12.3438 17.8975 12.3438 17.4995C12.3438 17.1016 12.5019 16.7199 12.7833 16.4385L15.8793 13.3415H4.34432C3.9465 13.3415 3.56497 13.1835 3.28366 12.9022C3.00236 12.6209 2.84432 12.2393 2.84432 11.8415C2.84432 11.4437 3.00236 11.0622 3.28366 10.7809C3.56497 10.4996 3.9465 10.3415 4.34432 10.3415H15.8793L12.7833 7.24552C12.644 7.10619 12.5335 6.94078 12.4581 6.75873C12.3827 6.57668 12.3438 6.38157 12.3438 6.18452C12.3438 5.98747 12.3827 5.79236 12.4581 5.61031C12.5335 5.42826 12.644 5.26285 12.7833 5.12352C12.9227 4.98419 13.0881 4.87366 13.2701 4.79826C13.4522 4.72285 13.6473 4.68404 13.8443 4.68404C14.0414 4.68404 14.2365 4.72285 14.4185 4.79826C14.6006 4.87366 14.766 4.98419 14.9053 5.12352L20.5613 10.7815Z" fill="#FBFDFF"/>
            </svg>
            <span class="nom_texte"></span>
        </div>
        <div class="ul_icons">
            <svg class="trash_element" width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="cursor:pointer;">
                <path d="M5.33333 9.33333H26.6667M13.3333 14.6667V22.6667M18.6667 14.6667V22.6667M6.66666 9.33333L7.99999 25.3333C7.99999 26.0406 8.28095 26.7189 8.78104 27.219C9.28114 27.719 9.95942 28 10.6667 28H21.3333C22.0406 28 22.7188 27.719 23.2189 27.219C23.719 26.7189 24 26.0406 24 25.3333L25.3333 9.33333M12 9.33333V5.33333C12 4.97971 12.1405 4.64057 12.3905 4.39052C12.6406 4.14048 12.9797 4 13.3333 4H18.6667C19.0203 4 19.3594 4.14048 19.6095 4.39052C19.8595 4.64057 20 4.97971 20 5.33333V9.33333" stroke="#FBFDFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg class="rename_element" width="28" height="28" viewBox="0 0 50 41" fill="none" xmlns="http://www.w3.org/2000/svg" style="cursor:pointer;">
                <path d="M31.25 24.3333L22.9167 32.6667H43.75V24.3333H31.25ZM25.125 5.97915L6.25 24.8541V32.6667H14.0625L32.9375 13.7916L25.125 5.97915ZM38.9792 7.74998C39.7917 6.93748 39.7917 5.58332 38.9792 4.81248L34.1042 -0.0625169C33.7138 -0.45054 33.1858 -0.668335 32.6354 -0.668335C32.085 -0.668335 31.557 -0.45054 31.1667 -0.0625169L27.3542 3.74998L35.1667 11.5625L38.9792 7.74998Z" fill="#FBFDFF"/>
            </svg>
        </div>
    `;

    bloc_el.querySelector('.nom_texte').textContent = liste;
    return bloc_el;
}





// FONCTION POUR AFFICHER LES LISTES DANS LE MENUS ----------------------------------------------------------------------------------------------------------------------
function afficher_listes() {
    // 1. On vide l'affichage actuel via les variables globales
    if (conteneur_etu_ul) conteneur_etu_ul.innerHTML = "";
    if (conteneur_salle_ul) conteneur_salle_ul.innerHTML = "";

    // 2. On injecte les étudiants
    tab_etu.forEach(liste => {
        const nom = liste.nom_fichier || "Liste sans nom";
        const li = bloc_listes(nom);
        if (conteneur_etu_ul) conteneur_etu_ul.appendChild(li);
    });

    // 3. On injecte les salles
    tab_salles.forEach(liste => {
        const nom = liste.nom_salle || "Salle sans nom";
        const li = bloc_listes(nom);
        if (conteneur_salle_ul) conteneur_salle_ul.appendChild(li);
    });
}

// Appel initial au chargement de la page pour afficher ce qui est dans le LocalStorage
document.addEventListener("DOMContentLoaded", () => {
    afficher_listes();
});




// Variables global pour l'édition
let section_precedente; 
let mode_edition = ""; 
let type_edition = ""; 
let index_edition = -1; 
let ancien_nom_liste = ""; 

// ECOUTEUR GLOBAL DES CLICS DU MENU -----------------------------------------------------------
document.addEventListener("click", (e) => {
    
    // OUVRIR UNE SOUS-LISTE
    if (e.target.classList.contains("nom_texte")) {
        const li = e.target.closest("li");
        section_precedente = e.target.closest("section"); 
        ouvrir_details_liste(li.dataset.name);
    }
    
    // CLIC SUR BOUTON RETOUR
    else if (e.target.closest(".return_sec")) {
        fermer_formulaire(section_precedente);
    }

    // CLIC SUR SUPPRIMER
    else if (e.target.closest(".trash_element")) {
        supprimer(e.target.closest(".trash_element")); 
    }

    // CLIC SUR MODIFIER
    else if (e.target.closest(".rename_element")) {
        const bloc = e.target.closest(".bloc_element"); 
        const liListe = e.target.closest(".menu_ul > li"); 
        
        if (bloc) {
            index_edition = parseInt(bloc.dataset.index, 10);
            mode_edition = "modifier";
            edition_formulaire();
        } else if (liListe) {
            const isEtu = e.target.closest(".etu_sec") !== null;
            type_edition = isEtu ? "nom_liste_etu" : "nom_liste_salle";
            index_edition = Array.from(liListe.parentNode.children).indexOf(liListe);
            ancien_nom_liste = liListe.dataset.name;
            mode_edition = "modifier_liste";
            edition_formulaire();
        }
    }

    // CLIC POUR AJOUTER
    else if (e.target.closest(".btn_ajouter")) {
        mode_edition = "ajouter";
        index_edition = -1;
        edition_formulaire();
    }
    
    // CLIC POUR ANNULER l'EDITION
    else if (e.target.id === "edition_annul") {
        edition_erreur.textContent = "";
        const selecteur_retour = CONFIG_SECTION[type_edition].section_retour;
        fermer_formulaire(document.querySelector(selecteur_retour));
    }
});



// AFFICHER LES DÉTAILS D'UNE LISTE DANS LE MENU -------------------------------------------------------------------------------------------------------------------------------
function ouvrir_details_liste(nom_cible) {
    let typeListe = "";
    let elementsArray = [];

    if (nom_cible === "Matières") {
        typeListe = "matiere";
        elementsArray = tab_matiere;
    } else if (nom_cible === "Historique des placements") {
        typeListe = "historique";
        elementsArray = tab_placer;
    } else {
        let liste_select = getListeEtu(nom_cible);
        if (liste_select) {
            typeListe = "etu";
            elementsArray = liste_select.donnees;
        } else {
            liste_select = getListeSalle(nom_cible);
            if (liste_select) {
                typeListe = "salle";
                elementsArray = liste_select.places;
            }
        }
    }

    if (!elementsArray) return;

    const regles = CONFIG_SECTION[typeListe]; // Récupère les règles

    sec_first.style.display = (typeListe === "etu" || typeListe === "salle") ? "flex" : "none";
    
    conteneur_search_bar.style.display = regles.affichage.recherche ? "flex" : "none";
    if (regles.affichage.recherche && search_input_etu) search_input_etu.value = "";
         
    btn_ajouter.dataset.source = nom_cible;
    btn_ajouter.style.display = regles.affichage.bouton_ajout ? "flex" : "none";
    
    label_nom_liste.textContent = nom_cible;
         
    conteneur_liste_elements.innerHTML = "";

    elementsArray.forEach((item, index) => {
        let classes = regles.affichage.ligne_simple ? "bloc_element ligne_simple" : "bloc_element";
        let li_val = `<ul class="${classes}" data-index="${index}">`;
        
        if (typeListe === "matiere") {
            li_val += `<li>${item}</li>`;
        } else if (typeListe === "historique") {
            li_val += `<li>${item.titre || "Placement n°" + (index+1)}</li>`;
        } else {
            Object.keys(item).forEach(key => {
                if (key !== "tiers_temps" && key !== "indisponible") {
                    li_val += `<li>${item[key]}</li>`;
                }
            });
            if (typeListe === "etu") {
                const estCoche = item.tiers_temps ? "checked" : "";
                li_val += `<li>
                    <label class="badge-checkbox" style="--checkcolor: none">
                        <input type="checkbox" class="check_tier" ${estCoche}>
                        <span class="badge-text">Tiers-temps</span>
                        <span class="custom-checkbox"></span>
                    </label>
                </li>`;
            } else {
                const estCoche = item.indisponible ? "checked" : "";
                li_val += `<li>
                    <label class="badge-checkbox" style="--checkcolor: none">
                        <input type="checkbox" class="check_indispo" ${estCoche}>
                        <span class="badge-text">Indisponibilité</span>
                        <span class="custom-checkbox"></span>
                    </label>
                </li>`;
            }
        }

        li_val += `
            <li>
                <div class="ul_icons">
                    <svg class="trash_element" style="cursor:pointer;" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.33333 9.33333H26.6667M13.3333 14.6667V22.6667M18.6667 14.6667V22.6667M6.66666 9.33333L7.99999 25.3333C7.99999 26.0406 8.28095 26.7189 8.78104 27.219C9.28114 27.719 9.95942 28 10.6667 28H21.3333C22.0406 28 22.7188 27.719 23.2189 27.219C23.719 26.7189 24 26.0406 24 25.3333L25.3333 9.33333M12 9.33333V5.33333C12 4.97971 12.1405 4.64057 12.3905 4.39052C12.6406 4.14048 12.9797 4 13.3333 4H18.6667C19.0203 4 19.3594 4.14048 19.6095 4.39052C19.8595 4.64057 20 4.97971 20 5.33333V9.33333" stroke="#FBFDFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <svg class="rename_element" style="cursor:pointer;" width="24" height="24" viewBox="0 0 50 41" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.25 24.3333L22.9167 32.6667H43.75V24.3333H31.25ZM25.125 5.97915L6.25 24.8541V32.6667H14.0625L32.9375 13.7916L25.125 5.97915ZM38.9792 7.74998C39.7917 6.93748 39.7917 5.58332 38.9792 4.81248L34.1042 -0.0625169C33.7138 -0.45054 33.1858 -0.668335 32.6354 -0.668335C32.085 -0.668335 31.557 -0.45054 31.1667 -0.0625169L27.3542 3.74998L35.1667 11.5625L38.9792 7.74998Z" fill="#FBFDFF"/></svg>
                </div>
            </li>
        </ul>`;
        conteneur_liste_elements.insertAdjacentHTML("beforeend", li_val);
    });

    document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => s.classList.remove("sec_open"));
    sous_sec.classList.add("sec_open");
}






// FONCTION POUR SUPPRIMER UNE LISTE OU UN ELEMENT ---------------------------------------------------------------------------------------------------------------------
function supprimer(poubelle) {
    if (!confirm("Voulez-vous vraiment supprimer cet élément ?")) return;

    // Suppression d'une liste entière
    const liListe = poubelle.closest(".menu_ul > li");
    if (liListe) {
        const element = poubelle.closest(".etu_sec") !== null;
        const numero_list = Array.from(liListe.parentNode.children).indexOf(liListe);

        if (element) {
            tab_etu.splice(numero_list, 1);
            sauvegarder('tab_etu', tab_etu);
        } else {
            tab_salles.splice(numero_list, 1);
            sauvegarder('tab_salles', tab_salles);
        }

        afficher_listes();
        nettoyer_filtres();
        remplir_select();
        generer_filtres();
        if (typeof verifier_capacite === "function") verifier_capacite();
        return;
    }

    // Suppression d'un élément spécifique (étudiant/place)
    const bloc_element = poubelle.closest(".bloc_element");
    if (bloc_element) {
        const element_supp = parseInt(bloc_element.dataset.index, 10);
        const list_el = document.querySelector(".nom_liste").textContent;

        if (list_el === "Matières") {
            tab_matiere.splice(element_supp, 1);
            sauvegarder('tab_matiere', tab_matiere);
        } else if (list_el === "Historique des placements") {
            tab_placer.splice(element_supp, 1);
            sauvegarder('tab_placement', tab_placer);
        } else {
            let listeEtu = getListeEtu(list_el);
            let listeSalle = getListeSalle(list_el);

            if (listeEtu) {
                listeEtu.donnees.splice(element_supp, 1);
                sauvegarder('tab_etu', tab_etu);
            } else if (listeSalle) {
                listeSalle.places.splice(element_supp, 1);
                sauvegarder('tab_salles', tab_salles);
            }
        }

        ouvrir_details_liste(list_el);
        remplir_select();
        generer_filtres();
        verifier_capacite();
    }
}



// FONCTION POUR AJOUTER/MODIFIER UNE LISTE/ELEMENT --------------------------------------------------------------------------------------------------------------------------
function edition_formulaire() {
    let val_nom = "", val_prenom = "", val_parcours = "";
    const nom_liste = label_nom_liste.textContent; // Utilise la variable globale
    
    // A. Identifier le type exact qu'on édite
    if (mode_edition !== "modifier_liste") {
        if (nom_liste === "Matières") type_edition = "matiere";
        else if (nom_liste === "Historique des placements") type_edition = "historique";
        else if (getListeEtu(nom_liste)) type_edition = "etu";
        else if (getListeSalle(nom_liste)) type_edition = "salle";
    }

    const mode_titre = (mode_edition === "modifier_liste") ? "modifier" : mode_edition;
    titre_edition_sec.textContent = CONFIG_SECTION[type_edition].titres[mode_titre];

    // B. Récupération des valeurs existantes si on modifie
    if (mode_edition === "modifier" || mode_edition === "modifier_liste") {
        switch (type_edition) {
            case "nom_liste_etu":
            case "nom_liste_salle":
                val_nom = ancien_nom_liste;
                break;
            case "matiere":
                val_nom = tab_matiere[index_edition];
                break;
            case "historique":
                val_nom = tab_placer[index_edition].titre;
                break;
            case "etu":
                const etu = getListeEtu(nom_liste).donnees[index_edition];
                val_nom = etu.nom; val_prenom = etu.prenom; val_parcours = etu.parcours;
                break;
            case "salle":
                const places = getListeSalle(nom_liste).places;
                const cle = Object.keys(places[index_edition]).find(k => k !== "indisponible");
                val_nom = places[index_edition][cle];
                break;
        }
    }

    // C. Injection du HTML
    let html_formulaire = "";
    const texte_label_nom = (mode_edition === "modifier_liste") ? "Nouveau nom" : "Nom";
    html_formulaire += generer_champ_input(texte_label_nom, "input_nom", val_nom);

    if (type_edition === "etu") {
        html_formulaire += generer_champ_input("Prénom", "input_prenom", val_prenom);
        html_formulaire += generer_champ_input("Parcours", "input_parcours", val_parcours);
    }
    
    form_edition.innerHTML = html_formulaire;

    // D. Affichage propre
    document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => s.classList.remove("sec_open"));
    edition_sec.classList.add("sec_open");
}


//FONCTION POUR VALIDER UN AJOUT/MODIFICATION D'UNE LISTE/ELEMENT --------------------------------------------------------------------------------------------------------

edition_valid.addEventListener("click", () => {
    const input_nom = document.getElementById("input_nom")?.value.trim();
    const input_prenom = document.getElementById("input_prenom")?.value.trim();
    const input_parcours = document.getElementById("input_parcours")?.value.trim();

    edition_erreur.textContent = ""; // On nettoie les anciennes erreurs
    // Validation spécifique pour les étudiants (3 champs)
    if (type_edition === "etu") {
        if (!input_nom || !input_prenom || !input_parcours) {
            edition_erreur.textContent = "Veuillez remplir tous les champs.";
            return;
        }
    } 
    // Validation pour tout le reste (Listes, Salles, Matières, Historique : 1 seul champ)
    else {
        if (!input_nom) {
            edition_erreur.textContent = "Veuillez remplir tous les champs.";
            return;
        }
    }

    const nom_liste = document.querySelector(".nom_liste").textContent;

    switch (type_edition) {
        case "nom_liste_etu":
            tab_etu[index_edition].nom_fichier = input_nom;
            sauvegarder("tab_etu", tab_etu);
            rafraichir_menu_principal(".etu_sec");
            break;

        case "nom_liste_salle":
            tab_salles[index_edition].nom_salle = input_nom;
            sauvegarder("tab_salles", tab_salles);
            rafraichir_menu_principal(".salle_sec");
            break;

        case "matiere":
            if (mode_edition === "ajouter") tab_matiere.push(input_nom);
            else tab_matiere[index_edition] = input_nom;
            sauvegarder("tab_matiere", tab_matiere);
            fermer_et_recharger(nom_liste);
            break;

        case "historique":
            tab_placer[index_edition].titre = input_nom;
            sauvegarder("tab_placement", tab_placer);
            fermer_et_recharger(nom_liste);
            break;

        case "etu":
            let listeEtu = getListeEtu(nom_liste);
            let etu_data = { nom: input_nom, prenom: input_prenom, parcours: input_parcours, tiers_temps: false };
            
            if (mode_edition === "ajouter") listeEtu.donnees.push(etu_data);
            else {
                etu_data.tiers_temps = listeEtu.donnees[index_edition].tiers_temps;
                listeEtu.donnees[index_edition] = etu_data;
            }
            sauvegarder("tab_etu", tab_etu);
            if (select_etu.value === nom_liste) generer_filtres(); 
            fermer_et_recharger(nom_liste);
            break;

        case "salle":
            let listeSalle = getListeSalle(nom_liste);
            let cle = (listeSalle.places.length > 0) ? Object.keys(listeSalle.places[0]).find(k => k !== "indisponible") : "Place";
            let place_data = { [cle]: input_nom, indisponible: false };

            if (mode_edition === "ajouter") listeSalle.places.push(place_data);
            else {
                place_data.indisponible = listeSalle.places[index_edition].indisponible;
                listeSalle.places[index_edition] = place_data;
            }
            sauvegarder("tab_salles", tab_salles);
            if (typeof verifier_capacite === "function") verifier_capacite();
            fermer_et_recharger(nom_liste);
            break;
    }
});

//Fonction pour générer un champ texte de formulaire
function generer_champ_input(label, id, valeur) {
    return `<label class="champ_edition"><span class="label_texte">${label}</span><input type="text" id="${id}" class="input_ligne" value="${valeur}"></label>`;
}


function fermer_formulaire(section_a_rouvrir) {
    edition_sec.classList.remove("sec_open");
    sous_sec.classList.remove("sec_open"); // S'assure que sous_sec est caché si on retourne à la racine
    if (section_a_rouvrir) section_a_rouvrir.classList.add("sec_open");
}

function fermer_et_recharger(nom_liste) {
    fermer_formulaire(sous_sec);
    ouvrir_details_liste(nom_liste); // Rafraîchit les données visuelles
}

function rafraichir_menu_principal(selecteur_section) {
    afficher_listes();
    remplir_select();
    generer_filtres();
    fermer_formulaire(document.querySelector(selecteur_section));
}




// FONCTION POUR RECHERCHER UN ETUDIANT A PARTIR DE LA BARRE DE RECHERCHE -----------------------------------------------------------------------------------
const searchInput = document.querySelector(".search_bar input");
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const recherche = e.target.value.toLowerCase().trim();
        const bloc_etu = document.querySelectorAll(".liste_elements .bloc_element");

        bloc_etu.forEach(bloc => {
            const texteBloc = bloc.textContent.toLowerCase();
            if (texteBloc.includes(recherche)) {
                bloc.classList.remove("bloc_invisible");
            } else {
                bloc.classList.add("bloc_invisible");
            }
        });
    });
}



// FONCTION POUR GERER LES CHECKBOX TIERS-TEMPS/INDISPONIBLE DANS LE MENU GAUCHE -----------------------------------------------------------------------------------
// Permet de cocher si un étudiant a un tiers-temps ou non et cocher si une place est indisponible
document.addEventListener("change", (e) => {
    if (e.target.classList.contains("check_tier") || e.target.classList.contains("check_indispo")) {
        const bloc = e.target.closest(".bloc_element");
        const index = parseInt(bloc.dataset.index, 10);
        const nom_liste = document.querySelector(".nom_liste").textContent;

        let listeEtu = getListeEtu(nom_liste);
        let listeSalle = getListeSalle(nom_liste);

        if (listeEtu && e.target.classList.contains("check_tier")) {
            listeEtu.donnees[index].tiers_temps = e.target.checked;
            sauvegarder('tab_etu', tab_etu);
            
            if (select_etu.value === nom_liste) afficher_tableau();

        } else if (listeSalle && e.target.classList.contains("check_indispo")) {
            listeSalle.places[index].indisponible = e.target.checked;
            sauvegarder('tab_salles', tab_salles);
        }
        if (typeof verifier_capacite === "function") verifier_capacite();
    }
});