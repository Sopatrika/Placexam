//=============================================================================
// GESTION DE L'EXPORTATION DE FICHIERS
//=============================================================================

const btn_exporter_header = document.querySelector(".btn-exporter");
const menu_exporter = document.getElementById("menu_exporter");
const erreur_exporter = document.querySelector(".erreur_exporter");


//OUVERTURE DU MENU MAPPING ----------------------------------------------------------------------------------------------------------------------------------------------
function ouvrir_menu_export() {
    let titre_actuel = recuperer("placer_actuel");
    if (!titre_actuel) {
        alert("Aucun placement n'est actuellement affiché. Veuillez charger un placement.");
        return;
    }
    const erreur_exporter = document.querySelector(".erreur_exporter");
    if (erreur_exporter) erreur_exporter.textContent = ""; 
    document.getElementById("menu_exporter").classList.remove("menu_close");
    document.querySelector(".fond_sombre").classList.remove("menu_close");
}

//VALIDATION DES CHAMPS -------------------------------------------------------------------------------------------------------------------------------------
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
    
    // On ferme le menu car tout est bon
    if (menu_exporter) menu_exporter.classList.add("menu_close");
    if (fond_sombre) fond_sombre.classList.add("menu_close");
    
    // On lance la fonction finale avec les données
    exporter_placement_final(annee, date, debut, duree);
}

// FONCTION D'EXPORTATION ----------------------------------------------------------------------------------------------------------------------------------------------------
function exporter_placement_final(annee_choisie, date_choisie, debut_choisi, duree_choisie) {
    let titre_actuel = recuperer("placer_actuel");
    if (!titre_actuel) return;
    
    titre_actuel = String(titre_actuel).replace(/^"|"$/g, '').trim();
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

    // "met bien le nom du prof entre () de la matière" : Extraction du prof
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

    // Globale
    const wb_global = XLSX.utils.book_new();
    const ws_global = creer_feuille_complete(archive.donnees_placement);
    XLSX.utils.book_append_sheet(wb_global, ws_global, "Liste Globale");
    zip.file("Liste_Complete_Etudiants.xlsx", XLSX.write(wb_global, { bookType: 'xlsx', type: 'array' }));

    // EXCEL 2 : Émargements (Feuilles par salles)
    archive.salles_choisies.forEach(salle => {
        let etudiants_salle = archive.donnees_placement.filter(e => e.salle_attribuee === salle);
        if (etudiants_salle.length > 0) {
            const wb_salle = XLSX.utils.book_new();
            const ws_salle = creer_feuille_emargement(salle, etudiants_salle, infos_en_tete);
            XLSX.utils.book_append_sheet(wb_salle, ws_salle, "Emargement");
            let nom_fichier_salle = salle.replace(/[^a-z0-9]/gi, '_');
            zip.file(`Emargement_${nom_fichier_salle}.xlsx`, XLSX.write(wb_salle, { bookType: 'xlsx', type: 'array' }));
        }
    });

    // création du PV d'Examen 
    const pv_excel = generer_pv_examen(
        archive.donnees_placement,  // Tableau de placement
        infos_en_tete,              // Date, début, durée, prof...
        archive.salles_choisies,    // Salles
        archive.filtres.specialites // Les options (spécialités cochées)
    );
    zip.file("PV_Examen.xlsx", pv_excel);

    // Génération finale du ZIP
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





// FONCTION POUR GENERER LA FEUILLE COMPLETE DES ETUDIANTS -----------------------------------------------------------------------------------------------------------------
function creer_feuille_complete(etudiants) {
    let ws_data = [];
    const bordure = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    const styleEnteteTab = { font: { bold: true, sz: 12 }, border: bordure, alignment: { horizontal: "center", vertical: "center" }, fill: { fgColor: { rgb: "EFEFEF" } } };
    const styleCellule = { border: bordure, alignment: { vertical: "center", horizontal: "center" } };
    const styleCelluleGauche = { border: bordure, alignment: { vertical: "center", horizontal: "left" } };

    ws_data.push([
        { v: "NOM", s: styleEnteteTab }, { v: "PRÉNOM", s: styleEnteteTab }, { v: "SPÉCIALITÉ", s: styleEnteteTab },
        { v: "TIERS-TEMPS", s: styleEnteteTab }
    ]);
    
    etudiants.forEach(etu => {
        ws_data.push([
            { v: String(etu.nom).toUpperCase(), s: styleCelluleGauche }, { v: etu.prenom, s: styleCelluleGauche },
            { v: etu.specialite || "", s: styleCellule }, { v: etu.tiers_temps ? "Oui" : "", s: styleCellule }
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [ { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 } ];
    ws['!rows'] = [ { hpt: 30 } ];
    etudiants.forEach(() => ws['!rows'].push({ hpt: 25 }));

    return ws;
}





// FONCTION POUR GENERER LA FEUILLE D'EMARGEMENT ---------------------------------------------------------------------------------------------------------------------------
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
    // On tri dans l'ordre croissant des numéros des places.
    etudiants_salle.sort((a, b) => parseInt(a.place_attribuee) - parseInt(b.place_attribuee));
    
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


//FONCTION POUR GENERER LE PV d'EXAMEN ----------------------------------------------------------------------------------------------------------------------------------------
function generer_pv_examen(donnees_placement, infos, salles, specialites) {
    let annee_univ = infos.annee || (new Date().getFullYear() + "-" + (new Date().getFullYear() + 1));

    // Étudiants tiers-temps avec des virgules (ex: Prénom Nom, Prénom Nom)
    const etu_tiers = donnees_placement.filter(e => e.tiers_temps);
    const texte_tiers = etu_tiers.length > 0 
        ? etu_tiers.map(e => `${e.prenom} ${e.nom}`).join(", ") 
        : "Aucun";

    // Spécialités cochées 
    const texte_options = specialites && specialites.length > 0 ? specialites.join(", ") : "Aucune";

    const texte_legal = "L'usage de documents et matériels, notamment électroniques, lors des épreuves constitue un choix pédagogique, à la charge du responsable de l'enseignement. Cette information est portée à la connaissance des étudiants par tout moyen. Toute infraction à ces règles est signalée à la Présidence de l'Université en vue de poursuites disciplinaires devant la Section Disciplinaire de l'Université contre l'étudiant, auteur ou complice de la fraude ou tentative de fraude. Aux mêmes fins, le Directeur de la composante saisit la Présidence de l'Université lorsqu'une fraude ou tentative de fraude est commise à l'occasion d'une inscription ou lorsque l'étudiant est auteur ou complice d'un fait de nature à porter atteinte à l'ordre ou au bon fonctionnement de l'établissement, y inclus les infractions aux consignes de sécurité.";

    // --- STYLES ET BORDURES DU TABLEAU ---
    const bordure = {
        top: { style: "thin", color: { auto: 1 } },
        bottom: { style: "thin", color: { auto: 1 } },
        left: { style: "thin", color: { auto: 1 } },
        right: { style: "thin", color: { auto: 1 } }
    };
    
    const styleTitre = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center", vertical: "center" } };
    const styleSSTitre = { font: { bold: true, sz: 11 }, alignment: { horizontal: "center", vertical: "center" } };
    const styleLabel = { font: { bold: true }, border: bordure, alignment: { vertical: "center", horizontal: "left" }, fill: { fgColor: { rgb: "EFEFEF" } } };
    const styleValeur = { border: bordure, alignment: { vertical: "center", horizontal: "left", wrapText: true } };
    const styleVide = { border: bordure }; 
    const styleTexteLegal = { font: { italic: true, sz: 9 }, alignment: { wrapText: true, vertical: "top", horizontal: "justify" } };

    // --- CONSTRUCTION DE LA GRILLE EXCEL ---
    let ws_data = [
        ["", "", { v: "PROCES VERBAL D'EXAMEN", s: styleTitre }, "", ""], 
        ["", "", { v: "Année universitaire " + annee_univ, s: styleSSTitre }, "", ""], 
        [], 
        [{ v: "DATE :", s: styleLabel }, { v: infos.date || "", s: styleValeur }, "", { v: "Composante :", s: styleLabel }, { v: "ENSCMu", s: styleValeur }], 
        [{ v: "LISTE :", s: styleLabel }, { v: infos.liste || "", s: styleValeur }, "", { v: "Option :", s: styleLabel }, { v: texte_options, s: styleValeur }], 
        [{ v: "EXAMEN :", s: styleLabel }, { v: infos.matiere || "", s: styleValeur }, "", { v: "", s: styleVide }, { v: "", s: styleVide }], 
        [{ v: "ENSEIGNANT :", s: styleLabel }, { v: infos.prof || "", s: styleValeur }, "", { v: "Salle :", s: styleLabel }, { v: salles.join(" / "), s: styleValeur }], 
        [{ v: "SURVEILLANT :", s: styleLabel }, { v: "", s: styleValeur }, "", { v: "", s: styleVide }, { v: "", s: styleVide }], 
        [{ v: "LIEU :", s: styleLabel }, { v: "ENSCMu", s: styleValeur }, "", { v: "", s: styleVide }, { v: "", s: styleVide }], 
        [{ v: "DEBUT :", s: styleLabel }, { v: infos.debut || "", s: styleValeur }, "", { v: "Durée :", s: styleLabel }, { v: infos.duree ? infos.duree + " min" : "", s: styleValeur }], 
        [{ v: "Nbre d'étudiants présents :", s: styleLabel }, { v: donnees_placement.length.toString(), s: styleValeur }, "", { v: "", s: styleVide }, { v: "", s: styleVide }], 
        [], 
        // Emargement (Case vide)
        [{ v: "Emargement surveillants :", s: styleLabel }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }], 
        [{ v: "", s: styleLabel }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }], 
        // Tiers-temps
        [{ v: "Tiers temps :", s: styleLabel }, { v: texte_tiers, s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }], 
        [], 
        // Observations
        [{ v: "Observations éventuelles :", s: styleLabel }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }], 
        [{ v: "", s: styleLabel }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }], 
        [{ v: "", s: styleLabel }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }, { v: "", s: styleValeur }], 
        // Ligne légale
        [{ v: texte_legal, s: styleTexteLegal }, "", "", "", ""]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // --- FUSIONS DES CELLULES ---
    if(!ws["!merges"]) ws["!merges"] = [];
    ws["!merges"].push(
        { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } }, // Titre
        { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } }, // Sous-titre
        { s: { r: 12, c: 0 }, e: { r: 13, c: 0 } }, // Label Emargement (Hauteur)
        { s: { r: 12, c: 1 }, e: { r: 13, c: 4 } }, // Valeur Emargement (Grand espace)
        { s: { r: 14, c: 1 }, e: { r: 14, c: 4 } }, // Tiers-temps largeur
        { s: { r: 16, c: 0 }, e: { r: 18, c: 0 } }, // Label Observations (Hauteur)
        { s: { r: 16, c: 1 }, e: { r: 18, c: 4 } }, // Valeur Observations (Grand espace)
        { s: { r: 19, c: 0 }, e: { r: 24, c: 4 } }  // Texte légal en bas
    );

    // Ajuster la largeur des colonnes
    ws['!cols'] = [ {wch: 28}, {wch: 35}, {wch: 5}, {wch: 15}, {wch: 25} ];

    // Ajuster la hauteur des lignes
    ws['!rows'] = [];
    for(let i = 0; i < 25; i++) {
        ws['!rows'].push({ hpt: (i === 13 || i === 17 || i === 18) ? 40 : 25 });
    }
    ws['!rows'][0] = { hpt: 35 }; // Titre plus haut

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PV Examen");
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
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