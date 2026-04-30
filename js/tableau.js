
//=================================================================================================================================================================
// GESTION DE L'AFFICHAGE DE TABLEAU ET DES FILTRES DYNAMIQUES
//=================================================================================================================================================================

// --- 1. ECOUTEUR GLOBAL DES FILTRES DE PARCOURS ---
if (conteneur_filtres) {
    conteneur_filtres.addEventListener("change", (e) => {
        if (e.target.classList.contains("check-parcours")) {
            const nomParcours = e.target.value; 
            const nom_liste_actuelle = select_etu.value;
            
            if (!tab_filtres_prc[nom_liste_actuelle]) tab_filtres_prc[nom_liste_actuelle] = {};

            tab_filtres_prc[nom_liste_actuelle][nomParcours] = e.target.checked;
            sauvegarder('tab_filtres_prc', tab_filtres_prc);
            
            afficher_tableau();
        }
    });
}

// --- 2. GESTION DES SELECTS (Menus déroulants) ---
function creer_option(element, liste) {
    const option = document.createElement("option");
    option.value = element;
    option.textContent = element;
    liste.appendChild(option);
}

function remplir_select() {
    select_etu.innerHTML = "";
    select_salle.innerHTML = "";
    if (select_matiere) select_matiere.innerHTML = "";

    Object.values(tab_etu).forEach( liste_etu => { 
        creer_option(liste_etu.nom_fichier, select_etu);
    });
    Object.values(tab_salles).forEach( salle_obj => { 
        creer_option(salle_obj.nom_salle, select_salle); 
    });
    if (select_matiere) {
        Object.values(tab_matiere).forEach(matiere => { 
            creer_option(matiere, select_matiere);
        });
    }
}

// --- 3. GENERATION DES FILTRES DE PARCOURS ---
const filtres_color = ['#3B82F6', '#EF4444', '#1ac58c', '#F59E0B', '#8B5CF6', '#06B6D4']; 
select_etu.addEventListener("change", generer_filtres);

function generer_filtres() {
    conteneur_filtres.innerHTML = "";
    let liste_select = getListeEtu(select_etu.value);
    
    if (!liste_select) {
        afficher_tableau();
        return;
    }

    const list_parcours = [...new Set(liste_select.donnees.map(etu => etu.parcours))];
    const nom_liste_actuelle = select_etu.value; 

    if (!tab_filtres_prc[nom_liste_actuelle]) {
        tab_filtres_prc[nom_liste_actuelle] = {};
    }

    list_parcours.forEach((parcours, index) => {
        const couleur = filtres_color[index % filtres_color.length];
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

    afficher_tableau();
}

function nettoyer_filtres() {
    const noms_listes_existantes = tab_etu.map(liste => liste.nom_fichier);
    for (let nom_liste_sauvegardee in tab_filtres_prc) {
        if (!noms_listes_existantes.includes(nom_liste_sauvegardee)) {
            delete tab_filtres_prc[nom_liste_sauvegardee]; 
        }
    }
    sauvegarder('tab_filtres_prc', tab_filtres_prc);
}

// --- 4. AFFICHAGE DU TABLEAU ---
function afficher_tableau() {
    tableau_etu.innerHTML = "";
    let liste_select = getListeEtu(select_etu.value);
    if (!liste_select) return;

    const parcours_actifs = Array.from(document.querySelectorAll(".check-parcours:checked")).map(cb => cb.value); 
    const donnees_filtrees = liste_select.donnees.filter(etu => parcours_actifs.includes(etu.parcours)); 
    const btn_tri_tiers = document.querySelector(".tri_tiers_temps"); 
    
    if (btn_tri_tiers && btn_tri_tiers.checked) {
        donnees_filtrees.sort((a, b) => {
            if (a.tiers_temps && !b.tiers_temps) return -1; 
            if (!a.tiers_temps && b.tiers_temps) return 1; 
            return 0;
        });
    }

    const svg_sablier = `
        <svg class="icon_tiers-temps" width="16" height="20" viewBox="0 0 16 20">
            <use href="#icon-sablier"></use>
        </svg>
    `;

    let lignes_html = [];

    donnees_filtrees.forEach((etu) => {
        const tiers_temps = etu.tiers_temps ? svg_sablier : "";
        
        lignes_html.push(`
            <tr>
                <td>${etu.nom}</td>
                <td>${etu.prenom}</td>
                <td>${etu.parcours}</td>
                <td></td>
                <td>${tiers_temps}</td>
                <td>
                    <label class="badge-checkbox" style="--checkcolor: var(--black);">
                        <input type="checkbox" class="check-absence" data-nom="${etu.nom}" data-prenom="${etu.prenom}">
                        <span class="badge-text"></span>
                        <span class="custom-checkbox"></span>
                    </label>
                </td> 
            </tr>
        `);
    });

    document.querySelector(".exam-table tbody").innerHTML = lignes_html.join("");

    if (typeof verifier_capacite === "function") verifier_capacite();
}

// Écouteur pour le bouton Tiers Temps
const btn_tri_tiers = document.querySelector(".tri_tiers_temps");
if(btn_tri_tiers) btn_tri_tiers.addEventListener("change", afficher_tableau);

// --- 5. INITIALISATION ---
remplir_select(); 
// EnregChoix(); // Dé-commente cette ligne si tu as toujours la fonction dans script.js
generer_filtres();