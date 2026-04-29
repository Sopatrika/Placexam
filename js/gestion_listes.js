//FONCTION POUR DIFFEREND EVENEMENTS DE CLIC (SOUS LISTE, SUPPRIMER UNE LISTE/ELEMENT) -----------------------------------------------------------------

let section_precedente; // Variable pour mémoriser d'où l'on vient (etu_sec ou salle_sec)

// Cette fonction permet de savoir ou l'utilisateur a cliqué sur la page. Permet de gérer plusieurs évenements (clic sur une sous liste d'une liste, suppression d'une liste ou d'un élément, modification d'un élement)
document.addEventListener("click", (e) => {

    // -------------------------- CLIC SUR LE NOM D'UNE SOUS LISTE ---------------------

    if (e.target.classList.contains("nom_texte")) {
        const li = e.target.closest("li");
        section_precedente = e.target.closest("section"); // Sauvegarde pour le retour
        
        // On appelle la nouvelle fonction propre !
        ouvrir_details_liste(li.dataset.name);
    }

    // -------------------------------------- CLIC SUR LE BOUTON RETOUR ---------------------------------
    // closest permet de détecter le clic même si on clique sur le SVG à l'intérieur
    if (e.target.closest(".return_sec")) {
        // On cache la sous-section
        document.querySelector(".sous_sec").classList.remove("sec_open");
        
        // On rouvre la section mémorisée
        if (section_precedente) {
            section_precedente.classList.add("sec_open");
        }
    }

    // -------------------------------------- CLIC SUR UNE CORBEILLE ---------------------------------
    if (e.target.closest(".trash_element")) {
        supprimer(e.target.closest(".trash_element")); //fonction pour supprimer une liste/élément
    }

    // Un seul écouteur pour TOUS les filtres (à mettre en bas de ton script)
    const conteneur_filtres = document.querySelector(".filtres_table");

    if (conteneur_filtres) {
        conteneur_filtres.addEventListener("change", (e) => {
            if (e.target.classList.contains("check-parcours")) {
                
                const nomParcours = e.target.value; 
                const nom_liste_actuelle = document.querySelector("#liste_etus").value;
                
                // Sécurité : on recrée le tiroir s'il a disparu
                if (!tab_filtres_prc[nom_liste_actuelle]) tab_filtres_prc[nom_liste_actuelle] = {};

                // On sauvegarde dans la structure : tab_filtres_prc["test1"]["Dev"] = true/false
                tab_filtres_prc[nom_liste_actuelle][nomParcours] = e.target.checked;
                localStorage.setItem('tab_filtres_prc', JSON.stringify(tab_filtres_prc));
                
                afficher_tableau();
            }
        });
    }
});





// ----------------- FONCTION CENTRALE POUR AFFICHER LE CONTENU D'UNE LISTE / MATIERE / HISTORIQUE -----------------
function ouvrir_details_liste(nom_cible) {
    let typeListe = "";
    let elementsArray = [];

    // 1. On détermine ce qu'on doit afficher
    if (nom_cible === "Matières") {
        typeListe = "matiere";
        elementsArray = tab_matiere;
    } else if (nom_cible === "Historique des placements") {
        typeListe = "historique";
        elementsArray = tab_placer;
    } else {
        let liste_select = tab_etu.find(l => l.nom_fichier === nom_cible);
        if (liste_select) {
            typeListe = "etu";
            elementsArray = liste_select.donnees;
        } else {
            liste_select = tab_salles.find(l => l.nom_salle === nom_cible);
            if (liste_select) {
                typeListe = "salle";
                elementsArray = liste_select.places;
            }
        }
    }

    if (!elementsArray) return;

    // 2. Interface (Barre de recherche, Boutons)
    const firstSec = document.querySelector(".first_sec");
    const searchBar = document.querySelector(".search_bar");
    const searchInput = searchBar.querySelector("input");
    const btnAjouter = document.querySelector(".btn_ajouter");

    // "first_sec" (Bouton retour + Nom) apparaît seulement pour Etu et Salles
    firstSec.style.display = (typeListe === "etu" || typeListe === "salle") ? "flex" : "none";

    if (typeListe === "etu") {
        searchBar.style.display = "flex";
        searchInput.value = "";
    } else {
        searchBar.style.display = "none";
    }
    
    // Le bouton Ajouter prend le nom de la cible en mémoire et s'affiche pour tout le monde (sauf historique)
    btnAjouter.dataset.source = nom_cible;
    btnAjouter.style.display = (typeListe === "historique") ? "none" : "flex";

    document.querySelector(".nom_liste").textContent = nom_cible;

    // 3. Génération du HTML
    const liste_conteneur = document.querySelector(".liste_elements");
    liste_conteneur.innerHTML = ""; 

    elementsArray.forEach((item, index) => {
        // Ajout de la classe "ligne_simple" pour le design Matière/Historique
        let classes = (typeListe === "matiere" || typeListe === "historique") ? "bloc_element ligne_simple" : "bloc_element";
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

        // Les icônes pour tout le monde
        li_val += `
            <li>
                <div class="ul_icons">
                    <svg class="trash_element" style="cursor:pointer;" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.33333 9.33333H26.6667M13.3333 14.6667V22.6667M18.6667 14.6667V22.6667M6.66666 9.33333L7.99999 25.3333C7.99999 26.0406 8.28095 26.7189 8.78104 27.219C9.28114 27.719 9.95942 28 10.6667 28H21.3333C22.0406 28 22.7188 27.719 23.2189 27.219C23.719 26.7189 24 26.0406 24 25.3333L25.3333 9.33333M12 9.33333V5.33333C12 4.97971 12.1405 4.64057 12.3905 4.39052C12.6406 4.14048 12.9797 4 13.3333 4H18.6667C19.0203 4 19.3594 4.14048 19.6095 4.39052C19.8595 4.64057 20 4.97971 20 5.33333V9.33333" stroke="#FBFDFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg class="rename_element" style="cursor:pointer;" width="24" height="24" viewBox="0 0 50 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M31.25 24.3333L22.9167 32.6667H43.75V24.3333H31.25ZM25.125 5.97915L6.25 24.8541V32.6667H14.0625L32.9375 13.7916L25.125 5.97915ZM38.9792 7.74998C39.7917 6.93748 39.7917 5.58332 38.9792 4.81248L34.1042 -0.0625169C33.7138 -0.45054 33.1858 -0.668335 32.6354 -0.668335C32.085 -0.668335 31.557 -0.45054 31.1667 -0.0625169L27.3542 3.74998L35.1667 11.5625L38.9792 7.74998Z" fill="#FBFDFF"/>
                    </svg>
                </div>
            </li>
        </ul>`;
        liste_conteneur.insertAdjacentHTML("beforeend", li_val);
    });

    // 4. Changement de vue
    document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => s.classList.remove("sec_open"));
    document.querySelector(".sous_sec").classList.add("sec_open");
}





//FONCTION POUR SUPPRIMER UNE LISTE/ELEMENT(UTILISATEUR/PLACE) ------------------------------------------------------------------------------------------------------------------
function supprimer(poubelle) {
    //confirmation
    if (!confirm("Voulez-vous vraiment supprimer cet élément ?")) return;

    // SUPPRESSION D'UNE LISTE ------------

    const liListe = poubelle.closest(".menu_ul > li");
    if (liListe) {
        const nomListe = liListe.dataset.name;
        const element = poubelle.closest(".etu_sec") !== null;

        const numero_list = Array.from(liListe.parentNode.children).indexOf(liListe);

        if (element) {
            // On supprime exactement 1 élément à cet index précis
            tab_etu.splice(numero_list, 1);
            localStorage.setItem('tab_etu', JSON.stringify(tab_etu));
        } else {
            tab_salles.splice(numero_list, 1);
            localStorage.setItem('tab_salles', JSON.stringify(tab_salles));
        }

        // On met à jour l'affichage du menu
        afficher_listes();
        nettoyer_filtres();
        remplir_select();
        generer_filtres();

        return;
    }

    // SUPPRESSION D'UN ÉLÉMENT SPÉCIFIQUE (étudiant(e) ou place) ------------------

    // SUPPRESSION D'UN ÉLÉMENT SPÉCIFIQUE ------------------
    const bloc_element = poubelle.closest(".bloc_element");
    if (bloc_element) {
        const element_supp = parseInt(bloc_element.dataset.index, 10);
        const list_el = document.querySelector(".nom_liste").textContent; // Nom de la liste ouverte

        // Aiguillage : Matières, Historique, ou Fichiers ?
        if (list_el === "Matières") {
            tab_matiere.splice(element_supp, 1);
            localStorage.setItem('tab_matiere', JSON.stringify(tab_matiere));
        } else if (list_el === "Historique des placements") {
            tab_placer.splice(element_supp, 1);
            localStorage.setItem('tab_placement', JSON.stringify(tab_placer));
        } else {
            let listeEtu = tab_etu.find(l => l.nom_fichier === list_el);
            let listeSalle = tab_salles.find(l => l.nom_salle === list_el);

            if (listeEtu) {
                listeEtu.donnees.splice(element_supp, 1);
                localStorage.setItem('tab_etu', JSON.stringify(tab_etu));
            } else if (listeSalle) {
                listeSalle.places.splice(element_supp, 1);
                localStorage.setItem('tab_salles', JSON.stringify(tab_salles));
            }
        }

        // On rafraîchit immédiatement la vue actuelle de façon propre
        ouvrir_details_liste(list_el);
        
        remplir_select();
        generer_filtres();
    }
}

// SCRIPT POUR RECHERCHER UN ETUDIANT A PARTIR DE LA BARRE -------------------------------------------------------------------------------------------------------
const searchInput = document.querySelector(".search_bar input"); // Assure-toi que c'est le bon sélecteur pour ton <input>

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const recherche = e.target.value.toLowerCase().trim(); // On récupère le texte tapé et on le met en minuscules
        
        // On cible tous les étudiants actuellement affichés
        const bloc_etu = document.querySelectorAll(".liste_elements .bloc_element");

        bloc_etu.forEach(bloc => {
            const texteBloc = bloc.textContent.toLowerCase(); // bloc.textContent récupère tout le texte à l'intérieur (Nom, Prénom...)

            if (texteBloc.includes(recherche)) { // Si le bloc contient ce qu'on cherche, on l'affiche (flex), sinon on le cache (none)
                bloc.style.display = "flex"; // On remet en visible
            } else {
                bloc.style.display = "none"; // On le cache
            }
        });
    });
}

// SCRIPT POUR LES CHECKBOX DANS LE MENU A GAUCHE ------------------------------------------------------------------------------------------------------------------------
//Permet qu'on puisse cocher "tiers temps" pour un étudiant ou "indisponibilité" pour les places

document.addEventListener("change", (e) => {
    if (e.target.classList.contains("check_tier") || e.target.classList.contains("check_indispo")) { // Si on a cliqué sur une de nos deux cases
        
        const bloc = e.target.closest(".bloc_element");
        const index = parseInt(bloc.dataset.index, 10);
        const nom_liste = document.querySelector(".nom_liste").textContent;

        let listeEtu = tab_etu.find(l => l.nom_fichier === nom_liste);
        let listeSalle = tab_salles.find(l => l.nom_salle === nom_liste);

        // On enregistre TRUE ou FALSE dans le tableau et on sauvegarde
        if (listeEtu && e.target.classList.contains("check_tier")) {
            listeEtu.donnees[index].tiers_temps = e.target.checked;
            localStorage.setItem('tab_etu', JSON.stringify(tab_etu));
            
            // Si c'est la liste actuellement affichée dans le grand tableau, on l'actualise en direct !
            if (liste_etus.value === nom_liste) afficher_tableau();

        } else if (listeSalle && e.target.classList.contains("check_indispo")) {
            listeSalle.places[index].indisponible = e.target.checked;
            localStorage.setItem('tab_salles', JSON.stringify(tab_salles));
        }
    }
});



// FONCTION POUR REMPLIR LES SELECTS ------------------------------------------------------------------------------------------------------------------------------------

const liste_etus = document.querySelector("#liste_etus");
const liste_salles = document.querySelector("#liste_salles");
const liste_matiere = document.querySelector("#liste_matiere");

function creer_option(element, liste) {
    const option = document.createElement("option");
    option.value = element;
    option.textContent = element;
    liste.appendChild(option);
}

function remplir_select() {
    liste_etus.innerHTML = "";
    liste_salles.innerHTML = "";

    Object.values(tab_etu).forEach( liste_etu => { 
        creer_option(liste_etu.nom_fichier, liste_etus);
    });
    Object.values(tab_salles).forEach( liste_salle => { 
        creer_option(liste_salle.nom_salle, liste_salles);
    });
}

const tableau_etu = document.querySelector(".exam-table tbody");
const conteneur_filtres = document.querySelector(".filtres_table");




const filtres_color = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4']; //Couleurs pour les filtres
liste_etus.addEventListener("change", generer_filtres);

// FONCTION POUR CRÉER LES FILTRES DE PARCOURS --------------------------------------------------------------------------------------------------------------
// Les filtres sont générés automatiquement selon les parcours proposés.
function generer_filtres() {
    conteneur_filtres.innerHTML = "";
    let liste_select = tab_etu.find(l => l.nom_fichier === liste_etus.value);
    
    if (!liste_select) {
        afficher_tableau();
        return;
    }

    // Set() permet d'extraire toutes les valeurs uniques d'un tableau pour éviter les doublons
    const list_parcours = [...new Set(liste_select.donnees.map(etu => etu.parcours))];

    const nom_liste_actuelle = liste_etus.value; // On récupère le nom du fichier actuel (ex: "test1")

    // On s'assure que le "tiroir" pour cette liste existe dans notre objet global
    if (!tab_filtres_prc[nom_liste_actuelle]) {
        tab_filtres_prc[nom_liste_actuelle] = {};
    }

    list_parcours.forEach((parcours, index) => {
        const couleur = filtres_color[index % filtres_color.length];
        
        // On va chercher l'état spécifique à CETTE liste et CE parcours
        const etatSpecifique = tab_filtres_prc[nom_liste_actuelle][parcours];
        const estCoche = (etatSpecifique === false) ? '' : 'checked';

        const htmlFiltre = `
            <div class="filtre_table">
                <label class="badge-checkbox" style="--checkcolor: ${couleur}">
                    <input type="checkbox" value="${parcours}" class="check-parcours" ${estCoche}>
                    <span class="badge-text">${parcours}</span>
                    <span class="custom-checkbox"></span>
                </label>
            </div>
        `;
        conteneur_filtres.insertAdjacentHTML("beforeend", htmlFiltre);
    });

    // ajoute l'événement "change" sur chaque nouvelle checkbox créée
    document.querySelectorAll(".check-parcours").forEach(cb => {
        cb.addEventListener("change", afficher_tableau);
    });

    afficher_tableau();
}




// FONCTION POUR AFFICHER LE TABLEAU EN FONCTION DES FILTRES --------------------------------------------------------------------------------------------------------------
function afficher_tableau() {
    tableau_etu.innerHTML = "";
    let liste_select = tab_etu.find(l => l.nom_fichier === liste_etus.value); //récupère la liste d'étudiants séléctionné
    if (!liste_select) return;

    const parcours_actifs = Array.from(document.querySelectorAll(".check-parcours:checked")).map(cb => cb.value); // récupère les filtres actifs cochés

    const donnees_filtrees = liste_select.donnees.filter(etu => parcours_actifs.includes(etu.parcours)); // On filtre les données selon les parcours cochés

    const btn_tri_tiers = document.querySelector(".tri_tiers_temps"); // La classe qu'on a mise à l'étape 1
    
    if (btn_tri_tiers && btn_tri_tiers.checked) {
        donnees_filtrees.sort((a, b) => {
            if (a.tiers_temps && !b.tiers_temps) return -1; // 'a' monte dans la liste
            if (!a.tiers_temps && b.tiers_temps) return 1;  // 'b' monte
            return 0; // Rien ne change
        });
    }

    // On génère le tableau
    donnees_filtrees.forEach(etu => {
        const ligne_etu = document.createElement("tr");
        
        const checkbox_abs = `
            <label class="badge-checkbox" style="--checkcolor: var(--black);">
                <input type="checkbox" class="check-absence" data-nom="${etu.nom}" data-prenom="${etu.prenom}">
                <span class="badge-text"></span>
                <span class="custom-checkbox"></span>
            </label>
        `; //Ajoute un checkbox pour vérifier si l'étudiant est absent

        ligne_etu.innerHTML = `<td>${etu.nom}</td><td>${etu.prenom}</td><td>${etu.parcours}</td><td></td><td>${checkbox_abs}</td>`;
        
        tableau_etu.appendChild(ligne_etu);
    });

    let html_global = "";

    // On boucle sur les étudiants filtrés
    donnees_filtrees.forEach((etu, index) => {
        
        const estCoche = etu.tiers_temps ? "checked" : "";
        
        // On remplit le "sac" de texte SANS toucher à la vraie page web
        html_global += `
            <tr>
                <td>${etu.nom}</td>
                <td>${etu.prenom}</td>
                <td>${etu.parcours}</td>
                <td></td>
                <td>
                    <label class="badge-checkbox" style="--checkcolor: var(--black);">
                        <input type="checkbox" class="check-absence" data-nom="${etu.nom}" data-prenom="${etu.prenom}">
                        <span class="badge-text"></span>
                        <span class="custom-checkbox"></span>
                    </label>
                </td> 
            </tr>
        `;
    });

    // 🟢 BOUM ! On injecte TOUT d'un seul coup dans le site web. 
    // Le navigateur ne dessine qu'une seule fois au lieu de 500 fois.
    document.querySelector(".exam-table tbody").innerHTML = html_global;
}

// POUR LE CHECKBOX "Tiers temps en premier"
const btn_tri_tiers = document.querySelector(".tri_tiers_temps");
btn_tri_tiers.addEventListener("change", afficher_tableau);

function nettoyer_filtres() {
    //On récupère la liste de tous les noms de fichiers étudiants existants
    const noms_listes_existantes = tab_etu.map(liste => liste.nom_fichier);

    // regarde chaque nom dans le tableau des listes existantes
    for (let nom_liste_sauvegardee in tab_filtres_prc) {
        
        if (!noms_listes_existantes.includes(nom_liste_sauvegardee)) {
            delete tab_filtres_prc[nom_liste_sauvegardee]; // Si le nom sauvegardé n'est plus dans les listes existantes, on le supprime
        }
    }

    // 3. On met à jour le LocalStorage
    localStorage.setItem('tab_filtres_prc', JSON.stringify(tab_filtres_prc));
}

remplir_select(); // Initialisation au chargement de la page
EnregChoix(); // 2. On restaure le choix sauvegardé (ex: "L3" au lieu de "L1")
generer_filtres(); // on génère les filtres et le tableau 