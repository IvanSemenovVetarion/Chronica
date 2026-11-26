/* =========================================================
   Chronica — древо рода
   ========================================================= */
(function () {
  'use strict';
  const MF = window.MF;

  const NODE_W = 188;
  const NODE_H = 94;
  const NODE_GAP = 26;
  const GEN_GAP = 155;
  const ROW_GAP = 48;
  const TOP = 45;

  function roman(value) {
    const values = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
    let n = value, out = '';
    values.forEach(function (pair) {
      while (n >= pair[1]) { out += pair[0]; n -= pair[1]; }
    });
    return out || 'I';
  }

  MF.computeTree = function () {
    const characters = MF.state.data.characters.slice();
    if (!characters.length) return { characters: [], units: [], stageW: 900, stageH: 500, generations: 0, connections: '', spouseLines: '' };
    const byId = {};
    characters.forEach(function (character) { byId[character.id] = character; });
    const unitOf = {};
    const units = [];
    const used = {};
    const indexOfChar = {};
    characters.forEach(function (character, index) { indexOfChar[character.id] = index; });

    characters.forEach(function (character) {
      if (used[character.id]) return;
      const members = [character];
      used[character.id] = true;
      const spouseIds = Array.isArray(character.spouseIds) ? character.spouseIds : [];
      for (let i = 0; i < spouseIds.length; i++) {
        const partner = byId[spouseIds[i]];
        if (partner && !used[partner.id] && partner.id !== character.id) {
          members.push(partner);
          used[partner.id] = true;
          break;
        }
      }
      const unit = {
        id: 'unit_' + character.id,
        members: members,
        parentUnitIds: [],
        childUnitIds: [],
        depth: 0,
        order: units.length,
        width: members.length * NODE_W + (members.length - 1) * NODE_GAP,
        x: 0,
        y: 0
      };
      units.push(unit);
      members.forEach(function (member) { unitOf[member.id] = unit.id; });
    });

    const byUnit = {};
    units.forEach(function (unit) { byUnit[unit.id] = unit; });

    units.forEach(function (unit) {
      const parents = [];
      unit.members.forEach(function (member) {
        [member.fatherId, member.motherId].forEach(function (parentId) {
          if (!parentId) return;
          const parentUnitId = unitOf[parentId];
          if (parentUnitId && parentUnitId !== unit.id && parents.indexOf(parentUnitId) === -1) parents.push(parentUnitId);
        });
      });
      unit.parentUnitIds = parents;
      parents.forEach(function (parentUnitId) {
        const parent = byUnit[parentUnitId];
        if (parent && parent.childUnitIds.indexOf(unit.id) === -1) parent.childUnitIds.push(unit.id);
      });
    });

    /* Generations: longest path from parentless ancestors. The cap protects
       the layout from accidental family cycles. */
    for (let pass = 0; pass < units.length; pass++) {
      let changed = false;
      units.forEach(function (unit) {
        unit.parentUnitIds.forEach(function (parentId) {
          const parent = byUnit[parentId];
          if (parent && parent.depth + 1 > unit.depth) {
            unit.depth = parent.depth + 1;
            changed = true;
          }
        });
      });
      if (!changed) break;
    }

    const maxDepth = units.reduce(function (max, unit) { return Math.max(max, unit.depth); }, 0);
    const gens = [];
    for (let i = 0; i <= maxDepth; i++) gens.push([]);
    units.forEach(function (unit) { gens[unit.depth].push(unit); });

    /* Sibling clusters near their parents, parents near their children. */
    function setOrders(list) {
      list.forEach(function (unit, idx) { unit.order = idx; });
    }
    function barycenter(list) {
      return list.reduce(function (sum, unit) { return sum + unit.order; }, 0) / Math.max(1, list.length);
    }
    function childBarycenter(unit) {
      const children = unit.childUnitIds.map(function (id) { return byUnit[id]; }).filter(Boolean);
      return children.length ? barycenter(children) : unit.order;
    }
    function parentBarycenter(unit) {
      const parents = unit.parentUnitIds.map(function (id) { return byUnit[id]; }).filter(Boolean);
      return parents.length ? barycenter(parents) : unit.order;
    }

    for (let pass = 0; pass < 3; pass++) {
      for (let depth = 1; depth <= maxDepth; depth++) {
        gens[depth].sort(function (a, b) { return parentBarycenter(a) - parentBarycenter(b) || a.order - b.order; });
        setOrders(gens[depth]);
      }
      for (let depth = maxDepth - 1; depth >= 0; depth--) {
        gens[depth].sort(function (a, b) { return childBarycenter(a) - childBarycenter(b) || a.order - b.order; });
        setOrders(gens[depth]);
      }
    }
    for (let depth = 0; depth <= maxDepth; depth++) setOrders(gens[depth]);

    let maxGenWidth = 0;
    gens.forEach(function (list) {
      const width = list.reduce(function (sum, unit) { return sum + unit.width; }, 0) + Math.max(0, list.length - 1) * ROW_GAP;
      maxGenWidth = Math.max(maxGenWidth, width);
    });
    let stageW = Math.max(940, maxGenWidth + 180);
    let stageH = TOP + (maxDepth + 1) * GEN_GAP + 42;

    gens.forEach(function (list, depth) {
      const total = list.reduce(function (sum, unit) { return sum + unit.width; }, 0) + Math.max(0, list.length - 1) * ROW_GAP;
      let x = (stageW - total) / 2;
      list.forEach(function (unit) {
        unit.x = x;
        unit.y = TOP + depth * GEN_GAP;
        unit.members.forEach(function (member, index) {
          member.__treeX = unit.x + index * (NODE_W + NODE_GAP);
          member.__treeY = unit.y;
          member.__treeUnit = unit;
        });
        x += unit.width + ROW_GAP;
      });
    });

    function hasManualPosition(character) {
      return character.treeX !== null && character.treeX !== undefined && character.treeX !== '' &&
        character.treeY !== null && character.treeY !== undefined && character.treeY !== '' &&
        Number.isFinite(Number(character.treeX)) && Number.isFinite(Number(character.treeY));
    }
    const manual = characters.some(hasManualPosition);
    if (manual) {
      characters.forEach(function (character) {
        if (hasManualPosition(character)) {
          character.__treeX = Number(character.treeX);
          character.__treeY = Number(character.treeY);
        }
      });
      let maxX = 0, maxY = 0;
      characters.forEach(function (character) {
        maxX = Math.max(maxX, character.__treeX + NODE_W);
        maxY = Math.max(maxY, character.__treeY + NODE_H);
      });
      stageW = Math.max(stageW, maxX + 130);
      stageH = Math.max(stageH, maxY + 120);
    }

    /* Blood lines and spouse bonds. */
    const connectorPaths = [];
    const spousePaths = [];
    const gems = [];
    const anchors = [];

    function curvePath(x1, y1, x2, y2) {
      const bend = Math.max(26, Math.abs(y2 - y1) * 0.42);
      return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
        'C' + x1.toFixed(1) + ' ' + (y1 + bend).toFixed(1) +
        ' ' + x2.toFixed(1) + ' ' + (y2 - bend).toFixed(1) +
        ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
    }

    if (manual) {
      characters.forEach(function (child) {
        [child.fatherId, child.motherId].forEach(function (parentId) {
          const parent = byId[parentId];
          if (!parent || parent === child) return;
          const x1 = parent.__treeX + NODE_W / 2;
          const y1 = parent.__treeY + NODE_H;
          const x2 = child.__treeX + NODE_W / 2;
          const y2 = child.__treeY - 8;
          connectorPaths.push(curvePath(x1, y1, x2, y2));
          anchors.push({ x: x1, y: y1 }, { x: x2, y: y2 });
        });
      });
      const drawnPairs = {};
      characters.forEach(function (character) {
        (character.spouseIds || []).forEach(function (spouseId) {
          const spouse = byId[spouseId];
          if (!spouse) return;
          const key = [character.id, spouse.id].sort().join('|');
          if (drawnPairs[key]) return;
          drawnPairs[key] = true;
          const x1 = character.__treeX + NODE_W / 2;
          const y1 = character.__treeY + NODE_H / 2;
          const x2 = spouse.__treeX + NODE_W / 2;
          const y2 = spouse.__treeY + NODE_H / 2;
          spousePaths.push(curvePath(x1, y1, x2, y2));
          gems.push({ x: (x1 + x2) / 2, y: (y1 + y2) / 2 });
        });
      });
    } else {
      units.forEach(function (unit) {
        if (!unit.parentUnitIds.length) return;
        const parentUnits = unit.parentUnitIds.map(function (id) { return byUnit[id]; }).filter(Boolean);
        if (!parentUnits.length) return;
        const childX = unit.x + unit.width / 2;
        const childTop = unit.y - 10;
        const parentBottom = Math.max.apply(null, parentUnits.map(function (parentUnit) {
          return parentUnit.y + NODE_H;
        }));
        const joinY = parentBottom + Math.min(38, Math.max(22, (childTop - parentBottom) / 2));
        const parentXs = [];
        parentUnits.forEach(function (parentUnit) {
          const px = parentUnit.x + parentUnit.width / 2;
          parentXs.push(px);
          connectorPaths.push('M' + px.toFixed(1) + ' ' + (parentUnit.y + NODE_H).toFixed(1) + 'V' + joinY.toFixed(1));
          anchors.push({ x: px, y: parentUnit.y + NODE_H });
        });
        const minX = Math.min.apply(null, parentXs.concat([childX]));
        const maxX = Math.max.apply(null, parentXs.concat([childX]));
        if (maxX - minX > 0.5) connectorPaths.push('M' + minX.toFixed(1) + ' ' + joinY.toFixed(1) + 'H' + maxX.toFixed(1));
        connectorPaths.push('M' + childX.toFixed(1) + ' ' + joinY.toFixed(1) + 'V' + childTop.toFixed(1));
        anchors.push({ x: childX, y: childTop });
      });

      const drawnPairs = {};
      characters.forEach(function (character) {
        (character.spouseIds || []).forEach(function (spouseId) {
          const spouse = byId[spouseId];
          if (!spouse) return;
          const key = [character.id, spouse.id].sort().join('|');
          if (drawnPairs[key]) return;
          drawnPairs[key] = true;
          const x1 = character.__treeX + NODE_W;
          const y1 = character.__treeY + NODE_H / 2;
          const x2 = spouse.__treeX;
          const y2 = spouse.__treeY + NODE_H / 2;
          if (x2 > x1 - 2) {
            spousePaths.push('M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'H' + (x2 - 8).toFixed(1));
            gems.push({ x: (x1 + x2 - 8) / 2, y: y1 });
          } else {
            spousePaths.push('M' + (character.__treeX + NODE_W / 2).toFixed(1) + ' ' + (character.__treeY + NODE_H).toFixed(1) +
              'C' + (character.__treeX + NODE_W / 2).toFixed(1) + ' ' + (character.__treeY + NODE_H + 28).toFixed(1) +
              ' ' + (spouse.__treeX + NODE_W / 2).toFixed(1) + ' ' + (spouse.__treeY - 28).toFixed(1) +
              ' ' + (spouse.__treeX + NODE_W / 2).toFixed(1) + ' ' + (spouse.__treeY - 10).toFixed(1));
          }
        });
      });
    }

    return {
      characters: characters,
      units: units,
      byId: byId,
      byUnit: byUnit,
      gens: gens,
      maxDepth: maxDepth,
      manual: manual,
      stageW: stageW,
      stageH: stageH,
      bloodPath: connectorPaths.join(' '),
      spousePath: spousePaths.join(' '),
      anchors: anchors,
      gems: gems
    };
  };

  MF.treeNodeMarkup = function (character, query) {
    const avatar = character.portrait
      ? '<img src="' + MF.esc(character.portrait) + '" alt="" loading="lazy">'
      : MF.esc(MF.initials(character.name));
    const status = MF.statusClass(character.status);
    const matched = query && MF.normalize(character.name + ' ' + (character.title || '') + ' ' + (character.role || '')).indexOf(query) !== -1;
    return '<button class="tree-node' + (matched ? ' is-match' : '') + '" style="left:' + character.__treeX.toFixed(1) + 'px;top:' + character.__treeY.toFixed(1) + 'px" data-action="open-character" data-id="' + MF.esc(character.id) + '" aria-label="' + MF.esc(MF.t('Открыть персонажа')) + ' ' + MF.esc(character.name) + '">' +
      '<span class="tree-avatar">' + avatar + '</span>' +
      '<span class="tree-node-copy"><span class="tree-node-name">' + MF.esc(character.name) + '</span>' +
      '<span class="tree-node-title">' + MF.esc(character.title || character.role || character.race || MF.t('Без титула')) + '</span></span>' +
      '<span class="tree-node-status ' + status + '" title="' + MF.esc(character.status || MF.t('Неизвестно')) + '"></span></button>';
  };

  MF.renderTreePage = function () {
    const data = MF.state.data;
    if (!data.characters.length) {
      return '<div class="view tree-page"><div class="page-head"><div class="page-head-main"><div class="eyebrow">Кровные узы</div><h1 class="page-title">Древо рода</h1>' +
        '<p class="page-subtitle">Свяжите героев узами крови и брака — и увидите, как складывается история династии.</p></div></div>' +
        '<div class="tree-shell" style="min-height:520px"><div class="tree-empty"><div class="empty-medallion">' + MF.icon('i-tree') + '</div>' +
        '<h2 class="empty-title">Древо ещё не посажено</h2><p class="empty-text">Добавьте первого персонажа и укажите его родителей, супругов и детей. Древо построится само.</p>' +
        '<button class="btn btn-primary" data-action="new-character">' + MF.icon('i-plus') + 'Добавить персонажа</button></div></div></div>';
    }

    const tree = MF.computeTree();
    const query = MF.normalize(MF.state.ui.treeSearch || '');
    const nodes = tree.characters.map(function (character) { return MF.treeNodeMarkup(character, query); }).join('');
    const bands = tree.manual ? '' : tree.gens.map(function (list, depth) {
      return '<div class="tree-band" style="top:' + (12 + depth * GEN_GAP) + 'px;height:' + GEN_GAP + 'px;width:' + tree.stageW + 'px">' +
        '<span class="tree-band-label">' + roman(depth + 1) + ' ' + MF.t('поколение') + '</span></div>';
    }).join('');
    const anchors = tree.anchors.map(function (anchor) {
      return '<circle class="tree-junction" cx="' + anchor.x.toFixed(1) + '" cy="' + anchor.y.toFixed(1) + '" r="2.3"/>';
    }).join('');
    const gems = tree.gems.map(function (gem) {
      return '<path class="spouse-gem" d="M' + gem.x.toFixed(1) + ' ' + (gem.y - 3.5).toFixed(1) +
        'l3.5 3.5 -3.5 3.5 -3.5 -3.5z"/>';
    }).join('');
    const connectedCount = data.characters.filter(function (character) {
      return character.fatherId || character.motherId || (character.spouseIds && character.spouseIds.length) || MF.childrenOf(character.id).length;
    }).length;

    return '<div class="view tree-page">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">Кровные узы</div><h1 class="page-title">Древо рода</h1>' +
      '<p class="page-subtitle">' + data.characters.length + ' ' + MF.plural(data.characters.length, 'герой', 'героя', 'героев') + ', ' +
      connectedCount + ' ' + MF.plural(connectedCount, 'связь', 'связи', 'связей') + '. Тяните полотно, приближайте и ищите нужное имя.</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-character">' + MF.icon('i-plus') + 'Новый персонаж</button></div></div>' +
      '<div class="tree-shell' + (MF.state.tree.editing ? ' is-editing' : '') + (MF.state.tree.linkMode ? ' is-linking' : '') + '"><div class="tree-viewport" id="treeViewport">' +
      '<div class="tree-search"><div class="search-field">' + MF.icon('i-search') + '<input id="treeSearch" type="search" placeholder="' + MF.t('Найти в древе…') + '" value="' + MF.esc(MF.state.ui.treeSearch || '') + '" autocomplete="off" aria-label="' + MF.t('Поиск по древу') + '"></div></div>' +
      '<div class="tree-controls">' +
      '<button class="icon-btn" id="treeZoomOut" title="' + MF.t('Уменьшить') + '" aria-label="' + MF.t('Уменьшить') + '">' + MF.icon('i-zoom-out') + '</button>' +
      '<span class="tree-zoom-readout" id="treeZoomReadout">100%</span>' +
      '<button class="icon-btn" id="treeZoomIn" title="' + MF.t('Увеличить') + '" aria-label="' + MF.t('Увеличить') + '">' + MF.icon('i-zoom-in') + '</button>' +
      '<span class="control-divider"></span>' +
      '<button class="icon-btn" id="treeFit" title="' + MF.t('Показать всё древо') + '" aria-label="' + MF.t('Показать всё древо') + '">' + MF.icon('i-maximize') + '</button>' +
      '<span class="control-divider"></span>' +
      '<button class="icon-btn tree-edit-btn' + (MF.state.tree.editing ? ' is-active' : '') + '" id="treeEdit" title="' + MF.t('Редактировать расположение') + '" aria-label="' + MF.t('Редактировать расположение') + '">' + MF.icon('i-edit') + '</button>' +
      (MF.state.tree.editing ? '<button class="icon-btn tree-link-btn' + (MF.state.tree.linkMode ? ' is-active' : '') + '" id="treeLink" title="' + MF.t('Связать персонажей') + '" aria-label="' + MF.t('Связать персонажей') + '">' + MF.icon('i-link') + '</button>' +
        '<button class="icon-btn" id="treeReset" title="' + MF.t('Сбросить расположение') + '" aria-label="' + MF.t('Сбросить расположение') + '">' + MF.icon('i-refresh') + '</button>' : '') +
      '</div>' +
      '<div class="tree-legend"><span><i class="legend-line"></i>' + MF.t('кровь') + '</span><span><i class="legend-line legend-line--spouse"></i>' + MF.t('брак') + '</span><span><i class="legend-dot"></i>' + MF.t('жив') + '</span></div>' +
      '<div class="tree-hint">' + MF.icon('i-move') + (MF.state.tree.linkMode ? MF.t('Выберите первого персонажа, затем второго — и задайте связь.') : (MF.state.tree.editing ? MF.t('Перетаскивайте карточки. Связи в карточках обновятся автоматически.') : MF.t('тяните полотно · колесо — масштаб'))) + '</div>' +
      '<div class="tree-stage" id="treeStage" style="width:' + tree.stageW + 'px;height:' + tree.stageH + 'px">' +
      bands +
      '<svg class="tree-svg" width="' + tree.stageW + '" height="' + tree.stageH + '" viewBox="0 0 ' + tree.stageW + ' ' + tree.stageH + '">' +
      '<defs><filter id="treeGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      (tree.spousePath ? '<path class="spouse-line spouse-line--under" d="' + tree.spousePath + '"></path><path class="spouse-line" d="' + tree.spousePath + '"></path>' : '') +
      (tree.bloodPath ? '<path class="blood-line blood-line--under" d="' + tree.bloodPath + '"></path><path class="blood-line" d="' + tree.bloodPath + '"></path>' : '') +
      anchors + gems + '</svg>' +
      nodes + '</div></div></div></div>';
  };

  MF.applyTreeTransform = function () {
    const stage = MF.$('#treeStage');
    if (!stage) return;
    const tree = MF.state.tree;
    stage.style.transform = 'translate(' + tree.panX.toFixed(2) + 'px,' + tree.panY.toFixed(2) + 'px) scale(' + tree.zoom.toFixed(3) + ')';
    const readout = MF.$('#treeZoomReadout');
    if (readout) readout.textContent = Math.round(tree.zoom * 100) + '%';
  };

  MF.fitTree = function () {
    const viewport = MF.$('#treeViewport');
    const stage = MF.$('#treeStage');
    if (!viewport || !stage) return;
    const tree = MF.state.tree;
    const width = Number(stage.style.width.replace('px', '')) || stage.offsetWidth;
    const height = Number(stage.style.height.replace('px', '')) || stage.offsetHeight;
    const viewW = viewport.clientWidth;
    const viewH = viewport.clientHeight;
    const scale = MF.clamp(Math.min((viewW - 46) / width, (viewH - 34) / height), 0.22, 1.1);
    tree.zoom = scale;
    tree.panX = (viewW - width * scale) / 2;
    tree.panY = Math.max(4, (viewH - height * scale) / 2);
    tree.userAdjusted = false;
    MF.applyTreeTransform();
  };

  MF.zoomTree = function (factor, originX, originY) {
    const viewport = MF.$('#treeViewport');
    if (!viewport) return;
    const tree = MF.state.tree;
    const old = tree.zoom;
    const next = MF.clamp(old * factor, 0.22, 2.4);
    if (next === old) return;
    const x = originX == null ? viewport.clientWidth / 2 : originX;
    const y = originY == null ? viewport.clientHeight / 2 : originY;
    tree.panX = x - (x - tree.panX) * (next / old);
    tree.panY = y - (y - tree.panY) * (next / old);
    tree.zoom = next;
    tree.userAdjusted = true;
    MF.applyTreeTransform();
  };

  MF.initTree = function () {
    const viewport = MF.$('#treeViewport');
    const stage = MF.$('#treeStage');
    if (!viewport || !stage) return;
    const tree = MF.state.tree;
    const key = MF.state.data.characters.map(function (character) {
      return character.id + ':' + (character.fatherId || '') + ':' + (character.motherId || '') + ':' + (character.spouseIds || []).join(',');
    }).join('|');
    if (tree.layoutKey !== key) {
      tree.layoutKey = key;
      tree.userAdjusted = false;
      tree.zoom = 1;
      tree.panX = 0;
      tree.panY = 0;
    }

    if (!tree.userAdjusted) MF.fitTree();
    else MF.applyTreeTransform();

    const search = MF.$('#treeSearch');
    const applySearch = function () {
      const query = MF.normalize(search.value);
      MF.state.ui.treeSearch = search.value;
      const nodes = MF.$$('.tree-node', stage);
      nodes.forEach(function (node) {
        const id = node.getAttribute('data-id');
        const character = MF.getCharacter(id);
        if (!character) return;
        const haystack = MF.normalize([character.name, character.title, character.role, character.race, (character.tags || []).join(' ')].join(' '));
        node.classList.toggle('is-match', !!query && haystack.indexOf(query) !== -1);
        node.classList.toggle('is-dimmed', !!query && haystack.indexOf(query) === -1);
      });
    };
    if (search) {
      search.addEventListener('input', applySearch);
      search.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          const first = MF.$('.tree-node.is-match', stage);
          if (first) first.click();
        }
      });
    }

    const zoomIn = MF.$('#treeZoomIn');
    const zoomOut = MF.$('#treeZoomOut');
    const fit = MF.$('#treeFit');
    if (zoomIn) zoomIn.addEventListener('click', function () { MF.zoomTree(1.18); });
    if (zoomOut) zoomOut.addEventListener('click', function () { MF.zoomTree(0.85); });
    if (fit) fit.addEventListener('click', function () { MF.fitTree(); });

    const editButton = MF.$('#treeEdit');
    if (editButton) {
      editButton.addEventListener('click', function () {
        tree.editing = !tree.editing;
        tree.linkMode = false;
        tree.linkSource = null;
        MF.renderCurrentPage({ keepScroll: true });
      });
    }
    const linkButton = MF.$('#treeLink');
    if (linkButton) {
      linkButton.addEventListener('click', function () {
        tree.linkMode = !tree.linkMode;
        tree.linkSource = null;
        MF.$$('.tree-node.is-link-source').forEach(function (node) { node.classList.remove('is-link-source'); });
        MF.renderCurrentPage({ keepScroll: true });
      });
    }
    const resetButton = MF.$('#treeReset');
    if (resetButton) {
      resetButton.addEventListener('click', async function () {
        MF.state.data.characters.forEach(function (character) {
          delete character.treeX;
          delete character.treeY;
        });
        tree.userAdjusted = false;
        tree.layoutKey = '';
        tree.linkSource = null;
        await MF.saveNow();
        MF.renderCurrentPage({ keepScroll: true });
        MF.toast('Расположение сброшено', 'Древо снова построено автоматически.', 'success');
      });
    }

    stage.addEventListener('click', function (event) {
      if (!tree.editing) return;
      const node = event.target.closest('.tree-node');
      if (!node) return;
      event.preventDefault();
      event.stopPropagation();
      if (!tree.linkMode) return;
      const id = node.getAttribute('data-id');
      if (!id) return;
      if (!tree.linkSource) {
        tree.linkSource = id;
        node.classList.add('is-link-source');
        MF.toast('Первый персонаж выбран', 'Теперь нажмите на второго персонажа.', 'info');
        return;
      }
      if (tree.linkSource === id) {
        tree.linkSource = null;
        node.classList.remove('is-link-source');
        return;
      }
      const first = tree.linkSource;
      tree.linkSource = null;
      MF.$$('.tree-node.is-link-source').forEach(function (item) { item.classList.remove('is-link-source'); });
      MF.openTreeRelationForm(first, id);
    }, true);

    stage.addEventListener('pointerdown', function (event) {
      if (!tree.editing || tree.linkMode || event.button !== 0) return;
      const node = event.target.closest('.tree-node');
      if (!node) return;
      const id = node.getAttribute('data-id');
      const character = MF.getCharacter(id);
      if (!character) return;
      event.preventDefault();
      event.stopPropagation();
      const startX = (character.treeX !== null && character.treeX !== undefined && character.treeX !== '' && Number.isFinite(Number(character.treeX))) ? Number(character.treeX) : character.__treeX;
      const startY = (character.treeY !== null && character.treeY !== undefined && character.treeY !== '' && Number.isFinite(Number(character.treeY))) ? Number(character.treeY) : character.__treeY;
      const startMouseX = event.clientX;
      const startMouseY = event.clientY;
      let moved = false;
      node.classList.add('is-node-dragging');
      try { node.setPointerCapture(event.pointerId); } catch (e) {}
      function move(moveEvent) {
        const dx = (moveEvent.clientX - startMouseX) / tree.zoom;
        const dy = (moveEvent.clientY - startMouseY) / tree.zoom;
        if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
        const x = Math.max(12, startX + dx);
        const y = Math.max(12, startY + dy);
        character.treeX = Math.round(x);
        character.treeY = Math.round(y);
        character.__treeX = x;
        character.__treeY = y;
        node.style.left = x.toFixed(1) + 'px';
        node.style.top = y.toFixed(1) + 'px';
      }
      function up() {
        node.classList.remove('is-node-dragging');
        try { node.releasePointerCapture(event.pointerId); } catch (e) {}
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerup', up);
        node.removeEventListener('pointercancel', up);
        if (!moved) return;
        character.updatedAt = MF.nowISO();
        tree.userAdjusted = true;
        MF.saveNow().then(function () {
          MF.renderCurrentPage({ keepScroll: true });
        });
      }
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    }, true);

    let dragMoved = false;
    viewport.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.target.closest('.tree-node, .tree-controls, .tree-search, button, input, textarea, select')) return;
      tree.dragging = true;
      dragMoved = false;
      tree.dragStartX = event.clientX;
      tree.dragStartY = event.clientY;
      tree.startPanX = tree.panX;
      tree.startPanY = tree.panY;
      viewport.classList.add('is-dragging');
      try { viewport.setPointerCapture(event.pointerId); } catch (e) {}
    });
    viewport.addEventListener('pointermove', function (event) {
      if (!tree.dragging) return;
      const dx = event.clientX - tree.dragStartX;
      const dy = event.clientY - tree.dragStartY;
      if (Math.abs(dx) + Math.abs(dy) > 4) {
        dragMoved = true;
        tree.userAdjusted = true;
      }
      tree.panX = tree.startPanX + dx;
      tree.panY = tree.startPanY + dy;
      MF.applyTreeTransform();
    });
    function endDrag(event) {
      if (!tree.dragging) return;
      tree.dragging = false;
      viewport.classList.remove('is-dragging');
      try { viewport.releasePointerCapture(event.pointerId); } catch (e) {}
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('click', function (event) {
      if (dragMoved) {
        event.stopPropagation();
        event.preventDefault();
        dragMoved = false;
      }
    }, true);

    viewport.addEventListener('wheel', function (event) {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      MF.zoomTree(event.deltaY < 0 ? 1.1 : 0.91, x, y);
    }, { passive: false });

    const resizeHandler = function () {
      if (!tree.userAdjusted) MF.fitTree();
    };
    window.addEventListener('resize', resizeHandler);
    viewport.__resizeHandler = resizeHandler;
    applySearch();
  };
})();
