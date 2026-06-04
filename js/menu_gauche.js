//=================================================================================================================================================================
// GESTION DU MENU DEROULANT
//=================================================================================================================================================================

//FONCTION POUR OUVRIR LE MENU DEROULANT A GAUCHE ------------------------------------------------------------------------------------------------------------------
const menu_listes = document.querySelector(".menu_listes");
const button_menu_gauche = document.querySelector(".button_menu_gauche");

//FONCTION POUR OUVRIR/FERMER LES LISTES DANS LE MENU DEROULANT ------------------------------------------------------------------------------------------------------------
const btn_sec_menu = document.querySelectorAll(".btn-section-menu");
const menu_sec = document.querySelectorAll(".menu_deroulant_gauche section");

function gerer_onglets_menu_gauche(btn) {
    btn_sec_menu.forEach(e => e.classList.remove("btn_open"));
    btn.classList.add("btn_open");

    const nom_onglet = btn.textContent.trim(); 
    const type_onglet = btn.dataset.type;

    if (type_onglet === "matiere" || type_onglet === "historique" || type_onglet === "salle") {
        ouvrir_details_liste(nom_onglet, type_onglet);
        return;
    }

    menu_sec.forEach(sec => {
        if (sec.classList.contains(btn.dataset.sec)) sec.classList.add("sec_open");
        else sec.classList.remove("sec_open");
    });
}

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
function rafraichir_menu_apres_maj(type_modifie) {
    if (conteneur_etu_ul) conteneur_etu_ul.innerHTML = "";
    if (conteneur_salle_ul) conteneur_salle_ul.innerHTML = "";

    if (tab_etu.length === 0) {
        if (conteneur_etu_ul) conteneur_etu_ul.innerHTML = "<div class='message_vide_menu'>Aucune donnée disponible</div>";
    } else {
        tab_etu.forEach(liste => {
            const li = bloc_listes(liste.nom_fichier || "Liste sans nom", "etu");
            if (conteneur_etu_ul) conteneur_etu_ul.appendChild(li);
        });
    }

    const sous_sec_element = document.querySelector(".sous_sec");
    if (!sous_sec_element || !sous_sec_element.classList.contains("sec_open")) return;

    const label = document.querySelector(".nom_liste");
    const type_ouvert = label ? label.dataset.type : null;
    const nom_ouvert = label ? label.textContent : null;

    if (!type_ouvert) return; 

    if (type_ouvert === type_modifie || type_modifie === "tout") {
        if (nom_ouvert === "Salles" || nom_ouvert === "Matières" || nom_ouvert === "Historique des placements") {
            ouvrir_details_liste(nom_ouvert, type_ouvert);
        } else {
            const existe_encore = (type_ouvert === "salle") ? getListeSalle(nom_ouvert) : getListeEtu(nom_ouvert);
            if (existe_encore) ouvrir_details_liste(nom_ouvert, type_ouvert);
            else {
                let selecteur_retour = (type_ouvert === "salle") ? document.querySelector(".salle_sec") : document.querySelector(".etu_sec");
                fermer_formulaire(selecteur_retour); 
            }
        }
    }
}

function afficher_listes() {
    const event = new CustomEvent("donneesMisesAJour", { detail: { type: "tout" } });
    document.dispatchEvent(event);
}

// Variables globales pour l'édition
let section_precedente; 
let mode_edition = ""; 
let type_edition = ""; 
let index_edition = -1; 
let ancien_nom_liste = ""; 


// AFFICHER LES DÉTAILS D'UNE LISTE DANS LE MENU -------------------------------------------------------------------------------------------------------------------------------
function ouvrir_details_liste(nom_cible, typeListe) {
    if(!CONFIG_SECTION[typeListe]) return;
    const elementsArray = CONFIG_SECTION[typeListe].get_donnees(nom_cible);
    if (!elementsArray) return;

    const regles = CONFIG_SECTION[typeListe];
    if(sec_first) sec_first.style.display = (typeListe === "etu") ? "flex" : "none";

    if(conteneur_search_bar) conteneur_search_bar.style.display = regles.affichage.recherche ? "flex" : "none";
    if (regles.affichage.recherche && search_input_etu) search_input_etu.value = "";
    if(btn_supp_histo) {
        btn_supp_histo.style.display = regles.affichage.supp_histo ? "flex" : "none";
        if (tab_placer.length < 1) btn_supp_histo.style.display = "none";
    }
    
    if(btn_ajouter) {
        btn_ajouter.dataset.source = nom_cible;
        btn_ajouter.style.display = regles.affichage.bouton_ajout ? "flex" : "none";
    }

    if(label_nom_liste) {
        label_nom_liste.textContent = nom_cible;
        label_nom_liste.dataset.type = typeListe;
    }
    
    if(conteneur_liste_elements) conteneur_liste_elements.innerHTML = "";

    if (!elementsArray || elementsArray.length === 0) { //Si il n'y a pas de données, on affiche ce message
        if(conteneur_liste_elements) conteneur_liste_elements.innerHTML = "<div class='message_vide_menu'>Aucune donnée disponible</div>";
    } else {
        elementsArray.forEach((item, index) => {
            const ul = document.createElement("ul");
            ul.className = "bloc_element";
            ul.dataset.index = index;

            const contenu = generer_contenu_element(item, typeListe, index);
            contenu.forEach(html => {
                const li = document.createElement("li");
                li.innerHTML = html;
                ul.appendChild(li);
            });

            if (regles.affichage.icon_tierstemps && item.tiers_temps) {
                ul.appendChild(creer_icone_tier_temps());
            }

            const li_actions = document.createElement("li");
            li_actions.innerHTML = creer_icones(typeListe === "historique");
            ul.appendChild(li_actions);
            if(conteneur_liste_elements) conteneur_liste_elements.appendChild(ul);
        });
    }

    document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => s.classList.remove("sec_open"));
    if(sous_sec) sous_sec.classList.add("sec_open");
}

function generer_contenu_element(item, typeListe, index) {
    const regles = CONFIG_SECTION[typeListe];
    return regles.format_affichage ? regles.format_affichage(item, index) : [];
}

//FONCTION POUR CREER LES ICONES POUR LES LISTES ET ELEMENT --------------------------------------------------------------------------------------------------------------
function creer_icones(afficher_charger = false) {
    let html = `<div class="ul_icons">`;
    if (afficher_charger) {
        html += `<svg class="load_element" title="Charger ce placement" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.6667 3.66667H3.66667C2.95942 3.66667 2.28115 3.94762 1.78105 4.44771C1.28095 4.94781 1 5.62609 1 6.33333V19.6667C1 20.3739 1.28095 21.0522 1.78105 21.5523C2.28115 22.0524 2.95942 22.3333 3.66667 22.3333H17C17.7072 22.3333 18.3855 22.0524 18.8856 21.5523C19.3857 21.0522 19.6667 20.3739 19.6667 19.6667V11.6667M10.3333 13L22.3333 1M22.3333 7.66667V1H15.6667" stroke="#EBF5FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    html += `<svg class="trash_element" title="supprimer l'élément" width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.33333 9.33333H26.6667M13.3333 14.6667V22.6667M18.6667 14.6667V22.6667M6.66666 9.33333L7.99999 25.3333C7.99999 26.0406 8.28095 26.7189 8.78104 27.219C9.28114 27.719 9.95942 28 10.6667 28H21.3333C22.0406 28 22.7188 27.719 23.2189 27.219C23.719 26.7189 24 26.0406 24 25.3333L25.3333 9.33333M12 9.33333V5.33333C12 4.97971 12.1405 4.64057 12.3905 4.39052C12.6406 4.14048 12.9797 4 13.3333 4H18.6667C19.0203 4 19.3594 4.14048 19.6095 4.39052C19.8595 4.64057 20 4.97971 20 5.33333V9.33333" stroke="#FBFDFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg class="rename_element" title="modifier l'élément" width="24" height="24" viewBox="0 0 50 41" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.25 24.3333L22.9167 32.6667H43.75V24.3333H31.25ZM25.125 5.97915L6.25 24.8541V32.6667H14.0625L32.9375 13.7916L25.125 5.97915ZM38.9792 7.74998C39.7917 6.93748 39.7917 5.58332 38.9792 4.81248L34.1042 -0.0625169C33.7138 -0.45054 33.1858 -0.668335 32.6354 -0.668335C32.085 -0.668335 31.557 -0.45054 31.1667 -0.0625169L27.3542 3.74998L35.1667 11.5625L38.9792 7.74998Z" fill="#FBFDFF"/></svg>
    </div>`;
    return html;
}

// GESTION DES ACTIONS (Édition, Suppression, Chargement) ------------------------------------------------------------------------------------------------
let action_en_attente = null;

//MEMORISER LA SECTION PRECEDENTE
function memoriser_section_precedente() {
    const sections = document.querySelectorAll(".menu_deroulant_gauche section");
    // Recherche de la vraie section source qui n'est pas un panneau modale d'action
    const sec_ouverte = Array.from(sections).find(s => 
        s.classList.contains("sec_open") && 
        !s.classList.contains("supprimer_sec") && 
        !s.classList.contains("edition_sec") &&
        !s.classList.contains("charger_sec")
    );
    
    // Sécurité vitale : On n'écrase que si on a trouvé une source valide
    if (sec_ouverte) {
        section_precedente = sec_ouverte;
    }
}

// ouvre la section d'action (Édition, Suppression, Chargement)
function ouvrir_panneau_action(selecteur_panneau, callback_valider) {
    const panneau = document.querySelector(selecteur_panneau);
    if (!panneau) return;

    memoriser_section_precedente(); 
    action_en_attente = callback_valider; 

    // Cache tout (y compris etu_sec, historique_sec et sous_sec)
    document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => {
        s.classList.remove("sec_open");
    });
    
    panneau.classList.add("sec_open");
}

// FERMER LA SECTION D'ACTION --------------------------------------------------------------------------------------------------------------------------------------------------
function fermer_panneaux_action() {
    // Cache tous les panneaux d'actions possibles
    document.querySelectorAll(".menu_deroulant_gauche section").forEach(s => {
        s.classList.remove("sec_open");
    });
    
    action_en_attente = null; 

    if (section_precedente) {
        section_precedente.classList.add("sec_open");
    }
}

// -------------------------------------------------------------------------
// RACCOURCIS
// -------------------------------------------------------------------------
function ouvrir_menu_suppression(message_html, callback_action) {
    const msg_container = document.querySelector(".supprimer_sec .menu_message");
    if (msg_container) msg_container.innerHTML = message_html;
    ouvrir_panneau_action(".supprimer_sec", callback_action);
}

function ouvrir_menu_edition(titre_html, callback_action) {
    const titre_container = document.querySelector(".edition_sec .titre_edition_sec");
    if (titre_container) titre_container.innerHTML = titre_html;
    // CRUCIAL : On connecte le bouton valider à l'action d'édition
    ouvrir_panneau_action(".edition_sec", callback_action);
}

// FONCTION POUR SUPPRIMER UNE LISTE OU UN ELEMENT --------------------------------------------------------------------------------------------------------------------------
function supprimer(poubelle) {
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
            if (typeof remplir_select === "function") remplir_select();
            if (typeof generer_filtres === "function") generer_filtres();
            if (typeof verifier_capacite === "function") verifier_capacite();
            return true;
        });
        return;
    }

    const bloc_element = poubelle.closest(".bloc_element");
    if (bloc_element) {
        const element_supp = parseInt(bloc_element.dataset.index, 10);
        const list_el = document.querySelector(".nom_liste").textContent;
        const type_el = document.querySelector(".nom_liste").dataset.type;
        
        let nom_element_affiche = "cet élément";
        const config_speciale = Object.values(CONFIG_SECTION).find(c => c.nom_liste === list_el);
        
        if (config_speciale) {
            let tableau_a_jour = config_speciale.get_donnees(); //récupère la référence
            let obj = tableau_a_jour[element_supp]; //met à jour le tableau
            if (obj) nom_element_affiche = obj.nom_salle || obj.nom || obj.titre || "cet élément";
        } else {
            let listeEtu = getListeEtu(list_el);
            if (listeEtu && listeEtu.donnees[element_supp]) {
                nom_element_affiche = `${listeEtu.donnees[element_supp].nom} ${listeEtu.donnees[element_supp].prenom}`;
            }
        }

        ouvrir_menu_suppression(`Voulez-vous vraiment supprimer <b>${nom_element_affiche}</b> ?`, () => {
            if (config_speciale) {
                let tableau_a_jour = config_speciale.get_donnees(); //récupère la référence
                tableau_a_jour.splice(element_supp, 1); // On supprime dans le tableau
                sauvegarder(config_speciale.storage_key, tableau_a_jour);
                
                // Si on supprime une salle, on la retire des salles choisies
                if (type_el === "salle" && typeof salles_choisies !== "undefined") {
                    const index_salle = salles_choisies.findIndex(s => comparerNoms(s, nom_element_affiche));
                    if (index_salle !== -1) {
                        salles_choisies.splice(index_salle, 1);
                        if (typeof maj_select_salles_sup === "function") maj_select_salles_sup();
                        if (typeof dessiner_badges_salles === "function") dessiner_badges_salles();
                    }
                }
            } else {
                let listeEtu = getListeEtu(list_el);
                if (listeEtu) {
                    listeEtu.donnees.splice(element_supp, 1);
                    sauvegarder('tab_etu', tab_etu);
                }
            }

            ouvrir_details_liste(list_el, type_el);
            if (typeof remplir_select === "function") remplir_select();
            if (typeof generer_filtres === "function") generer_filtres();
            if (typeof verifier_capacite === "function") verifier_capacite();
            
            // On s'assure que le retour sera fait vers la liste des détails
            section_precedente = document.querySelector(".sous_sec");
            return true;
        });
    }
}

//FONCTION DE CLIC SUR L'ICONE MODIFIER ------------------------------------------------------------------------------------------------------------------------
function preparer_chargement_placement(cible) {
    const bloc = cible.closest(".bloc_element");
    if (bloc) {
        index_edition = parseInt(bloc.dataset.index, 10);
        ouvrir_panneau_action(".charger_sec", () => {
            charger_placement();
            return true;
        });
    }
}

// FONCTION POUR AJOUTER/MODIFIER UNE LISTE/ELEMENT --------------------------------------------------------------------------------------------------------------------------
function edition_formulaire() {
    const nom_liste = label_nom_liste ? label_nom_liste.textContent : ""; 
    
    if (mode_edition !== "modifier_liste") type_edition = label_nom_liste ? label_nom_liste.dataset.type : ""; 

    const texte_titre = (mode_edition === "modifier_liste") ? 
        "Renommer la liste" : (CONFIG_SECTION[type_edition] ? CONFIG_SECTION[type_edition].titres[mode_edition] : "Edition");

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

    let html_formulaire = "";
    
    // ON CRÉE LE CODE HTML DU FORMULAIRE (au lieu de le lire)
    if (mode_edition === "modifier_liste") {
        html_formulaire = generer_champ_input("Nouveau nom", "input_nom_liste", ancien_nom_liste);
    } else {
        const config = CONFIG_SECTION[type_edition];
        if (config && config.champs) {
            config.champs.forEach(champ => {
                let valeur_champ = (mode_edition === "modifier" && objet_a_editer[champ.id] !== undefined) ? objet_a_editer[champ.id] : "";
                html_formulaire += generer_champ_input(champ.label, `input_${champ.id}`, valeur_champ, champ.type);
            });
        }
    }

    const form_edition = document.querySelector(".form_edition");
    const edition_erreur = document.querySelector(".edition_erreur");
    
    if (form_edition) form_edition.innerHTML = html_formulaire;
    if (edition_erreur) edition_erreur.textContent = ""; 

    ouvrir_menu_edition(texte_titre, valider_edition); // ouvre la section appropriée
}

//FONCTION POUR VALIDER UN AJOUT/MODIFICATION D'UNE LISTE/ELEMENT --------------------------------------------------------------------------------------------------------
function valider_edition() {
    const edition_erreur = document.querySelector(".edition_erreur");
    if(edition_erreur) edition_erreur.textContent = ""; 

    //  Renommer le titre d'une liste
    if (mode_edition === "modifier_liste") {
        const input_nom = document.getElementById("input_nom_liste");
        let nouveau_nom_liste = input_nom ? input_nom.value.trim() : "";
        
        if (!nouveau_nom_liste) {
            if(edition_erreur) edition_erreur.textContent = "Le nom ne peut pas être vide.";
            return false; // Renvoie false pour bloquer la fermeture du panneau !
        }

        if (type_edition === "nom_liste_etu") {
            // Application de la vérification de nom unique
            nouveau_nom_liste = generer_nom_unique(nouveau_nom_liste, tab_etu, "nom_fichier", index_edition);

            let ancien_nom = tab_etu[index_edition].nom_fichier;
            tab_etu[index_edition].nom_fichier = nouveau_nom_liste;
            sauvegarder("tab_etu", tab_etu);

            maj_dependances_nom("etu", ancien_nom, nouveau_nom_liste); //On met à jour les selects et placements
            
            rafraichir_menu_principal(".etu_sec");

        }
        
        return true; // Action réussie
    } 
    
    // Modification d'un élément interne
    let nouvel_objet = {};
    const config = CONFIG_SECTION[type_edition];

    config.champs.forEach(champ => {
        let input_element = document.getElementById(`input_${champ.id}`);
        if (input_element) {
            let valeur = input_element.value.trim();
            if (champ.type === "number") valeur = parseInt(valeur) || 0; 
            nouvel_objet[champ.id] = valeur;
        }
    });

    const nom_liste = document.querySelector(".nom_liste").textContent;
    config.sauvegarder_element(nouvel_objet, mode_edition, index_edition, nom_liste);
    
    fermer_et_recharger(nom_liste);

    return true; // Action réussie
}

function generer_champ_input(label, id, valeur = "", type = "text") {
    return `<label class="champ_edition">
                <span class="label_texte">${label}</span>
                <input type="${type}" id="${id}" class="input_ligne" value="${valeur}">
            </label>`;
}

// FONCTIONS DE RAFRAICHISSEMENT CIBLÉ -------------------------------------------------------------------------------------------------
function fermer_formulaire(section_a_rouvrir) {
    if (section_a_rouvrir) section_precedente = section_a_rouvrir;
    fermer_panneaux_action();
}

function fermer_et_recharger(nom_liste) {
    const type_el = document.querySelector(".nom_liste").dataset.type; 
    ouvrir_details_liste(nom_liste, type_el);
    //force la mémoire pour revenir dans la liste des détails
    section_precedente = document.querySelector(".sous_sec");
}

function rafraichir_menu_principal(selecteur_section) {
    afficher_listes();
    if (typeof remplir_select === "function") remplir_select();
    if (typeof generer_filtres === "function") generer_filtres();
    //force la mémoire pour revenir dans le bon menu principal
    section_precedente = document.querySelector(selecteur_section);
}



// FONCTION POUR RECHERCHER UN ETUDIANT A PARTIR DE LA BARRE DE RECHERCHE --------------------------------------------------------------------------------------------
const searchInputMenu = document.querySelector(".search_bar input");
function rechercher_dans_menu(recherche) {
    recherche = recherche.toLowerCase().trim();
    const bloc_etu = document.querySelectorAll(".liste_elements .bloc_element");

    bloc_etu.forEach(bloc => {
        if (bloc.textContent.toLowerCase().includes(recherche)) {
            bloc.classList.remove("bloc_invisible");
        } else {
            bloc.classList.add("bloc_invisible");
        }
    });
}



// FONCTION POUR GERER LES CHECKBOX TIERS-TEMPS DANS LE MENU GAUCHE -----------------------------------------------------------------------------------
function maj_option_etudiant(cible) {
    const bloc = cible.closest(".bloc_element");
    const index = parseInt(bloc.dataset.index, 10);
    const nom_liste = document.querySelector(".nom_liste").textContent;
    let listeEtu = getListeEtu(nom_liste);

    if (listeEtu && cible.classList.contains("check_tier")) {
        listeEtu.donnees[index].tiers_temps = cible.checked;
        sauvegarder('tab_etu', tab_etu);

        if (typeof select_etu !== 'undefined' && select_etu.value === nom_liste) {
            if (typeof afficher_tableau === "function") afficher_tableau();
        }

        const existingIcon = bloc.querySelector(".icon_bloc_element");
        if (cible.checked && !existingIcon) {
            const actionsLi = bloc.querySelector(".ul_icons")?.closest("li");
            if (actionsLi) bloc.insertBefore(creer_icone_tier_temps(), actionsLi);
            else bloc.appendChild(creer_icone_tier_temps());
        } else if (!cible.checked && existingIcon) {
            existingIcon.remove();
        }
    }
}


//FONCTION POUR CREER L'ICONE TIER-TEMPS ----------------------------------------------------------------------------------------------------------------------------------
function creer_icone_tier_temps() {
    const li = document.createElement("li");
    li.className = "icon_bloc_element";
    li.innerHTML = typeof svg_tier_temps !== 'undefined' ? svg_tier_temps : 'T';
    return li;
}

//FONCTION DE CLIC SUR L'ICONE CHARGER ---------------------------------------------------------------------------------------------------------------------------------------
function preparer_edition_element(cible) {
    const bloc = cible.closest(".bloc_element"); 
    const liListe = cible.closest(".menu_ul > li"); 
    
    if (bloc) {
        index_edition = parseInt(bloc.dataset.index, 10);
        mode_edition = "modifier";
        edition_formulaire();
    } else if (liListe) {
        const isEtu = cible.closest(".etu_sec") !== null;
        type_edition = isEtu ? "nom_liste_etu" : "nom_liste_salle";
        index_edition = Array.from(liListe.parentNode.children).indexOf(liListe);
        ancien_nom_liste = liListe.dataset.name;
        mode_edition = "modifier_liste";
        edition_formulaire();
    }
}

//FONCTION POUR SUPPRIMER TOUT L'HISTORIQUE DES PLACEMENTS ----------------------------------------------------------------------------------------------------------------

function supp_histo_placement() {
    ouvrir_menu_suppression("Voulez-vous vraiment supprimer <b>tout l'historique des placements</b> ?", () => {
        tab_placer = [];
        sauvegarder("tab_placement", tab_placer);
        ouvrir_details_liste("Historique des placements", "historique");
        
        // On force le retour dans sous_sec
        section_precedente = document.querySelector(".sous_sec");
        return true;
    });
}