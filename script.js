(function () {

    // ---------------- reference data ----------------
    const CRITERIA = [
        { key: 'client', label: 'Bénéfice Client', question: 'Le Client tire-t-il un bénéfice réel et direct de la transformation ?', pathologyOrange: 'Erreur de cadrage', pathologyRouge: 'Captation du but', motivation: "Comment mesurerez-vous ce bénéfice ?" },
        { key: 'acteurs', label: 'Moyens des Acteurs', question: 'Les Acteurs ont-ils concrètement les moyens d\u2019exécuter la transformation ?', pathologyOrange: 'Illusion d\u2019exécution', pathologyRouge: 'Dérive des attributs', motivation: "Qu’est-ce qui manque pour atteindre le niveau complet ?" },
        { key: 'owner', label: 'Pouvoir de l\u2019Owner', question: 'L\u2019Owner a-t-il, dans les faits, le pouvoir d\u2019arbitrer ?', pathologyOrange: 'Trou de gouvernance', pathologyRouge: 'Illusion de contrôle', motivation: "Qui d’autre pourrait bloquer T ?" },
        { key: 'w', label: 'Solidité de W', question: 'La croyance (W) résiste-t-elle à une reformulation ou à des faits contraires ?', pathologyOrange: 'Faux garant', pathologyRouge: 'Dogme', motivation: "Qu’est-ce qui pourrait invalider cette croyance ?" }
    ];

    function pathologyFor(c, niveau) {
        if (niveau === 'orange') return c.pathologyOrange;
        if (niveau === 'rouge') return c.pathologyRouge;
        return '';
    }

    const PRIORITY_ORDER = { owner: 0, acteurs: 1, w: 2, client: 3 };

    function rankWeak(weak) {
        const niveauRank = { rouge: 0, orange: 1 };
        return weak.slice().sort((a, b) => {
            const na = niveauRank[state.s5.notes[a.key].niveau];
            const nb = niveauRank[state.s5.notes[b.key].niveau];
            if (na !== nb) return na - nb;
            return PRIORITY_ORDER[a.key] - PRIORITY_ORDER[b.key];
        });
    }

    function freshState() {
        return {
            meta: { dirigeant: '', entreprise: '', date: new Date().toISOString().slice(0, 10) },
            s0: { contexte: '', attentes: '', reglesJeu: '', objectifsCoach: '' },
            s1: { enonce: '', declencheur: '' },
            s2: { acteurs: '', ressources: '', contraintes: '', tensions: '', dynamiquesCachees: '', acteursExclus: '', effetsSystemiques: '' },
            s3: { x: '', a: '', b: '', c: '', w: '', valeursW: '' },
            s4: { client: '', acteurs: '', owner: '', environnement: '', victimesPotentielles: '', beneficiairesIndirects: '' },
            s4_1: { acteurConfronte: '', wAutreActeur: '', divergences: '', convergences: '' },
            s5: {
                notes: { client: { niveau: null, justif: '' }, acteurs: { niveau: null, justif: '' }, owner: { niveau: null, justif: '' }, w: { niveau: null, justif: '' } }
            },
            s6: {
                hierarchieNote: '', levier: '', effetsSystemiques: '', porteur: '', signal: '', delaiRevue: ''
            },
            s7: { resultats: '', ecarts: '', ajustements: '', prochaineIteration: '', lecons: '' }
        };
    }

    let state = freshState();

    const STEP_LABELS = ['Préparation de la séance', 'Cadrage & verbalisation', 'Cartographie du réel', 'Transformation & Weltanschauung', 'CATWOE', 'Confrontation des perspectives', 'Test de validation', 'Pathologies & plan d\u2019action', 'Boucle itérative & suivi', 'Synthèse'];
    const DOT_LABELS = ['0', '1', '2', '3', '4', '4.1', '5', '6', '7', '\u2713'];
    let current = 0;
    const LAST_STEP = 9;
    const LEVER_FROM = 7; // steps 6, 7 et synthèse gardent l'accent bronze

    // ---------------- helpers ----------------
    function el(tag, attrs, children) {
        const e = document.createElement(tag);
        if (attrs) for (const k in attrs) {
            if (k === 'class') e.className = attrs[k];
            else if (k === 'html') e.innerHTML = attrs[k];
            else e.setAttribute(k, attrs[k]);
        }
        (children || []).forEach(c => e.appendChild(c));
        return e;
    }

    function field(labelText, subText, key, obj, opts) {
        opts = opts || {};
        const wrap = el('div', { class: 'field' });
        const label = el('label', {}, [document.createTextNode(labelText)]);
        if (subText) label.appendChild(el('span', { class: 'sub' }, [document.createTextNode(subText)]));
        wrap.appendChild(label);
        let input;
        if (opts.textarea) {
            input = el('textarea', { rows: opts.rows || 2, placeholder: opts.placeholder || '' });
        } else {
            input = el('input', { type: opts.type || 'text', placeholder: opts.placeholder || '' });
        }
        input.value = obj[key] || '';
        input.addEventListener('input', () => { obj[key] = input.value; });
        wrap.appendChild(input);
        return wrap;
    }

    function subsection(labelText) {
        const wrap = el('div', { class: 'subsection' });
        wrap.appendChild(el('p', { class: 'subsection-label' }, [document.createTextNode(labelText)]));
        return wrap;
    }

    function sliderField(labelText, subText, key, obj, onChange, dangerWhenBelow) {
        const wrap = el('div', { class: 'field slider-field' });

        // Label et sous-texte
        const label = el('label', {}, [document.createTextNode(labelText)]);
        if (subText) label.appendChild(el('span', { class: 'sub' }, [document.createTextNode(subText)]));
        wrap.appendChild(label);

        // Slider et chiffre dans le bouton
        const sliderRow = el('div', { class: 'slider-row' });
        const input = el('input', { type: 'range', min: '1', max: '10', step: '1' });
        input.value = obj[key];

        const thumbValue = el('span', { class: 'slider-thumb-value' }, [document.createTextNode(String(obj[key]))]);

        sliderRow.appendChild(input);
        sliderRow.appendChild(thumbValue);
        wrap.appendChild(sliderRow);

        function updateThumbPosition() {
            const min = parseFloat(input.min) || 1;
            const max = parseFloat(input.max) || 10;
            const val = parseFloat(input.value);
            const percent = (val - min) / (max - min);
            thumbValue.style.left = `calc(${percent * 100}% + ${(0.5 - percent) * 28}px)`;
        }

        function paint() {
            const below = (typeof dangerWhenBelow === 'number') && obj[key] < dangerWhenBelow;
            wrap.classList.toggle('warn-inline', !!below);
        }

        input.addEventListener('input', () => {
            obj[key] = parseInt(input.value, 10);
            thumbValue.textContent = String(obj[key]);
            updateThumbPosition();
            paint();
            if (onChange) onChange();
        });

        requestAnimationFrame(() => updateThumbPosition());
        paint();

        return wrap;
    }

    function weakCriteria() {
        return CRITERIA.filter(c => {
            const n = state.s5.notes[c.key].niveau;
            return n === 'orange' || n === 'rouge';
        });
    }

    // ---------------- slide 0 — Préparation de la séance ----------------
    function buildSlide0() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('00')]), document.createTextNode(' — Préparation de la séance')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Avec qui travaillez-vous, et sur quel cadre vous accordez-vous ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Les données restent en mémoire du navigateur — copiez ou imprimez la synthèse en fin de séance.')]));

        const grid = el('div', { class: 'grid-3' });
        grid.appendChild(field('Dirigeant', null, 'dirigeant', state.meta, { placeholder: 'Nom du dirigeant' }));
        grid.appendChild(field('Entreprise', null, 'entreprise', state.meta, { placeholder: 'Nom de la structure' }));
        grid.appendChild(field('Date de la séance', null, 'date', state.meta, { type: 'date' }));
        wrap.appendChild(grid);

        // const sub = subsection('Cadre de la séance');
        wrap.appendChild(field('Contexte de la séance', '"Qu’est-ce qui vous amène à travailler sur ce sujet aujourd’hui ?", "Depuis combien de temps ce problème existe-t-il ?"', 'contexte', state.s0, { textarea: true, rows: 2, placeholder: 'Ex : « Je veux résoudre un conflit entre deux services avant qu\u2019il n\u2019impacte nos livraisons. »' }));
        wrap.appendChild(field('Attentes du dirigeant', '"À la fin de cette séance, qu’est-ce qui vous ferait dire que c’était utile : comprendre le problème, trouver des solutions, ou les deux ? "', 'attentes', state.s0, { textarea: true, rows: 2, placeholder: 'Ex : « Une feuille de route claire pour les 3 prochains mois. »' }));
        // sub.appendChild(field('Règles du jeu', 'accord sur la confidentialité, la durée, le droit de challenger ses hypothèses', 'reglesJeu', state.s0, { textarea: true, rows: 2 }));
        // sub.appendChild(field('Objectifs du coach', 'ce que vous voulez obtenir de cette séance, en tant que facilitateur', 'objectifsCoach', state.s0, { textarea: true, rows: 2 }));
        // wrap.appendChild(sub);
        return wrap;
    }

    // ---------------- slide 1 — Cadrage & verbalisation ----------------
    function buildSlide1() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('01')]), document.createTextNode(' — Cadrage & verbalisation')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Quel est le problème, tel qu\u2019il se pose aujourd\u2019hui ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Laissez parler deux minutes, puis notez la formulation sans la rendre plus élégante ou plus théorique qu\u2019elle ne l\u2019est. Validez-la ensuite par un « oui » net.')]));
        wrap.appendChild(field('L\u2019énoncé brut du problème', '"Pouvez-vous me décrire le problème tel que vous le voyez aujourd’hui ?"', 'enonce', state.s1, { textarea: true, rows: 2, placeholder: 'Ex : « On a des problèmes de communication entre les équipes, et ça bloque nos projets. »' }));
        wrap.appendChild(field('Le déclencheur récent', '"Qu’est-ce qui a changé récemment pour que ce problème devienne une priorité ?"', 'declencheur', state.s1, { textarea: true, rows: 2, placeholder: 'Ex : « Un client a annulé un contrat à cause d\u2019un retard de livraison. »' }));
        return wrap;
    }

    // ---------------- slide 2 — Cartographie du réel ----------------
    function buildSlide2() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('02')]), document.createTextNode(' — Cartographie de la situation réelle')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Que se passe-t-il réellement sur le terrain ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Les faits observés — pas l\u2019organigramme théorique.')]));
        const grid = el('div', { class: 'grid-2' });
        grid.appendChild(field('Acteurs réels', 'Personnes ou groupes réellement impliqués (pas ceux qui devraient l’être).', 'acteurs', state.s2, { textarea: true, rows: 3 }));
        grid.appendChild(field('Ressources effectives', 'Temps, budget, compétences disponibles en pratique.', 'ressources', state.s2, { textarea: true, rows: 3 }));
        grid.appendChild(field('Contraintes dures', 'Règles, délais légaux, limites non négociables.', 'contraintes', state.s2, { textarea: true, rows: 3 }));
        grid.appendChild(field('Points de tension', 'Frictions, blocages, conflits observés sur le terrain.', 'tensions', state.s2, { textarea: true, rows: 3 }));
        grid.appendChild(field('Dynamiques cachées', 'Conflits informels, alliances, ou intérêts non avoués.', 'dynamiquesCachees', state.s2, { textarea: true, rows: 2, placeholder: 'Ex : « Le commercial veut minimiser les coûts, la logistique veut maximiser la qualité. »' }));
        wrap.appendChild(grid);

        // const sub = subsection('Lecture élargie (dimension éthique et systémique)');
        // sub.appendChild(field('Acteurs exclus', 'personnes non représentées mais impactées par le problème', 'acteursExclus', state.s2, { textarea: true, rows: 2 }));
        // sub.appendChild(field('Effets systémiques', 'impact du problème sur d\u2019autres parties du système', 'effetsSystemiques', state.s2, { textarea: true, rows: 2 }));
        // wrap.appendChild(sub);
        return wrap;
    }

    // ---------------- slide 3 — Transformation & Weltanschauung ----------------
    function sentInput(key, placeholder, size) {
        const i = el('input', { type: 'text', class: 'w-' + size, placeholder });
        i.value = state.s3[key] || '';
        i.addEventListener('input', () => { state.s3[key] = i.value; });
        return i;
    }

    function buildSlide3() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('03')]), document.createTextNode(' — Transformation & Weltanschauung')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Quel changement voulez-vous obtenir, et pourquoi y croyez-vous ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Complétez la phrase — le gabarit force la précision.')]));

        const s = el('p', { class: 'sentence' });
        s.appendChild(document.createTextNode('Transformer '));
        s.appendChild(sentInput('x', '[X] ce qui doit changer', 'x'));
        s.appendChild(document.createTextNode(' de '));
        s.appendChild(sentInput('a', '[A] la situation problématique', 'etat'));
        s.appendChild(document.createTextNode(' à '));
        s.appendChild(sentInput('b', '[B] la situation idéale après la transformation', 'etat'));
        s.appendChild(document.createTextNode(' pour '));
        s.appendChild(sentInput('c', '[C] pourquoi cette transformation est importante', 'c'));
        s.appendChild(document.createTextNode(', car '));
        s.appendChild(sentInput('w', '[W] la croyance profonde qui justifie la transformation', 'w'));
        s.appendChild(document.createTextNode('.'));
        wrap.appendChild(s);

        // const sub = subsection('Légitimité de W');
        // sub.appendChild(field('Valeurs associées à W', 'ex : transparence, efficacité, équité — ce qui rend cette croyance défendable', 'valeursW', state.s3, { textarea: true, rows: 2 }));
        // wrap.appendChild(sub);
        return wrap;
    }

    // ---------------- slide 4 — CATWOE ----------------
    function buildSlide4() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('04')]), document.createTextNode(' — Filtrage des 4 rôles (CATWOE)')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Qui est réellement concerné par cette transformation ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('On ne recartographie pas tout — on filtre uniquement pour le T formulé à l\u2019étape précédente.')]));

        const grid = el('div', { class: 'grid-2' });
        grid.appendChild(field('Client', 'le bénéficiaire réel et direct de T', 'client', state.s4, { textarea: true, rows: 2 }));
        grid.appendChild(field('Acteurs', "ceux qui exécutent T ou en subissent l'impact", 'acteurs', state.s4, { textarea: true, rows: 2 }));
        grid.appendChild(field('Owner', 'celui qui a le pouvoir réel d\u2019arrêter ou de bloquer T', 'owner', state.s4, { textarea: true, rows: 2 }));
        grid.appendChild(field('Environnement', 'contraintes externes spécifiques à T', 'environnement', state.s4, { textarea: true, rows: 2 }));
        grid.appendChild(field('Victimes potentielles', 'acteurs qui pourraient subir des conséquences négatives de T', 'victimesPotentielles', state.s4, { textarea: true, rows: 2 }));
        grid.appendChild(field('Bénéficiaires indirects', 'acteurs qui bénéficieraient indirectement de T', 'beneficiairesIndirects', state.s4, { textarea: true, rows: 2 }));
        wrap.appendChild(grid);

        return wrap;
    }

    // ---------------- slide 4.1 — Confrontation des perspectives ----------------
    function buildSlide4_1() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('04.1')]), document.createTextNode(' — Confrontation des perspectives')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Que dirait un autre acteur du CATWOE, à la place du dirigeant ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Faites parler le dirigeant à la place de cet acteur — sans qu\u2019il en ait forcément discuté avec lui.')]));

        const grid = el('div', { class: 'grid-2' });
        grid.appendChild(field('Acteur confronté', 'un des rôles identifiés à l\u2019étape CATWOE', 'acteurConfronte', state.s4_1, { placeholder: 'Ex : le service logistique' }));
        grid.appendChild(field('Sa W supposée', 'comment cet acteur décrirait-il le problème, selon le dirigeant ?', 'wAutreActeur', state.s4_1, { textarea: true, rows: 2 }));
        grid.appendChild(field('Divergences', 'différences majeures avec la W du dirigeant', 'divergences', state.s4_1, { textarea: true, rows: 2 }));
        grid.appendChild(field('Convergences', 'points sur lesquels tout le monde s\u2019accorde', 'convergences', state.s4_1, { textarea: true, rows: 2 }));
        wrap.appendChild(grid);

        return wrap;
    }

    // ---------------- slide 5 — Test de validation ----------------
    function levelButtons(labelText, subText, key, obj, pathologyOrange, pathologyRouge, onChange) {
        const wrap = el('div', { class: 'field slider-field' });

        const label = el('label', {}, [document.createTextNode(labelText)]);
        if (subText) label.appendChild(el('span', { class: 'sub' }, [document.createTextNode(subText)]));
        wrap.appendChild(label);

        const toggle = el('div', { class: 'toggle toggle3' });
        const btnVert = el('button', { type: 'button', class: 'lvl-btn lvl-vert' }, [document.createTextNode('Complètement')]);
        const btnOrange = el('button', { type: 'button', class: 'lvl-btn lvl-orange' }, [document.createTextNode('Partiellement')]);
        const btnRouge = el('button', { type: 'button', class: 'lvl-btn lvl-rouge' }, [document.createTextNode('Non')]);

        const warnText = el('p', { class: 'warn-text' });

        function refresh() {
            const n = obj[key].niveau;
            btnVert.classList.toggle('selected', n === 'vert');
            btnOrange.classList.toggle('selected', n === 'orange');
            btnRouge.classList.toggle('selected', n === 'rouge');
            warnText.textContent = n === 'orange' ? ('\u26A0 ' + pathologyOrange)
                : n === 'rouge' ? ('\u26A0 ' + pathologyRouge)
                    : '';
            wrap.classList.toggle('warn-inline', n === 'orange' || n === 'rouge');
        }

        function select(v) {
            obj[key].niveau = (obj[key].niveau === v) ? null : v;
            refresh();
            if (onChange) onChange();
        }

        btnVert.addEventListener('click', () => select('vert'));
        btnOrange.addEventListener('click', () => select('orange'));
        btnRouge.addEventListener('click', () => select('rouge'));

        toggle.appendChild(btnVert); toggle.appendChild(btnOrange); toggle.appendChild(btnRouge);
        wrap.appendChild(toggle);
        wrap.appendChild(warnText);

        refresh();
        return wrap;
    }

    // ---------------- slide 5 — Test de validation ----------------
    function buildSlide5() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('05')]), document.createTextNode(' — Test de validation')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('La transformation résiste-t-elle à l\u2019épreuve des faits ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Pour chaque critère, choisissez le niveau observé, puis justifiez.')]));

        const grid = el('div', { class: 'grid-2' });

        CRITERIA.forEach(c => {
            const data = state.s5.notes[c.key];
            const block = el('div', { class: 'crit-block' });

            block.appendChild(levelButtons(c.label, c.question, c.key, state.s5.notes, c.pathologyOrange, c.pathologyRouge));

            const justifWrap = el('div', { class: 'field' });
            const justifInput = el('textarea', { rows: '2', placeholder: c.motivation });
            justifInput.value = data.justif || '';
            justifInput.addEventListener('input', () => { data.justif = justifInput.value; });
            justifWrap.appendChild(justifInput);
            block.appendChild(justifWrap);

            grid.appendChild(block);
        });

        wrap.appendChild(grid);
        return wrap;
    }


    // ---------------- slide 6 — Pathologies & plan d'action ----------------
    function buildSlide6() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('06')]), document.createTextNode(' — Hiérarchie des pathologies systémiques & plan d\u2019action')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Quel est le seul levier à activer maintenant ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Un seul levier à la fois. Un critère rouge est toujours prioritaire sur un orange ; à égalité, l\u2019ordre est : Owner, Acteurs, W, Client.')]));

        const ranked = rankWeak(weakCriteria());

        if (ranked.length === 0) {
            wrap.appendChild(el('p', { class: 'empty-state' }, [document.createTextNode('Aucune pathologie critique détectée à l\u2019étape 5 \u2014 le levier peut porter sur une simple consolidation.')]));
        } else {
            wrap.appendChild(el('p', { class: 'subsection-label' }, [document.createTextNode('Hiérarchie (la plus critique en premier)')]));
            const rankList = el('ul', { class: 'rank-list' });
            ranked.forEach((c, i) => {
                const niveau = state.s5.notes[c.key].niveau;
                const li = el('li', {});
                li.appendChild(el('span', { class: 'rk-name' }, [document.createTextNode((i + 1) + '. ' + c.label + ' \u2014 ' + pathologyFor(c, niveau))]));
                li.appendChild(el('span', { class: 'rk-score' }, [document.createTextNode(niveau === 'rouge' ? 'Rouge' : 'Orange')]));
                rankList.appendChild(li);
            });
            wrap.appendChild(rankList);
            wrap.appendChild(field('Notes sur la hiérarchie', 'ce que le classement automatique ne capture pas', 'hierarchieNote', state.s6, { textarea: true, rows: 2 }));
        }

        const sub = subsection('Levier unique & plan d\u2019action');
        sub.appendChild(field('Action précise', 'une phrase concrète, pas « améliorer la communication »', 'levier', state.s6, { textarea: true, rows: 2, placeholder: 'Ex : « Faire valider les critères du projet par le comité X »' }));
        sub.appendChild(field('Effets systémiques du levier', 'impact prévisible de ce levier sur d\u2019autres parties du système', 'effetsSystemiques', state.s6, { textarea: true, rows: 2 }));
        const grid = el('div', { class: 'grid-2' });
        grid.appendChild(field('Porteur unique', 'celui qui a le plus intérêt à ce que ça marche', 'porteur', state.s6, {}));
        grid.appendChild(field('Délai de revue', '2 à 4 semaines recommandé', 'delaiRevue', state.s6, { type: 'date' }));
        sub.appendChild(grid);
        sub.appendChild(field('Signal de vérification', 'un fait quantifiable — % d\u2019amélioration, nombre de réclamations — pas une impression', 'signal', state.s6, { textarea: true, rows: 2 }));
        wrap.appendChild(sub);
        return wrap;
    }

    // ---------------- slide 7 — Boucle itérative & suivi ----------------
    function buildSlide7() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('07')]), document.createTextNode(' — Boucle itérative & suivi')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Le levier a-t-il produit l\u2019effet attendu ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('À utiliser au rendez-vous de revue fixé à l\u2019étape 6, en comparant au signal de vérification.')]));
        wrap.appendChild(field('Résultats observés', 'impact réel du levier, comparé au signal de vérification', 'resultats', state.s7, { textarea: true, rows: 2 }));
        wrap.appendChild(field('Écarts', 'différences entre les résultats attendus et réels', 'ecarts', state.s7, { textarea: true, rows: 2 }));
        wrap.appendChild(field('Ajustements nécessaires', 'modifications à apporter à T, W ou au plan', 'ajustements', state.s7, { textarea: true, rows: 2 }));
        wrap.appendChild(field('Prochaine itération', 'nouveau levier ou ajustement pour la prochaine séance', 'prochaineIteration', state.s7, { textarea: true, rows: 2 }));
        wrap.appendChild(field('Leçons apprises', 'ce que le dirigeant a appris sur T, W ou le système', 'lecons', state.s7, { textarea: true, rows: 2 }));
        return wrap;
    }

    // ---------------- synthesis ----------------
    function synthRow(k, v) {
        const row = el('div', { class: 'synth-row' });
        row.appendChild(el('div', { class: 'k' }, [document.createTextNode(k)]));
        const val = el('div', { class: 'v' + (v ? '' : ' empty') }, [document.createTextNode(v || '\u2014')]);
        row.appendChild(val);
        return row;
    }

    function twPhrase() {
        const t = state.s3;
        return 'Transformer ' + (t.x || '\u2026') + ' de ' + (t.a || '\u2026') + ' à ' + (t.b || '\u2026') + ' pour ' + (t.c || '\u2026') + ', car ' + (t.w || '\u2026') + '.';
    }

    function buildSynthesis() {
        const wrap = el('div', { class: 'slide-inner' });

        const head = el('div', { class: 'synth-head' });
        const hLeft = el('div');
        hLeft.appendChild(el('h1', {}, [document.createTextNode('Synthèse de séance')]));
        const dirig = state.meta.dirigeant || 'dirigeant non renseigné';
        const ent = state.meta.entreprise ? (' \u2014 ' + state.meta.entreprise) : '';
        hLeft.appendChild(el('div', { class: 'meta' }, [document.createTextNode(dirig + ent + ' \u00b7 ' + (state.meta.date || ''))]));
        head.appendChild(hLeft);
        const actions = el('div', { class: 'synth-actions' });
        const btnCopy = el('button', {}, [document.createTextNode('Copier')]);
        btnCopy.addEventListener('click', copySynthesis);
        const btnPrint = el('button', {}, [document.createTextNode('Imprimer')]);
        btnPrint.addEventListener('click', () => window.print());
        actions.appendChild(btnCopy); actions.appendChild(btnPrint);
        head.appendChild(actions);
        wrap.appendChild(head);

        const sec0 = el('div', { class: 'synth-section' });
        sec0.appendChild(el('h2', {}, [document.createTextNode('00 \u00b7 Préparation')]));
        sec0.appendChild(synthRow('Contexte', state.s0.contexte));
        sec0.appendChild(synthRow('Attentes', state.s0.attentes));
        sec0.appendChild(synthRow('Règles du jeu', state.s0.reglesJeu));
        sec0.appendChild(synthRow('Objectifs du coach', state.s0.objectifsCoach));
        wrap.appendChild(sec0);

        const sec1 = el('div', { class: 'synth-section' });
        sec1.appendChild(el('h2', {}, [document.createTextNode('01 \u00b7 Cadrage')]));
        sec1.appendChild(synthRow('Problème', state.s1.enonce));
        sec1.appendChild(synthRow('Déclencheur', state.s1.declencheur));
        wrap.appendChild(sec1);

        const sec2 = el('div', { class: 'synth-section' });
        sec2.appendChild(el('h2', {}, [document.createTextNode('02 \u00b7 Cartographie')]));
        sec2.appendChild(synthRow('Acteurs réels', state.s2.acteurs));
        sec2.appendChild(synthRow('Ressources effectives', state.s2.ressources));
        sec2.appendChild(synthRow('Contraintes dures', state.s2.contraintes));
        sec2.appendChild(synthRow('Points de tension', state.s2.tensions));
        sec2.appendChild(synthRow('Dynamiques cachées', state.s2.dynamiquesCachees));
        sec2.appendChild(synthRow('Acteurs exclus', state.s2.acteursExclus));
        sec2.appendChild(synthRow('Effets systémiques', state.s2.effetsSystemiques));
        wrap.appendChild(sec2);

        const sec3 = el('div', { class: 'synth-section' });
        sec3.appendChild(el('h2', {}, [document.createTextNode('03 \u00b7 Transformation & Weltanschauung')]));
        sec3.appendChild(synthRow('Formulation', twPhrase()));
        sec3.appendChild(synthRow('Valeurs associées à W', state.s3.valeursW));
        wrap.appendChild(sec3);

        const sec4 = el('div', { class: 'synth-section' });
        sec4.appendChild(el('h2', {}, [document.createTextNode('04 \u00b7 CATWOE')]));
        sec4.appendChild(synthRow('Client', state.s4.client));
        sec4.appendChild(synthRow('Acteurs', state.s4.acteurs));
        sec4.appendChild(synthRow('Owner', state.s4.owner));
        sec4.appendChild(synthRow('Environnement', state.s4.environnement));
        sec4.appendChild(synthRow('Victimes potentielles', state.s4.victimesPotentielles));
        sec4.appendChild(synthRow('Bénéficiaires indirects', state.s4.beneficiairesIndirects));
        wrap.appendChild(sec4);

        const sec4_1 = el('div', { class: 'synth-section' });
        sec4_1.appendChild(el('h2', {}, [document.createTextNode('04.1 \u00b7 Confrontation des perspectives')]));
        sec4_1.appendChild(synthRow('Acteur confronté', state.s4_1.acteurConfronte));
        sec4_1.appendChild(synthRow('Sa Weltanschauung', state.s4_1.wAutreActeur));
        sec4_1.appendChild(synthRow('Divergences', state.s4_1.divergences));
        sec4_1.appendChild(synthRow('Convergences', state.s4_1.convergences));
        wrap.appendChild(sec4_1);

        const sec5 = el('div', { class: 'synth-section' });
        sec5.appendChild(el('h2', {}, [document.createTextNode('05 \u00b7 Test de validation')]));
        CRITERIA.forEach(c => {
            const d = state.s5.notes[c.key];
            const niveauLabel = d.niveau === 'vert' ? 'Complètement' : d.niveau === 'orange' ? 'Partiellement' : d.niveau === 'rouge' ? 'Non' : '\u2014';
            const path = pathologyFor(c, d.niveau);
            sec5.appendChild(synthRow(c.label, niveauLabel + (path ? ' \u2014 ' + path : '') + (d.justif ? (' \u2014 ' + d.justif) : '')));
        });
        wrap.appendChild(sec5);

        const weak = weakCriteria();

        const sec6 = el('div', { class: 'synth-section' });
        sec6.appendChild(el('h2', { class: 'lever-label' }, [document.createTextNode('06 \u00b7 Pathologies & plan d\u2019action')]));
        if (weak.length) {
            const ranked = rankWeak(weak);
            sec6.appendChild(synthRow('Hiérarchie', ranked.map((c, i) => (i + 1) + '. ' + c.label + ' (' + pathologyFor(c, state.s5.notes[c.key].niveau) + ')').join('\n')));
        }
        sec6.appendChild(synthRow('Notes sur la hiérarchie', state.s6.hierarchieNote));
        const lev = el('div', { class: 'synth-lever' });
        lev.appendChild(synthRow('Action (levier unique)', state.s6.levier));
        lev.appendChild(synthRow('Effets systémiques du levier', state.s6.effetsSystemiques));
        lev.appendChild(synthRow('Porteur', state.s6.porteur));
        lev.appendChild(synthRow('Signal de vérification', state.s6.signal));
        lev.appendChild(synthRow('Revue prévue le', state.s6.delaiRevue));
        sec6.appendChild(lev);
        wrap.appendChild(sec6);

        const sec7 = el('div', { class: 'synth-section' });
        sec7.appendChild(el('h2', {}, [document.createTextNode('07 \u00b7 Boucle itérative & suivi')]));
        sec7.appendChild(synthRow('Résultats observés', state.s7.resultats));
        sec7.appendChild(synthRow('Écarts', state.s7.ecarts));
        sec7.appendChild(synthRow('Ajustements nécessaires', state.s7.ajustements));
        sec7.appendChild(synthRow('Prochaine itération', state.s7.prochaineIteration));
        sec7.appendChild(synthRow('Leçons apprises', state.s7.lecons));
        wrap.appendChild(sec7);

        return wrap;
    }

    function synthesisText() {
        const weak = weakCriteria();
        let lines = [];
        lines.push('DIAGNOSTIC SYSTÉMIQUE \u2014 SPARRING PARTNER \u2014 SYNTHÈSE DE SÉANCE');
        lines.push((state.meta.dirigeant || '\u2014') + (state.meta.entreprise ? (' \u2014 ' + state.meta.entreprise) : '') + ' \u00b7 ' + (state.meta.date || ''));
        lines.push('');
        lines.push('00 \u00b7 PRÉPARATION');
        lines.push('Contexte : ' + (state.s0.contexte || '\u2014'));
        lines.push('Attentes : ' + (state.s0.attentes || '\u2014'));
        lines.push('Règles du jeu : ' + (state.s0.reglesJeu || '\u2014'));
        lines.push('Objectifs du coach : ' + (state.s0.objectifsCoach || '\u2014'));
        lines.push('');
        lines.push('01 \u00b7 CADRAGE');
        lines.push('Problème : ' + (state.s1.enonce || '\u2014'));
        lines.push('Déclencheur : ' + (state.s1.declencheur || '\u2014'));
        lines.push('');
        lines.push('02 \u00b7 CARTOGRAPHIE');
        lines.push('Acteurs réels : ' + (state.s2.acteurs || '\u2014'));
        lines.push('Ressources effectives : ' + (state.s2.ressources || '\u2014'));
        lines.push('Contraintes dures : ' + (state.s2.contraintes || '\u2014'));
        lines.push('Points de tension : ' + (state.s2.tensions || '\u2014'));
        lines.push('Dynamiques cachées : ' + (state.s2.dynamiquesCachees || '\u2014'));
        lines.push('Acteurs exclus : ' + (state.s2.acteursExclus || '\u2014'));
        lines.push('Effets systémiques : ' + (state.s2.effetsSystemiques || '\u2014'));
        lines.push('');
        lines.push('03 \u00b7 TRANSFORMATION & WELTANSCHAUUNG');
        lines.push(twPhrase());
        lines.push('Valeurs associées à W : ' + (state.s3.valeursW || '\u2014'));
        lines.push('');
        lines.push('04 \u00b7 CATWOE');
        lines.push('Client : ' + (state.s4.client || '\u2014'));
        lines.push('Acteurs : ' + (state.s4.acteurs || '\u2014'));
        lines.push('Owner : ' + (state.s4.owner || '\u2014'));
        lines.push('Environnement : ' + (state.s4.environnement || '\u2014'));
        lines.push('Victimes potentielles : ' + (state.s4.victimesPotentielles || '\u2014'));
        lines.push('Bénéficiaires indirects : ' + (state.s4.beneficiairesIndirects || '\u2014'));
        lines.push('');
        lines.push('04.1 \u00b7 CONFRONTATION DES PERSPECTIVES');
        lines.push('Acteur confronté : ' + (state.s4_1.acteurConfronte || '\u2014'));
        lines.push('Sa Weltanschauung : ' + (state.s4_1.wAutreActeur || '\u2014'));
        lines.push('Divergences : ' + (state.s4_1.divergences || '\u2014'));
        lines.push('Convergences : ' + (state.s4_1.convergences || '\u2014'));
        lines.push('');
        lines.push('05 \u00b7 TEST DE VALIDATION');
        CRITERIA.forEach(c => {
            const d = state.s5.notes[c.key];
            const niveauLabel = d.niveau === 'vert' ? 'Complètement' : d.niveau === 'orange' ? 'Partiellement' : d.niveau === 'rouge' ? 'Non' : '\u2014';
            const path = pathologyFor(c, d.niveau);
            lines.push(c.label + ' : ' + niveauLabel + (path ? ' \u2014 ' + path : '') + (d.justif ? (' \u2014 ' + d.justif) : ''));
        });
        lines.push('');
        lines.push('06 \u00b7 PATHOLOGIES & PLAN D\u2019ACTION');
        if (weak.length) {
            const ranked = rankWeak(weak);
            lines.push('Hiérarchie : ' + ranked.map((c, i) => (i + 1) + '. ' + c.label + ' (' + pathologyFor(c, state.s5.notes[c.key].niveau) + ')').join(' | '));
        }
        lines.push('Action (levier unique) : ' + (state.s6.levier || '\u2014'));
        lines.push('Effets systémiques du levier : ' + (state.s6.effetsSystemiques || '\u2014'));
        lines.push('Porteur : ' + (state.s6.porteur || '\u2014'));
        lines.push('Signal de vérification : ' + (state.s6.signal || '\u2014'));
        lines.push('Revue prévue le : ' + (state.s6.delaiRevue || '\u2014'));
        lines.push('');
        lines.push('07 \u00b7 BOUCLE ITÉRATIVE & SUIVI');
        lines.push('Résultats observés : ' + (state.s7.resultats || '\u2014'));
        lines.push('Écarts : ' + (state.s7.ecarts || '\u2014'));
        lines.push('Ajustements nécessaires : ' + (state.s7.ajustements || '\u2014'));
        lines.push('Prochaine itération : ' + (state.s7.prochaineIteration || '\u2014'));
        lines.push('Leçons apprises : ' + (state.s7.lecons || '\u2014'));
        return lines.join('\n');
    }

    function copySynthesis() {
        const text = synthesisText();
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.synth-actions button');
            if (btn) { const old = btn.textContent; btn.textContent = 'Copié'; setTimeout(() => btn.textContent = old, 1400); }
        }).catch(() => { });
    }

    const builders = [buildSlide0, buildSlide1, buildSlide2, buildSlide3, buildSlide4, buildSlide4_1, buildSlide5, buildSlide6, buildSlide7, buildSynthesis];

    // ---------------- render shell ----------------
    const stage = document.getElementById('stage');
    const app = document.getElementById('app');
    const progressFill = document.getElementById('progressFill');
    const stepDots = document.getElementById('stepDots');
    const sessionName = document.getElementById('sessionName');
    const sessionTag = document.getElementById('sessionTag');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    let slideEls = builders.map((fn) => {
        const slide = el('div', { class: 'slide' }, [fn()]);
        stage.appendChild(slide);
        return slide;
    });

    DOT_LABELS.forEach((label, i) => {
        const dot = el('button', { class: 'step-dot' }, [document.createTextNode(label)]);
        dot.title = STEP_LABELS[i];
        dot.addEventListener('click', () => goTo(i));
        stepDots.appendChild(dot);
    });

    function refreshShell() {
        const pct = (current / LAST_STEP) * 100;
        progressFill.style.width = pct + '%';
        app.classList.toggle('on-lever', current >= LEVER_FROM);

        [...stepDots.children].forEach((d, i) => d.classList.toggle('active', i === current));

        btnPrev.disabled = current === 0;
        btnNext.textContent = current === LAST_STEP ? 'Nouvelle séance' : (current === LAST_STEP - 1 ? 'Voir la synthèse' : 'Suivant');

        sessionName.textContent = state.meta.dirigeant ? ('\u00b7 ' + state.meta.dirigeant) : '';
        sessionTag.textContent = STEP_LABELS[current];
    }

    function rerenderSlide(i) {
        const fresh = el('div', { class: 'slide active' }, [builders[i]()]);
        stage.replaceChild(fresh, slideEls[i]);
        slideEls[i] = fresh;
    }

    function goTo(i) {
        if (i < 0 || i > LAST_STEP) return;
        slideEls[current].classList.remove('active');
        current = i;
        if (i === LAST_STEP || i === 7) { rerenderSlide(i); }
        slideEls[current].classList.add('active');
        refreshShell();
    }

    btnPrev.addEventListener('click', () => { if (current > 0) goTo(current - 1); });
    btnNext.addEventListener('click', () => {
        if (current === LAST_STEP) { resetSession(); return; }
        goTo(current + 1);
    });

    function resetSession() {
        if (!confirm('Démarrer une nouvelle séance ? Les données actuelles seront effacées.')) return;
        state = freshState();
        slideEls.forEach((oldSlide, i) => {
            const fresh = el('div', { class: 'slide' + (i === 0 ? ' active' : '') }, [builders[i]()]);
            stage.replaceChild(fresh, oldSlide);
            slideEls[i] = fresh;
        });
        current = 0;
        refreshShell();
    }

    document.addEventListener('keydown', (e) => {
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'TEXTAREA' || tag === 'INPUT') return;
        if (e.key === 'ArrowRight') { if (current === LAST_STEP) resetSession(); else goTo(current + 1); }
        if (e.key === 'ArrowLeft') { goTo(current - 1); }
    });

    slideEls[0].classList.add('active');
    refreshShell();

})();
