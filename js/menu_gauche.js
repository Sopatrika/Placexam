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

        const nom_onglet = btn.textContent.trim(); 
        const type_onglet = btn.dataset.type;

        // Si on clique sur la liste de étudiants
        if (type_onglet === "matiere" || type_onglet === "historique" || type_onglet === "salle") {
            ouvrir_details_liste(nom_onglet, type_onglet);
            return;
        }

        // Comportement classique pour Etudiants et Salles
        menu_sec.forEach(sec => {
            if (sec.classList.contains(btn.dataset.sec)) sec.classList.add("sec_open");
            else sec.classList.remove("sec_open");
        });
    });
});



//FONCTION POUR CREER LES BLOCS DE LISTE DANS LE MENU ----------------------------------------------------------------------------------------------------------------------
function bloc_listes(liste, type) {
    let bloc_el = document.createElement("li");
    bloc_el.dataset.name = liste;
    bloc_el.dataset.type = type;

    bloc_el.innerHTML = `
        <div class="nom_element">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.5613 10.7815C20.8422 11.0628 21 11.444 21 11.8415C21 12.239 20.8422 12.6203 20.5613 12.9015L14.9053 18.5605C14.6239 18.8419 14.2423 19 13.8443 19C13.4464 19 13.0647 18.8419 12.7833 18.5605C12.5019 18.2791 12.3438 17.8975 12.3438 17.4995C12.3438 17.1016 12.5019 16.7199 12.7833 16.4385L15.8793 13.3415H4.34432C3.9465 13.3415 3.56497 13.1835 3.28366 12.9022C3.00236 12.6209 2.84432 12.2393 2.84432 11.8415C2.84432 11.4437 3.00236 11.0622 3.28366 10.7809C3.56497 10.4996 3.9465 10.3415 4.34432 10.3415H15.8793L12.7833 7.24552C12.644 7.10619 12.5335 6.94078 12.4581 6.75873C12.3827 6.57668 12.3438 6.38157 12.3438 6.18452C12.3438 5.98747 12.3827 5.79236 12.4581 5.61031C12.5335 5.42826 12.644 5.26285 12.7833 5.12352C12.9227 4.98419 13.0881 4.87366 13.2701 4.79826C13.4522 4.72285 13.6473 4.68404 13.8443 4.68404C14.0414 4.68404 14.2365 4.72285 14.4185 4.79826C14.6006 4.87366 14.766 4.98419 14.9053 5.12352L20.5613 10.7815Z" fill="#FBFDFF"/>
            </svg>
            <span class="nom_texte"></span>
        </div>
        ${creer_icones(false)}
    `;

    bloc_el.querySelector('.nom_texte').textContent = liste;
    return bloc_el;
}





// FONCTION POUR AFFICHER LES LISTES DANS LE MENUS ----------------------------------------------------------------------------------------------------------------------
document.addEventListener("donneesMisesAJour", (e) => {
    const type_modifie = e.detail.type; // Permet de savoir si on a touché "salle", "etu" ou "tout"
    
    // On vide le HTML pour le reconstruire
    if (conteneur_etu_ul) conteneur_etu_ul.innerHTML = "";
    if (conteneur_salle_ul) conteneur_salle_ul.innerHTML = "";

    // On repeuple les listes depuis les tableaux mémoire
    tab_etu.forEach(liste => {
        const li = bloc_listes(liste.nom_fichier || "Liste sans nom", "etu");
        if (conteneur_etu_ul) conteneur_etu_ul.appendChild(li);
    });

    tab_salles.forEach(salle => {
        const li = bloc_listes(salle.nom_salle, "salle");
        if (conteneur_salle_ul) conteneur_salle_ul.appendChild(li);
    });

    // vérifie quelle section est actuellement ouverte
    const type_ouvert = label_nom_liste.dataset.type;
    const nom_ouvert = label_nom_liste.textContent;

    // empêche l'exécution si aucune section n'est encore définie (chargement initial)
    if (!type_ouvert) return; 

    // Si on a modifié la donnée qui est actuellement affichée, on rafraîchit la vue
    if (type_ouvert === type_modifie || type_modifie === "tout") {
        
        if (nom_ouvert === "Salles" || nom_ouvert === "Matières" || nom_ouvert === "Historique des placements") {
            ouvrir_details_liste(nom_ouvert, type_ouvert);
        } else {
            const existe_encore = (type_ouvert === "salle") ? getListeSalle(nom_ouvert) : getListeEtu(nom_ouvert);
            
            if (existe_encore) {
                ouvrir_details_liste(nom_ouvert, type_ouvert);
            } else {
                // CORRECTIF BUG 1 (Sécurité) : On retourne à la bonne liste de base, pas à la sous-section
                let selecteur_retour = (type_ouvert === "salle") ? document.querySelector(".salle_sec") : document.querySelector(".etu_sec");
                fermer_formulaire(selecteur_retour); 
            }
        }
    }
});

// 2. On transforme afficher_listes() en un déclencheur d'événement (Dispatcher)
// Ainsi, partout dans ton code (script.js, importation.js), quand tu appelleras afficher_listes(), 
// ça déclenchera proprement l'Observateur ci-dessus !
function afficher_listes() {
    const event = new CustomEvent("donneesMisesAJour", { detail: { type: "tout" } });
    document.dispatchEvent(event);
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

// AFFICHER LES DÉTAILS D'UNE LISTE DANS LE MENU -------------------------------------------------------------------------------------------------------------------------------
function ouvrir_details_liste(nom_cible, typeListe) {
    const elementsArray = CONFIG_SECTION[typeListe].get_donnees(nom_cible);
    if (!elementsArray) return;

    const regles = CONFIG_SECTION[typeListe];
    sec_first.style.display = (typeListe === "etu") ? "flex" : "none";

    // Configurer l'interface (barre de recherche, boutons)
    conteneur_search_bar.style.display = regles.affichage.recherche ? "flex" : "none";
    if (regles.affichage.recherche && search_input_etu) search_input_etu.value = "";
    btn_supp_histo.style.display = regles.affichage.supp_histo ? "flex" : "none";
    if (tab_placer.length < 1) btn_supp_histo.style.display = "none";
    btn_ajouter.dataset.source = nom_cible;
    btn_ajouter.style.display = regles.affichage.bouton_ajout ? "flex" : "none";

    label_nom_liste.textContent = nom_cible;
    label_nom_liste.dataset.type = typeListe;
    conteneur_liste_elements.innerHTML = "";

    // Afficher les éléments
    elementsArray.forEach((item, index) => {
        const ul = document.createElement("ul");
        ul.className = "bloc_element";
        ul.dataset.index = index;

        // Utiliser un générateur de contenu spécifique au type
        const contenu = generer_contenu_element(item, typeListe, index);
        contenu.forEach(html => {
            const li = document.createElement("li");
            li.innerHTML = html;
            ul.appendChild(li);
        });

        // Ajouter icône tiers-temps si nécessaire
        if (regles.affichage.icon_tierstemps && item.tiers_temps) {
            ul.appendChild(creer_icone_tier_temps());
        }

        // Ajouter icônes d'action
        const li_actions = document.createElement("li");
        li_actions.innerHTML = creer_icones(typeListe === "historique");
        ul.appendChild(li_actions);
        conteneur_liste_elements.appendChild(ul);
    });

    document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => s.classList.remove("sec_open"));
    sous_sec.classList.add("sec_open");
}

// Nouvelle fonction utilitaire
function generer_contenu_element(item, typeListe, index) {
    const regles = CONFIG_SECTION[typeListe];
    return regles.format_affichage ? regles.format_affichage(item, index) : [];
}


//FONCTION POUR CREER LES ICONES POUR LES LISTES ET ELEMENT --------------------------------------------------------------------------------------------------------------
function creer_icones(afficher_charger = false) {
    let html = `<div class="ul_icons">`;

    // Ajoute l'icône "charger" uniquement pour l'historique
    if (afficher_charger) {
        html += `<svg class="load_element" title="Charger ce placement" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.6667 3.66667H3.66667C2.95942 3.66667 2.28115 3.94762 1.78105 4.44771C1.28095 4.94781 1 5.62609 1 6.33333V19.6667C1 20.3739 1.28095 21.0522 1.78105 21.5523C2.28115 22.0524 2.95942 22.3333 3.66667 22.3333H17C17.7072 22.3333 18.3855 22.0524 18.8856 21.5523C19.3857 21.0522 19.6667 20.3739 19.6667 19.6667V11.6667M10.3333 13L22.3333 1M22.3333 7.66667V1H15.6667" stroke="#EBF5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    // Ajoute les icônes supprimer et renommer
    html += `<svg class="trash_element" title="supprimer l'élément" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.33333 9.33333H26.6667M13.3333 14.6667V22.6667M18.6667 14.6667V22.6667M6.66666 9.33333L7.99999 25.3333C7.99999 26.0406 8.28095 26.7189 8.78104 27.219C9.28114 27.719 9.95942 28 10.6667 28H21.3333C22.0406 28 22.7188 27.719 23.2189 27.219C23.719 26.7189 24 26.0406 24 25.3333L25.3333 9.33333M12 9.33333V5.33333C12 4.97971 12.1405 4.64057 12.3905 4.39052C12.6406 4.14048 12.9797 4 13.3333 4H18.6667C19.0203 4 19.3594 4.14048 19.6095 4.39052C19.8595 4.64057 20 4.97971 20 5.33333V9.33333" stroke="#FBFDFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg class="rename_element" title="modifier l'élément" width="24" height="24" viewBox="0 0 50 41" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.25 24.3333L22.9167 32.6667H43.75V24.3333H31.25ZM25.125 5.97915L6.25 24.8541V32.6667H14.0625L32.9375 13.7916L25.125 5.97915ZM38.9792 7.74998C39.7917 6.93748 39.7917 5.58332 38.9792 4.81248L34.1042 -0.0625169C33.7138 -0.45054 33.1858 -0.668335 32.6354 -0.668335C32.085 -0.668335 31.557 -0.45054 31.1667 -0.0625169L27.3542 3.74998L35.1667 11.5625L38.9792 7.74998Z" fill="#FBFDFF"/></svg>
    </div>`;

    return html;
}


//=================================================================================================================================================================
// GESTION DE L'INTERFACE DE SUPPRESSION (Remplacement de window.confirm)
//=================================================================================================================================================================
let action_suppression_en_attente = null; 
let section_precedente_suppression = null; // 🌟 NOUVEAU : Mémorise la section d'où l'on vient !

function ouvrir_menu_suppression(message_html, callback_action) {
    const supprimer_sec = document.querySelector(".supprimer_sec");
    if (!supprimer_sec) return;

    // 1. On mémorise la section actuellement ouverte (avant d'ouvrir la page de suppression)
    const sections = document.querySelectorAll(".menu_deroulant_gauche section");
    section_precedente_suppression = Array.from(sections).find(s => 
        s.classList.contains("sec_open") && !s.classList.contains("supprimer_sec")
    );

    // 2. On insère le message personnalisé 
    const msg_container = supprimer_sec.querySelector(".menu_message");
    if (msg_container) msg_container.innerHTML = message_html;
    
    // 3. On sauvegarde l'action
    action_suppression_en_attente = callback_action;

    // 4. On bascule l'affichage
    sections.forEach(s => s.classList.remove("sec_open"));
    supprimer_sec.classList.add("sec_open");
}

function fermer_menu_suppression() {
    const supprimer_sec = document.querySelector(".supprimer_sec");
    if (!supprimer_sec) return;
    
    supprimer_sec.classList.remove("sec_open");
    action_suppression_en_attente = null; 

    if (section_precedente_suppression) {
        section_precedente_suppression.classList.add("sec_open");
    } else {
        // Sécurité au cas où
        const sec_etu = document.querySelector(".etu_sec");
        if (sec_etu) sec_etu.classList.add("sec_open");
    }
}

// ÉCOUTEUR GLOBAL SUR LA SECTION SUPPRIMER
const section_supprimer = document.querySelector(".supprimer_sec");
if (section_supprimer) {
    section_supprimer.addEventListener("click", (e) => {
        const btn = e.target.closest(".groupe_btn > *"); 
        if (!btn) return;

        const texte_btn = btn.textContent.toLowerCase().trim();

        if (texte_btn.includes("annuler")) {
            fermer_menu_suppression();
        } else {
            if (action_suppression_en_attente) {
                action_suppression_en_attente(); 
            }
            fermer_menu_suppression();
        }
    });
}

// FONCTION SUPPRIMER ADAPTÉE
function supprimer(poubelle) {
    // A. Cas de la suppression d'une liste entière (depuis le menu principal, ex: etu_sec)
    const liListe = poubelle.closest(".menu_ul > li");
    if (liListe) {
        const estListeEtu = poubelle.closest(".etu_sec") !== null;
        const numero_list = Array.from(liListe.parentNode.children).indexOf(liListe);
        const nom_liste_supp = liListe.dataset.name || "cette liste";

        ouvrir_menu_suppression(`Voulez-vous vraiment supprimer la liste <b>${nom_liste_supp}</b> ?`, () => {
            if (estListeEtu) {
                tab_etu.splice(numero_list, 1);
                sauvegarder('tab_etu', tab_etu);
            }
            afficher_listes();
            if (typeof nettoyer_filtres === "function") nettoyer_filtres();
            remplir_select();
            if (typeof generer_filtres === "function") generer_filtres();
            verifier_capacite();
        });
        return;
    }

    // B. Cas de la suppression d'un élément spécifique (depuis sous_sec)
    const bloc_element = poubelle.closest(".bloc_element");
    if (bloc_element) {
        const element_supp = parseInt(bloc_element.dataset.index, 10);
        const list_el = document.querySelector(".nom_liste").textContent;
        const type_el = document.querySelector(".nom_liste").dataset.type;
        
        let nom_element_affiche = "cet élément";
        const config_speciale = Object.values(CONFIG_SECTION).find(c => c.nom_liste === list_el);
        
        if (config_speciale) {
            // C'est une Salle, Matière, Historique...
            let obj = config_speciale.tableau[element_supp];
            if (obj) nom_element_affiche = obj.nom_salle || obj.nom || obj.titre || "cet élément";
        } else {
            // C'est un étudiant dans une liste !
            let listeEtu = getListeEtu(list_el);
            if (listeEtu && listeEtu.donnees[element_supp]) {
                nom_element_affiche = `${listeEtu.donnees[element_supp].nom} ${listeEtu.donnees[element_supp].prenom}`;
            }
        }

        ouvrir_menu_suppression(`Voulez-vous vraiment supprimer <b>${nom_element_affiche}</b> ?`, () => {
            if (config_speciale) {
                config_speciale.tableau.splice(element_supp, 1);
                sauvegarder(config_speciale.storage_key, config_speciale.tableau);
            } else {
                let listeEtu = getListeEtu(list_el);
                if (listeEtu) {
                    listeEtu.donnees.splice(element_supp, 1);
                    sauvegarder('tab_etu', tab_etu);
                }
            }

            ouvrir_details_liste(list_el, type_el);
            remplir_select();
            if (typeof generer_filtres === "function") generer_filtres();
            verifier_capacite();
        });
    }
}



// FONCTION POUR AJOUTER/MODIFIER UNE LISTE/ELEMENT --------------------------------------------------------------------------------------------------------------------------
function edition_formulaire() {
    const nom_liste = label_nom_liste.textContent; 
    
    if (mode_edition !== "modifier_liste") type_edition = label_nom_liste.dataset.type; 

    titre_edition_sec.textContent = (mode_edition === "modifier_liste") ? 
        "Renommer la liste" : CONFIG_SECTION[type_edition].titres[mode_edition];

    // 1. On récupère l'objet qu'on est en train d'éditer
    let objet_a_editer = {}; 
    if (mode_edition === "modifier") {
        switch (type_edition) {
            case "etu":
                objet_a_editer = getListeEtu(nom_liste).donnees[index_edition];
                break;
            case "salle":
                objet_a_editer = tab_salles[index_edition];
                break;
            case "matiere":
                objet_a_editer = tab_matiere[index_edition];
                break;
            case "historique":
                objet_a_editer = { titre: tab_placer[index_edition].titre };
                break;
        }
    }

    // Générer la liste des inputs en fonction des valeurs dans CONFIG_SECTION
    let html_formulaire = "";
    
    if (mode_edition === "modifier_liste") {
        html_formulaire += generer_champ_input("Nouveau nom", "input_nom_liste", ancien_nom_liste, "text");
    } else {
        const champs_config = CONFIG_SECTION[type_edition].champs;
        
        champs_config.forEach(champ => {
            //récupère l'ancienne valeur si on modifie, sinon met vide
            let valeur = (mode_edition === "modifier" && objet_a_editer[champ.id] !== undefined) ? objet_a_editer[champ.id] : "";
                         
            html_formulaire += generer_champ_input(champ.label, `input_${champ.id}`, valeur, champ.type);
        });
    }

    form_edition.innerHTML = html_formulaire;

    document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => s.classList.remove("sec_open"));
    edition_sec.classList.add("sec_open");
}


//FONCTION POUR VALIDER UN AJOUT/MODIFICATION D'UNE LISTE/ELEMENT --------------------------------------------------------------------------------------------------------

function valider_edition() {
    edition_erreur.textContent = ""; 

    // CAS 1 : Renommer le titre d'une liste entière
    if (mode_edition === "modifier_liste") {
        const nouveau_nom_liste = document.getElementById("input_nom_liste")?.value.trim();
        if (!nouveau_nom_liste) {
            edition_erreur.textContent = "Le nom ne peut pas être vide.";
            return;
        }
        if (type_edition === "nom_liste_etu") {
            tab_etu[index_edition].nom_fichier = nouveau_nom_liste;
            sauvegarder("tab_etu", tab_etu);
            rafraichir_menu_principal(".etu_sec");
        }
        return;
    } 
    
    let nouvel_objet = {};
    const config = CONFIG_SECTION[type_edition];

    // 1. On récupère les valeurs tapées
    config.champs.forEach(champ => {
        let input_element = document.getElementById(`input_${champ.id}`);
        if (input_element) {
            let valeur = input_element.value.trim();
            if (champ.type === "number") valeur = parseInt(valeur) || 0; 
            nouvel_objet[champ.id] = valeur;
        }
    });

    // 2. On délègue la sauvegarde magique
    const nom_liste = document.querySelector(".nom_liste").textContent;
    config.sauvegarder_element(nouvel_objet, mode_edition, index_edition, nom_liste);
}

//Fonction pour générer un champ texte de formulaire
function generer_champ_input(label, id, valeur = "", type = "text") {
    return `<label class="champ_edition">
                <span class="label_texte">${label}</span>
                <input type="${type}" id="${id}" class="input_ligne" value="${valeur}">
            </label>`;
}

// Fonction pour fermer le formulaire
function fermer_formulaire(section_a_rouvrir) {
    edition_sec.classList.remove("sec_open");
    sous_sec.classList.remove("sec_open"); 
    
    const charger_sec = document.querySelector(".charger_sec");
    if (charger_sec) charger_sec.classList.remove("sec_open");
    
    if (section_a_rouvrir) section_a_rouvrir.classList.add("sec_open");
}

// Fonction pour fermer un sous menu et 
function fermer_et_recharger(nom_liste) {
    const type_el = document.querySelector(".nom_liste").dataset.type; // On récupère le type
    ouvrir_details_liste(nom_liste, type_el);
    fermer_formulaire(document.querySelector(".sous_sec"));
}

// Fonction pour rafraichir le menu gauche
function rafraichir_menu_principal(selecteur_section) {
    afficher_listes();
    remplir_select();
    generer_filtres();
    fermer_formulaire(document.querySelector(selecteur_section));
}




// FONCTION POUR RECHERCHER UN ETUDIANT A PARTIR DE LA BARRE DE RECHERCHE -----------------------------------------------------------------------------------
const searchInput = document.querySelector(".search_bar input");
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



// FONCTION POUR GERER LES CHECKBOX TIERS-TEMPS DANS LE MENU GAUCHE -----------------------------------------------------------------------------------
// Permet de cocher si un étudiant a un tiers-temps ou non et cocher si une place est indisponible
document.addEventListener("change", (e) => {
    if (e.target.classList.contains("check_tier") || e.target.classList.contains("check_indispo")) {
        const bloc = e.target.closest(".bloc_element");
        const index = parseInt(bloc.dataset.index, 10);
        const nom_liste = document.querySelector(".nom_liste").textContent;

        let listeEtu = getListeEtu(nom_liste);

        if (listeEtu && e.target.classList.contains("check_tier")) {
            // Mettre à jour les données
            listeEtu.donnees[index].tiers_temps = e.target.checked;
            sauvegarder('tab_etu', tab_etu);

            // Mettre à jour le tableau si nécessaire
            if (select_etu.value === nom_liste) afficher_tableau();

            // Mettre à jour l’icône dans le menu gauche
            const existingIcon = bloc.querySelector(".icon_bloc_element");
            if (e.target.checked) {
                // Si l’icône n’existe pas, on l’ajoute
                if (!existingIcon) {
                    // Trouver le li contenant les icônes d'action (ul_icons)
                    const actionsLi = bloc.querySelector(".ul_icons")?.closest("li");
                    if (actionsLi) {
                        // Insérer l’icône juste avant les icônes d’action
                        bloc.insertBefore(creer_icone_tier_temps(), actionsLi);
                    } else {
                        // Si on ne trouve pas, on l’ajoute à la fin
                        bloc.appendChild(creer_icone_tier_temps());
                    }
                }
            } else {
                // Si l’icône existe, on la supprime
                if (existingIcon) {
                    existingIcon.remove();
                }
            }
        }
    }
});

function creer_icone_tier_temps() {
    const li = document.createElement("li");
    li.className = "icon_bloc_element";
    li.innerHTML = svg_tier_temps;
    return li;
}


//FONCTION POUR SUPPRIMER TOUTE L'HISTORIQUE DES PLACEMENT ----------------------------------------------------------------------------------------------------------------
btn_supp_histo.addEventListener("click", supp_histo_placement)
function supp_histo_placement() {
    ouvrir_menu_suppression("Voulez-vous vraiment supprimer <b>tout l'historique des placements</b> ?", () => {
        tab_placer = [];
        sauvegarder("tab_placement", tab_placer);
        ouvrir_details_liste("Historique des placements", "historique");
    });
}