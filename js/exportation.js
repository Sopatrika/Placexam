//=============================================================================
// GESTION DE L'EXPORTATION DE FICHIERS
//=============================================================================

const btn_exporter_header = document.querySelector(".btn-exporter");
const menu_exporter = document.getElementById("menu_exporter");
const erreur_exporter = document.querySelector(".erreur_exporter");


// 1. OUVERTURE DU MENU
if (btn_exporter_header) {
    btn_exporter_header.addEventListener("click", () => {
        // On utilise ta fonction personnalisée 'recuperer'
        let titre_actuel = recuperer("placer_actuel");
        
        if (!titre_actuel) {
            alert("Aucun placement n'est actuellement affiché. Veuillez charger un placement.");
            return;
        }

        if (erreur_exporter) erreur_exporter.textContent = ""; 
        
        // 🟢 AFFICHAGE : On enlève la classe qui cache les éléments
        if (menu_exporter) menu_exporter.classList.remove("menu_close");
        if (fond_sombre) fond_sombre.classList.remove("menu_close");
    });
}

// 2. GESTION DES BOUTONS (Annuler / Valider)
if (menu_exporter) {
    menu_exporter.addEventListener("click", (e) => {
        // Si on clique sur "Annuler"
        if (e.target.closest(".btn_annuler")) {
            // 🟢 MASQUAGE : On remet la classe qui cache
            menu_exporter.classList.add("menu_close");
            if (fond_sombre) fond_sombre.classList.add("menu_close");
        }

        // Si on clique sur "Valider"
        if (e.target.closest(".btn_valider")) {
            valider_et_lancer_export();
        }
    });
}

// 3. VALIDATION DES CHAMPS ET LANCEMENT
function valider_et_lancer_export() {
    const annee = document.getElementById("export_annee").value.trim();
    const date = document.getElementById("export_date").value.trim();
    const debut = document.getElementById("export_debut").value.trim();
    const duree = document.getElementById("export_duree").value.trim();

    if (!annee || !date || !debut || !duree) {
        if (erreur_exporter) erreur_exporter.textContent = "Veuillez remplir tous les champs.";
        return;
    }

    if (erreur_exporter) erreur_exporter.textContent = ""; 
    
    // 🟢 MASQUAGE : On ferme le menu car tout est bon
    if (menu_exporter) menu_exporter.classList.add("menu_close");
    if (fond_sombre) fond_sombre.classList.add("menu_close");
    
    // On lance la fonction finale avec les données
    exporter_placement_final(annee, date, debut, duree);
}

// 4. FONCTION FINALE D'EXPORTATION
function exporter_placement_final(annee_choisie, date_choisie, debut_choisi, duree_choisie) {
    let titre_actuel = recuperer("placer_actuel");
    if (!titre_actuel) return;
    
    // Nettoyage du titre
    titre_actuel = String(titre_actuel).replace(/^"|"$/g, '').trim();
    
    // On récupère l'historique proprement
    const historique_placements = recuperer("tab_placement") || [];
    const archive = historique_placements.find(p => String(p.titre).replace(/^"|"$/g, '').trim() === titre_actuel);

    if (!archive) {
        alert("Les données du placement sont introuvables.");
        return;
    }

    const select_matiere_val = document.querySelector("#select_matiere").value || "Inconnue";
    const liste_etu = document.querySelector("#select_etu").value || "Inconnue";
    
    let nom_matiere = select_matiere_val;
    let nom_prof = "Non renseigné";

    const match = select_matiere_val.match(/(.*?)\s*\((.*?)\)/);
    if (match) {
        nom_matiere = match[1].trim();
        nom_prof = match[2].trim();
    }

    const infos_en_tete = {
        liste: liste_etu,
        matiere: nom_matiere,
        prof: nom_prof,
        annee: annee_choisie,
        date: date_choisie,
        debut: debut_choisi,
        duree: duree_choisie
    };

    const zip = new JSZip();

    // EXCEL 1 : Globale
    const wb_global = XLSX.utils.book_new();
    const ws_global = creer_feuille_complete(archive.donnees_placement);
    XLSX.utils.book_append_sheet(wb_global, ws_global, "Liste Globale");
    const excel_global_buffer = XLSX.write(wb_global, { bookType: 'xlsx', type: 'array' });
    zip.file("Liste_Complete_Etudiants.xlsx", excel_global_buffer);

    // EXCEL 2 : Émargements
    archive.salles_choisies.forEach(salle => {
        let etudiants_salle = archive.donnees_placement.filter(e => e.salle_attribuee === salle);
        if (etudiants_salle.length > 0) {
            const wb_salle = XLSX.utils.book_new();
            const ws_salle = creer_feuille_emargement(salle, etudiants_salle, infos_en_tete);
            XLSX.utils.book_append_sheet(wb_salle, ws_salle, "Emargement");
            
            const excel_salle_buffer = XLSX.write(wb_salle, { bookType: 'xlsx', type: 'array' });
            let nom_fichier_salle = salle.replace(/[^a-z0-9]/gi, '_');
            zip.file(`Emargement_${nom_fichier_salle}.xlsx`, excel_salle_buffer);
        }
    });

    zip.generateAsync({ type: "blob" }).then(function(content) {
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `Export_Placement_${nom_matiere.replace(/[^a-z0-9]/gi, '_')}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}

// 5. FONCTIONS DE FORMATAGE (Stylisées)
function creer_feuille_complete(etudiants) {
    let ws_data = [];
    const bordure = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    const styleEnteteTab = { font: { bold: true, sz: 12 }, border: bordure, alignment: { horizontal: "center", vertical: "center" }, fill: { fgColor: { rgb: "EFEFEF" } } };
    const styleCellule = { border: bordure, alignment: { vertical: "center", horizontal: "center" } };
    const styleCelluleGauche = { border: bordure, alignment: { vertical: "center", horizontal: "left" } };

    ws_data.push([
        { v: "NOM", s: styleEnteteTab }, { v: "PRÉNOM", s: styleEnteteTab }, { v: "SPÉCIALITÉ", s: styleEnteteTab },
        { v: "TIERS-TEMPS", s: styleEnteteTab }, { v: "SALLE", s: styleEnteteTab }
    ]);
    
    etudiants.forEach(etu => {
        ws_data.push([
            { v: String(etu.nom).toUpperCase(), s: styleCelluleGauche }, { v: etu.prenom, s: styleCelluleGauche },
            { v: etu.specialite || "", s: styleCellule }, { v: etu.tiers_temps ? "Oui" : "", s: styleCellule },
            { v: etu.salle_attribuee || "", s: styleCellule }
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [ { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 } ];
    ws['!rows'] = [ { hpt: 30 } ];
    etudiants.forEach(() => ws['!rows'].push({ hpt: 25 }));

    return ws;
}

// Génère une feuille d'émargement avec un design "Grille Officielle" aligné
function creer_feuille_emargement(salle, etudiants_salle, infos) {
    let ws_data = [];

    // 🎨 CRÉATION DES STYLES (Design)
    const bordure = {
        top: { style: "thin", color: { auto: 1 } },
        bottom: { style: "thin", color: { auto: 1 } },
        left: { style: "thin", color: { auto: 1 } },
        right: { style: "thin", color: { auto: 1 } }
    };

    const styleTitre = { font: { bold: true, sz: 22, color: { rgb: "000000" } }, alignment: { horizontal: "center", vertical: "center" } };
    const styleSSTitre = { font: { bold: true, italic: true, sz: 12, color: { rgb: "555555" } }, alignment: { horizontal: "center", vertical: "center" } };

    // Styles pour la grille d'informations du haut
    const styleLabelInfo = { font: { bold: true, sz: 11 }, border: bordure, alignment: { horizontal: "right", vertical: "center" }, fill: { fgColor: { rgb: "EFEFEF" } } };
    const styleValeurInfo = { font: { bold: true, sz: 11 }, border: bordure, alignment: { horizontal: "center", vertical: "center" } };
    
    // Styles pour le tableau principal
    const styleEnteteTab = { font: { bold: true, sz: 12 }, border: bordure, alignment: { horizontal: "center", vertical: "center" }, fill: { fgColor: { rgb: "D9D9D9" } } }; // Gris un peu plus sombre pour démarquer
    const styleCellule = { border: bordure, alignment: { vertical: "center", horizontal: "center" } };
    const styleCelluleGauche = { border: bordure, alignment: { vertical: "center", horizontal: "left" } };

    // 📝 REMPLISSAGE DES TEXTES ET APPLICATION DES STYLES
    
    // Lignes 1 & 2 : Titre et Sous-titre (pour compenser l'absence du logo image)
    ws_data.push([ { v: "FEUILLE D'ÉMARGEMENT", s: styleTitre }, "", "", "", "", "" ]);
    ws_data.push([ { v: "École Nationale Supérieure de Chimie de Mulhouse (ENSCMu)", s: styleSSTitre }, "", "", "", "", "" ]);
    ws_data.push([]); // Ligne 3 : Vide
    
    // 📊 GRILLE D'INFORMATIONS (Alignée parfaitement sur les 6 colonnes du tableau !)
    
    // Ligne 4
    ws_data.push([ 
        { v: "Année univ. :", s: styleLabelInfo }, { v: infos.annee, s: styleValeurInfo }, 
        { v: "Date :", s: styleLabelInfo }, { v: infos.date, s: styleValeurInfo }, 
        { v: "Début :", s: styleLabelInfo }, { v: infos.debut, s: styleValeurInfo } 
    ]);
    
    // Ligne 5
    ws_data.push([ 
        { v: "Matière :", s: styleLabelInfo }, { v: infos.matiere, s: styleValeurInfo }, 
        { v: "Salle :", s: styleLabelInfo }, { v: salle, s: styleValeurInfo }, 
        { v: "Durée :", s: styleLabelInfo }, { v: infos.duree + " min", s: styleValeurInfo } 
    ]);
    
    // Ligne 6 (Petit bonus : le nombre d'étudiants se calcule tout seul !)
    ws_data.push([ 
        { v: "Professeur :", s: styleLabelInfo }, { v: infos.prof, s: styleValeurInfo }, 
        { v: "Liste :", s: styleLabelInfo }, { v: infos.liste, s: styleValeurInfo }, 
        { v: "Étudiants :", s: styleLabelInfo }, { v: etudiants_salle.length, s: styleValeurInfo } 
    ]);
    
    ws_data.push([]); // Ligne 7 : Vide avant le tableau
    
    // 📝 Ligne 8 : En-têtes du tableau
    ws_data.push([
        { v: "NOM", s: styleEnteteTab },
        { v: "PRÉNOM", s: styleEnteteTab },
        { v: "PLACE", s: styleEnteteTab },
        { v: "TIERS-TEMPS", s: styleEnteteTab },
        { v: "PRÉSENCE", s: styleEnteteTab },
        { v: "REMISE COPIE", s: styleEnteteTab }
    ]);
    
    // Remplissage des étudiants
    etudiants_salle.forEach(etu => {
        ws_data.push([
            { v: String(etu.nom).toUpperCase(), s: styleCelluleGauche },
            { v: etu.prenom, s: styleCelluleGauche },
            { v: etu.place_attribuee, s: styleCellule },
            { v: etu.tiers_temps ? "Oui" : "", s: styleCellule },
            { v: "", s: styleCellule }, // Case pour signer
            { v: "", s: styleCellule }  // Case pour la copie
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // 📏 RÉGLAGES DES DIMENSIONS
    
    // 1. Fusions (Titre et Sous-titre)
    ws['!merges'] = [ 
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Fusion du Titre sur les 6 colonnes
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }  // Fusion du Sous-titre
    ];

    // 2. Largeur des colonnes (Ajusté pour que la grille du haut épouse parfaitement le tableau du bas)
    ws['!cols'] = [
        { wch: 22 }, // Col A : Label 1  / NOM
        { wch: 22 }, // Col B : Valeur 1 / PRÉNOM
        { wch: 12 }, // Col C : Label 2  / PLACE
        { wch: 18 }, // Col D : Valeur 2 / TIERS-TEMPS
        { wch: 25 }, // Col E : Label 3  / PRÉSENCE (Large pour bien signer)
        { wch: 20 }  // Col F : Valeur 3 / REMISE COPIE
    ];

    // 3. Hauteur des lignes
    ws['!rows'] = [
        { hpt: 45 }, // Ligne 1 : Gros titre
        { hpt: 20 }, // Ligne 2 : Sous-titre ENSCMu
        { hpt: 15 }, // Ligne 3 : Vide
        { hpt: 25 }, // Ligne 4 : Grille d'info
        { hpt: 25 }, // Ligne 5 : Grille d'info
        { hpt: 25 }, // Ligne 6 : Grille d'info
        { hpt: 15 }, // Ligne 7 : Vide
        { hpt: 35 }  // Ligne 8 : En-têtes du tableau
    ];

    etudiants_salle.forEach(() => {
        ws['!rows'].push({ hpt: 45 }); 
    });
    
    return ws;
}




// EXPORTER LES DONNÉES EN JSON ------------------------------------------------------------------------------------------------------------------------------------
function exporterDonnees() {
    const data = {
        tab_etu: tab_etu,
        tab_filtres_spe: tab_filtres_spe,
        tab_matiere: tab_matiere,
        tab_placement: tab_placer,
        tab_salles: tab_salles
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Nom du fichier : Placexam_export_YYYYMMDD_HHMMSS.json
    const now = new Date();
    const dateStr = now.getFullYear() + 
                    String(now.getMonth()+1).padStart(2,'0') + 
                    String(now.getDate()).padStart(2,'0') + '_' +
                    String(now.getHours()).padStart(2,'0') + 
                    String(now.getMinutes()).padStart(2,'0') + 
                    String(now.getSeconds()).padStart(2,'0');
    const filename = `Placexam_export_${dateStr}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}