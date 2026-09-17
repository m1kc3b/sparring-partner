(function () {

    // ---------------- reference data ----------------
    const CRITERIA = [
        { key: 'client', label: 'Bénéfice Client', question: 'Le Client tire-t-il un bénéfice réel et direct de la transformation ?', pathology: 'Inversion des rôles — captation du But' },
        { key: 'acteurs', label: 'Moyens des Acteurs', question: 'Les Acteurs ont-ils concrètement les moyens d\u2019exécuter la transformation ?', pathology: 'Erreur de cadrage — illusion d\u2019exécution' },
        { key: 'owner', label: 'Pouvoir de l\u2019Owner', question: 'L\u2019Owner a-t-il, dans les faits, le pouvoir d\u2019arbitrer ?', pathology: 'Trou de gouvernance — illusion de contrôle' },
        { key: 'w', label: 'Solidité de W', question: 'La croyance (W) résiste-t-elle à une reformulation ou à des faits contraires ?', pathology: 'Dérive des attributs — dogme / faux garant' }
    ];

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
                seuilCritique: 7,
                notes: { client: { note: 5, justif: '' }, acteurs: { note: 5, justif: '' }, owner: { note: 5, justif: '' }, w: { note: 5, justif: '' } }
            },
            s5_1: { scenarios: { client: { scenario: '', risques: '', probabilite: 5, planB: '' }, acteurs: { scenario: '', risques: '', probabilite: 5, planB: '' }, owner: { scenario: '', risques: '', probabilite: 5, planB: '' }, w: { scenario: '', risques: '', probabilite: 5, planB: '' } } },
            s6: {
                scoring: { client: { impact: 5, cout: 5, delai: 5 }, acteurs: { impact: 5, cout: 5, delai: 5 }, owner: { impact: 5, cout: 5, delai: 5 }, w: { impact: 5, cout: 5, delai: 5 } },
                hierarchieNote: '', levier: '', effetsSystemiques: '', porteur: '', signal: '', delaiRevue: ''
            },
            s7: { resultats: '', ecarts: '', ajustements: '', prochaineIteration: '', lecons: '' }
        };
    }

    let state = freshState();

    const STEP_LABELS = ['Préparation de la séance', 'Cadrage & verbalisation', 'Cartographie du réel', 'Transformation & Weltanschauung', 'CATWOE', 'Confrontation des perspectives', 'Test de validation', 'Scénarios alternatifs', 'Pathologies & plan d\u2019action', 'Boucle itérative & suivi', 'Synthèse'];
    const DOT_LABELS = ['0', '1', '2', '3', '4', '4.1', '5', '5.1', '6', '7', '\u2713'];
    let current = 0;
    const LAST_STEP = 10;
    const LEVER_FROM = 8; // steps 6, 7 and synthesis get the bronze accent

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
        const wrap = el('div', { class: 'slider-field' });
        const row = el('div', { class: 'slider-label-row' });
        const label = el('label', {}, [document.createTextNode(labelText)]);
        row.appendChild(label);
        const badge = el('span', { class: 'slider-badge' }, [document.createTextNode(String(obj[key]))]);
        row.appendChild(badge);
        wrap.appendChild(row);
        if (subText) wrap.appendChild(el('p', { class: 'sub' }, [document.createTextNode(subText)]));
        const input = el('input', { type: 'range', min: '1', max: '10', step: '1' });
        input.value = obj[key];
        function paint() {
            const below = (typeof dangerWhenBelow === 'number') && obj[key] < dangerWhenBelow;
            wrap.classList.toggle('warn-inline', !!below);
        }
        input.addEventListener('input', () => {
            obj[key] = parseInt(input.value, 10);
            badge.textContent = String(obj[key]);
            paint();
            if (onChange) onChange();
        });
        paint();
        wrap.appendChild(input);
        return wrap;
    }

    function weakCriteria() {
        return CRITERIA.filter(c => state.s5.notes[c.key].note < state.s5.seuilCritique);
    }

    // ---------------- slide 0 — Préparation de la séance ----------------
    function buildSlide0() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('00')]), document.createTextNode(' — Préparation de la séance')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Avec qui travaillez-vous, et sur quel cadre vous accordez-vous ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Les données restent en mémoire du navigateur — copiez ou imprimez la synthèse en fin de séance.')]));

        const grid = el('div', { class: 'grid-2' });
        grid.appendChild(field('Dirigeant', null, 'dirigeant', state.meta, { placeholder: 'Nom du dirigeant' }));
        grid.appendChild(field('Entreprise', null, 'entreprise', state.meta, { placeholder: 'Nom de la structure' }));
        wrap.appendChild(grid);
        wrap.appendChild(field('Date de la séance', null, 'date', state.meta, { type: 'date' }));

        const sub = subsection('Cadre de la séance');
        sub.appendChild(field('Contexte de la séance', 'pourquoi le dirigeant sollicite-t-il un coaching aujourd\u2019hui ?', 'contexte', state.s0, { textarea: true, rows: 2, placeholder: 'Ex : « Je veux résoudre un conflit entre deux services avant qu\u2019il n\u2019impacte nos livraisons. »' }));
        sub.appendChild(field('Attentes du dirigeant', 'ce qu\u2019il espère obtenir de la séance', 'attentes', state.s0, { textarea: true, rows: 2, placeholder: 'Ex : « Une feuille de route claire pour les 3 prochains mois. »' }));
        sub.appendChild(field('Règles du jeu', 'accord sur la confidentialité, la durée, le droit de challenger ses hypothèses', 'reglesJeu', state.s0, { textarea: true, rows: 2 }));
        sub.appendChild(field('Objectifs du coach', 'ce que vous voulez obtenir de cette séance, en tant que facilitateur', 'objectifsCoach', state.s0, { textarea: true, rows: 2 }));
        wrap.appendChild(sub);
        return wrap;
    }

    // ---------------- slide 1 — Cadrage & verbalisation ----------------
    function buildSlide1() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('01')]), document.createTextNode(' — Cadrage & verbalisation')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Quel est le problème, tel qu\u2019il se pose aujourd\u2019hui ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Laissez parler deux minutes, puis notez la formulation sans la rendre plus élégante ou plus théorique qu\u2019elle ne l\u2019est. Validez-la ensuite par un « oui » net.')]));
        wrap.appendChild(field('L\u2019énoncé brut du problème', 'formulation littérale, sans reformulation', 'enonce', state.s1, { textarea: true, rows: 2, placeholder: 'Ex : « On a des problèmes de communication entre les équipes, et ça bloque nos projets. »' }));
        wrap.appendChild(field('Le déclencheur récent', 'qu\u2019est-ce qui rend ce sujet urgent maintenant ?', 'declencheur', state.s1, { textarea: true, rows: 2, placeholder: 'Ex : « Un client a annulé un contrat à cause d\u2019un retard de livraison. »' }));
        return wrap;
    }

    // ---------------- slide 2 — Cartographie du réel ----------------
    function buildSlide2() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('02')]), document.createTextNode(' — Cartographie de la situation réelle')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Que se passe-t-il réellement sur le terrain ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Les faits observés — pas l\u2019organigramme théorique.')]));
        const grid = el('div', { class: 'grid-2' });
        grid.appendChild(field('Acteurs réels', 'personnes et groupes réellement impliqués', 'acteurs', state.s2, { textarea: true, rows: 3 }));
        grid.appendChild(field('Ressources effectives', 'temps, budget, compétences réellement mobilisables', 'ressources', state.s2, { textarea: true, rows: 3 }));
        grid.appendChild(field('Contraintes dures', 'règles, délais légaux, limites non négociables', 'contraintes', state.s2, { textarea: true, rows: 3 }));
        grid.appendChild(field('Points de tension', 'frictions et blocages observés au quotidien', 'tensions', state.s2, { textarea: true, rows: 3 }));
        wrap.appendChild(grid);

        const sub = subsection('Lecture élargie (dimension éthique et systémique)');
        sub.appendChild(field('Dynamiques cachées', 'conflits informels, alliances ou intérêts non avoués', 'dynamiquesCachees', state.s2, { textarea: true, rows: 2, placeholder: 'Ex : « Le commercial veut minimiser les coûts, la logistique veut maximiser la qualité. »' }));
        sub.appendChild(field('Acteurs exclus', 'personnes non représentées mais impactées par le problème', 'acteursExclus', state.s2, { textarea: true, rows: 2 }));
        sub.appendChild(field('Effets systémiques', 'impact du problème sur d\u2019autres parties du système', 'effetsSystemiques', state.s2, { textarea: true, rows: 2 }));
        wrap.appendChild(sub);
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
        s.appendChild(sentInput('x', 'l\u2019élément central (X)', 'x'));
        s.appendChild(document.createTextNode(' de '));
        s.appendChild(sentInput('a', 'l\u2019état actuel (A)', 'etat'));
        s.appendChild(document.createTextNode(' à '));
        s.appendChild(sentInput('b', 'l\u2019état visé (B)', 'etat'));
        s.appendChild(document.createTextNode(' pour '));
        s.appendChild(sentInput('c', 'le bénéfice principal (C)', 'c'));
        s.appendChild(document.createTextNode(', car '));
        s.appendChild(sentInput('w', 'la croyance sous-jacente (W)', 'w'));
        s.appendChild(document.createTextNode('.'));
        wrap.appendChild(s);

        const sub = subsection('Légitimité de W');
        sub.appendChild(field('Valeurs associées à W', 'ex : transparence, efficacité, équité — ce qui rend cette croyance défendable', 'valeursW', state.s3, { textarea: true, rows: 2 }));
        wrap.appendChild(sub);
        return wrap;
    }

    // ---------------- slide 4 — CATWOE ----------------
    function buildSlide4() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('04')]), document.createTextNode(' — Filtrage des 4 rôles (CATWOE)')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Qui est réellement concerné par cette transformation ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('On ne recartographie pas tout — on filtre uniquement pour le T formulé à l\u2019étape précédente.')]));
        wrap.appendChild(field('Client', 'le bénéficiaire réel et direct de la transformation', 'client', state.s4, { textarea: true, rows: 2 }));
        wrap.appendChild(field('Acteurs', 'exécutants du changement, et personnes qui en subiront l\u2019impact', 'acteurs', state.s4, { textarea: true, rows: 2 }));
        wrap.appendChild(field('Owner', 'qui a le pouvoir réel d\u2019arrêter ou de bloquer le projet', 'owner', state.s4, { textarea: true, rows: 2 }));
        wrap.appendChild(field('Environnement', 'limites externes spécifiques à cette transformation', 'environnement', state.s4, { textarea: true, rows: 2 }));

        const sub = subsection('Élargissement éthique (Ulrich)');
        sub.appendChild(field('Victimes potentielles', 'acteurs qui pourraient subir des conséquences négatives de T', 'victimesPotentielles', state.s4, { textarea: true, rows: 2 }));
        sub.appendChild(field('Bénéficiaires indirects', 'acteurs qui bénéficieraient indirectement de T', 'beneficiairesIndirects', state.s4, { textarea: true, rows: 2 }));
        wrap.appendChild(sub);
        return wrap;
    }

    // ---------------- slide 4.1 — Confrontation des perspectives ----------------
    function buildSlide4_1() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('04.1')]), document.createTextNode(' — Confrontation des perspectives')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Que dirait un autre acteur du CATWOE, à la place du dirigeant ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Faites parler le dirigeant à la place de cet acteur — sans qu\u2019il en ait forcément discuté avec lui.')]));
        wrap.appendChild(field('Acteur confronté', 'un des rôles identifiés à l\u2019étape CATWOE', 'acteurConfronte', state.s4_1, { placeholder: 'Ex : le service logistique' }));
        wrap.appendChild(field('Sa Weltanschauung supposée', 'comment cet acteur décrirait-il le problème, selon le dirigeant ?', 'wAutreActeur', state.s4_1, { textarea: true, rows: 2 }));
        wrap.appendChild(field('Divergences', 'différences majeures avec la W du dirigeant', 'divergences', state.s4_1, { textarea: true, rows: 2 }));
        wrap.appendChild(field('Convergences', 'points sur lesquels tout le monde s\u2019accorde', 'convergences', state.s4_1, { textarea: true, rows: 2 }));
        return wrap;
    }

    // ---------------- slide 5 — Test de validation ----------------
    function buildSlide5() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('05')]), document.createTextNode(' — Test de validation')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('La transformation résiste-t-elle à l\u2019épreuve des faits ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Notez chaque critère de 1 à 10, puis justifiez. Sous le seuil critique, le critère alimente automatiquement l\u2019étape suivante.')]));

        const seuilRow = el('div', { class: 'seuil-row' });
        seuilRow.appendChild(el('label', {}, [document.createTextNode('Seuil critique')]));
        const seuilInput = el('input', { type: 'number', min: '1', max: '10' });
        seuilInput.value = state.s5.seuilCritique;
        seuilInput.addEventListener('input', () => {
            const v = parseInt(seuilInput.value, 10);
            state.s5.seuilCritique = isNaN(v) ? 7 : Math.min(10, Math.max(1, v));
            repaintWarnings();
        });
        seuilRow.appendChild(seuilInput);
        seuilRow.appendChild(el('span', {}, [document.createTextNode('/ 10')]));
        wrap.appendChild(seuilRow);

        const warnRefs = [];
        CRITERIA.forEach(c => {
            const data = state.s5.notes[c.key];
            const block = el('div', { class: 'crit-block' });
            block.appendChild(el('p', { class: 'crit-q' }, [document.createTextNode(c.question)]));
            const slider = sliderField(c.label, null, 'note', data, () => repaintWarnings(), null);
            block.appendChild(slider);
            const warnText = el('p', { class: 'warn-text' });
            block.appendChild(warnText);
            const justif = el('textarea', { rows: '2', placeholder: 'Justification — ce qui motive cette note' });
            justif.value = data.justif || '';
            justif.addEventListener('input', () => { data.justif = justif.value; });
            block.appendChild(justif);
            warnRefs.push({ key: c.key, slider, warnText, pathology: c.pathology });
            wrap.appendChild(block);
        });

        function repaintWarnings() {
            warnRefs.forEach(r => {
                const below = state.s5.notes[r.key].note < state.s5.seuilCritique;
                r.slider.classList.toggle('warn-inline', below);
                r.warnText.textContent = below ? ('\u26A0 Sous le seuil critique \u2014 ' + r.pathology) : '';
            });
        }
        repaintWarnings();
        return wrap;
    }

    // ---------------- slide 5.1 — Scénarios alternatifs ----------------
    function buildSlide5_1() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('05.1')]), document.createTextNode(' — Scénarios alternatifs & gestion des risques')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Que se passe-t-il si ces points faibles ne bougent pas ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Généré automatiquement à partir des critères sous le seuil critique de l\u2019étape 5.')]));

        const weak = weakCriteria();
        if (weak.length === 0) {
            wrap.appendChild(el('p', { class: 'empty-state' }, [document.createTextNode('Aucun critère sous le seuil critique \u2014 cette étape n\u2019est pas nécessaire, passez directement à l\u2019étape 6.')]));
            return wrap;
        }

        weak.forEach(c => {
            const data = state.s5_1.scenarios[c.key];
            const block = el('div', { class: 'weak-block' });
            const head = el('div', { class: 'weak-head' });
            head.appendChild(el('span', { class: 'wk-title' }, [document.createTextNode(c.label + ' — note ' + state.s5.notes[c.key].note + '/10')]));
            head.appendChild(el('span', { class: 'wk-path' }, [document.createTextNode(c.pathology)]));
            block.appendChild(head);
            block.appendChild(field('Scénario alternatif', 'que pourrait-il se passer si ce critère reste faible ?', 'scenario', data, { textarea: true, rows: 2 }));
            block.appendChild(field('Risques associés', null, 'risques', data, { textarea: true, rows: 2 }));
            block.appendChild(sliderField('Probabilité que ce risque se produise', null, 'probabilite', data, null, null));
            block.appendChild(field('Plan B', 'action alternative, et qui prend le relais si le porteur du levier échoue', 'planB', data, { textarea: true, rows: 2 }));
            wrap.appendChild(block);
        });
        return wrap;
    }

    // ---------------- slide 6 — Pathologies & plan d'action ----------------
    function buildSlide6() {
        const wrap = el('div', { class: 'slide-inner' });
        wrap.appendChild(el('p', { class: 'eyebrow' }, [el('span', { class: 'num' }, [document.createTextNode('06')]), document.createTextNode(' — Hiérarchie des pathologies systémiques & plan d\u2019action')]));
        wrap.appendChild(el('h1', { class: 'question' }, [document.createTextNode('Quel est le seul levier à activer maintenant ?')]));
        wrap.appendChild(el('p', { class: 'hint' }, [document.createTextNode('Un seul levier à la fois. La hiérarchie ci-dessous se calcule sur un critère objectif — impact sur T, coût, délai — pas sur l\u2019impression du moment.')]));

        const weak = weakCriteria();
        const rankList = el('ul', { class: 'rank-list' });

        function recomputeRank() {
            const rows = weak.map(c => {
                const s = state.s6.scoring[c.key];
                const score = (s.impact + s.cout + s.delai) / 3;
                return { label: c.label, pathology: c.pathology, score };
            }).sort((a, b) => b.score - a.score);
            rankList.innerHTML = '';
            rows.forEach(r => {
                const li = el('li', {});
                li.appendChild(el('span', { class: 'rk-name' }, [document.createTextNode(r.label + ' \u2014 ' + r.pathology)]));
                li.appendChild(el('span', { class: 'rk-score' }, [document.createTextNode(r.score.toFixed(1))]));
                rankList.appendChild(li);
            });
        }

        if (weak.length === 0) {
            wrap.appendChild(el('p', { class: 'empty-state' }, [document.createTextNode('Aucune pathologie critique détectée à l\u2019étape 5 \u2014 le levier peut porter sur une simple consolidation.')]));
        } else {
            weak.forEach(c => {
                const s = state.s6.scoring[c.key];
                const block = el('div', { class: 'weak-block' });
                const head = el('div', { class: 'weak-head' });
                head.appendChild(el('span', { class: 'wk-title' }, [document.createTextNode(c.label)]));
                head.appendChild(el('span', { class: 'wk-path' }, [document.createTextNode(c.pathology)]));
                block.appendChild(head);
                const scoreMini = el('div', { class: 'score-mini' });
                scoreMini.appendChild(sliderField('Impact sur T', null, 'impact', s, recomputeRank, null));
                scoreMini.appendChild(sliderField('Coût', null, 'cout', s, recomputeRank, null));
                scoreMini.appendChild(sliderField('Délai', null, 'delai', s, recomputeRank, null));
                block.appendChild(scoreMini);
                wrap.appendChild(block);
            });
            wrap.appendChild(el('p', { class: 'subsection-label' }, [document.createTextNode('Hiérarchie calculée (score moyen, la plus critique en premier)')]));
            wrap.appendChild(rankList);
            recomputeRank();
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
        sec5.appendChild(el('h2', {}, [document.createTextNode('05 \u00b7 Test de validation (seuil : ' + state.s5.seuilCritique + '/10)')]));
        CRITERIA.forEach(c => {
            const d = state.s5.notes[c.key];
            const below = d.note < state.s5.seuilCritique;
            sec5.appendChild(synthRow(c.label, d.note + '/10' + (below ? ' \u2014 ' + c.pathology : '') + (d.justif ? (' \u2014 ' + d.justif) : '')));
        });
        wrap.appendChild(sec5);

        const weak = weakCriteria();
        if (weak.length) {
            const sec51 = el('div', { class: 'synth-section' });
            sec51.appendChild(el('h2', {}, [document.createTextNode('05.1 \u00b7 Scénarios alternatifs')]));
            weak.forEach(c => {
                const d = state.s5_1.scenarios[c.key];
                sec51.appendChild(synthRow(c.label + ' \u2014 scénario', d.scenario));
                sec51.appendChild(synthRow(c.label + ' \u2014 risques (prob. ' + d.probabilite + '/10)', d.risques));
                sec51.appendChild(synthRow(c.label + ' \u2014 plan B', d.planB));
            });
            wrap.appendChild(sec51);
        }

        const sec6 = el('div', { class: 'synth-section' });
        sec6.appendChild(el('h2', { class: 'lever-label' }, [document.createTextNode('06 \u00b7 Pathologies & plan d\u2019action')]));
        if (weak.length) {
            const ranked = weak.map(c => {
                const s = state.s6.scoring[c.key];
                return { label: c.label, pathology: c.pathology, score: (s.impact + s.cout + s.delai) / 3 };
            }).sort((a, b) => b.score - a.score);
            sec6.appendChild(synthRow('Hiérarchie calculée', ranked.map(r => r.label + ' (' + r.pathology + ') \u2014 ' + r.score.toFixed(1)).join('\n')));
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
        lines.push('05 \u00b7 TEST DE VALIDATION (seuil critique : ' + state.s5.seuilCritique + '/10)');
        CRITERIA.forEach(c => {
            const d = state.s5.notes[c.key];
            const below = d.note < state.s5.seuilCritique;
            lines.push(c.label + ' : ' + d.note + '/10' + (below ? ' \u2014 ' + c.pathology : '') + (d.justif ? (' \u2014 ' + d.justif) : ''));
        });
        if (weak.length) {
            lines.push('');
            lines.push('05.1 \u00b7 SCÉNARIOS ALTERNATIFS');
            weak.forEach(c => {
                const d = state.s5_1.scenarios[c.key];
                lines.push(c.label + ' \u2014 scénario : ' + (d.scenario || '\u2014'));
                lines.push(c.label + ' \u2014 risques (probabilité ' + d.probabilite + '/10) : ' + (d.risques || '\u2014'));
                lines.push(c.label + ' \u2014 plan B : ' + (d.planB || '\u2014'));
            });
        }
        lines.push('');
        lines.push('06 \u00b7 PATHOLOGIES & PLAN D\u2019ACTION');
        if (weak.length) {
            const ranked = weak.map(c => {
                const s = state.s6.scoring[c.key];
                return { label: c.label, pathology: c.pathology, score: (s.impact + s.cout + s.delai) / 3 };
            }).sort((a, b) => b.score - a.score);
            lines.push('Hiérarchie calculée : ' + ranked.map(r => r.label + ' (' + r.pathology + ') \u2014 ' + r.score.toFixed(1)).join(' | '));
        }
        if (state.s6.hierarchieNote) lines.push('Notes sur la hiérarchie : ' + state.s6.hierarchieNote);
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

    const builders = [buildSlide0, buildSlide1, buildSlide2, buildSlide3, buildSlide4, buildSlide4_1, buildSlide5, buildSlide5_1, buildSlide6, buildSlide7, buildSynthesis];

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
        // rebuild dynamic slides every time they're entered, so 5.1 / 6 reflect the latest state.s5 notes
        if (i === LAST_STEP || i === 7 || i === 8) { rerenderSlide(i); }
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
