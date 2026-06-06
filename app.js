/* ==================================================
   Football Tactics Board - app.js
   Core logic: formations, drag, edit, save/load, export
   ================================================== */

(function () {
  'use strict';

  // ============================================================
  // 1. FORMATION DATA
  // ============================================================

  /**
   * 阵型定义：球员人数 -> 可选阵型列表
   * 每个阵型是一个数字数组，如 [4, 3, 3] 表示 4后卫 3中场 3前锋
   * 守门员自动添加在最下方（1人）
   */
  var FORMATIONS = {
    5: {
      list: [[1, 2, 1], [2, 1, 1], [1, 1, 2]],
      labels: ['1-2-1', '2-1-1', '1-1-2']
    },
    7: {
      list: [[2, 3, 1], [3, 2, 1], [2, 2, 2]],
      labels: ['2-3-1', '3-2-1', '2-2-2']
    },
    8: {
      list: [[2, 3, 2], [3, 3, 1], [2, 4, 1]],
      labels: ['2-3-2', '3-3-1', '2-4-1']
    },
    11: {
      list: [[4, 3, 3], [4, 2, 3, 1], [4, 4, 2], [3, 5, 2]],
      labels: ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2']
    }
  };

  /**
   * 位置简称映射
   */
  var POSITION_LABELS = {
    GK: 'GK',
    DEF: 'DF',
    MID: 'MF',
    FWD: 'FW'
  };

  /**
   * 根据阵型数组决定每条线的位置简称
   * @param {number[]} lines - e.g. [4, 3, 3]
   * @returns {string[]} - e.g. ['DEF', 'MID', 'FWD']
   */
  function getPositionLabels(lines) {
    if (lines.length === 3) {
      return ['DEF', 'MID', 'FWD'];
    } else if (lines.length === 4) {
      // e.g., 4-2-3-1: DEF, MID, MID2, FWD
      return ['DEF', 'MID', 'MID', 'FWD'];
    }
    // fallback
    return lines.map(function (_, i) {
      if (i === 0) return 'DEF';
      if (i === lines.length - 1) return 'FWD';
      return 'MID';
    });
  }

  // ============================================================
  // 2. PLAYER DATA MANAGEMENT
  // ============================================================

  /** @type {Array<{id:number, number:number, name:string, position:string, x:number, y:number}>} */
  var players = [];
  var currentPlayerCount = 11;
  var currentFormationIndex = 0;

  /**
   * 计算某个阵型下所有球员的默认坐标
   * Field is oriented with attack going UP (bottom to top in visual).
   * GK at bottom (~90%), lines distributed upwards.
   *
   * @param {number[]} lines - e.g. [4, 3, 3]
   * @param {number} total - total players including GK
   * @returns {Array<{x: number, y: number, position: string, lineIndex: number}>}
   */
  function calculatePositions(lines, total) {
    var positions = [];
    var linesCount = lines.length;

    // Y positions: evenly spaced from ~75% (front line) to ~15% (back line)
    // GK at 90%
    var gkY = 90;
    // Outfield lines: spread from top to bottom
    // Top line (forwards) near 12%, bottom line (defenders) near 72%
    var topY = 14;
    var bottomY = 72;

    // Add GK
    positions.push({ x: 50, y: gkY, position: 'GK', lineIndex: -1 });

    // Calculate Y for each line
    var lineYs = [];
    if (linesCount === 1) {
      lineYs = [45];
    } else {
      for (var li = 0; li < linesCount; li++) {
        var y;
        if (linesCount === 2) {
          y = (li === 0) ? bottomY : topY;
        } else {
          y = bottomY - (li / (linesCount - 1)) * (bottomY - topY);
        }
        lineYs.push(y);
      }
    }

    var playerId = 1; // GK is id=1

    var posLabels = getPositionLabels(lines);

    for (var li2 = 0; li2 < linesCount; li2++) {
      var count = lines[li2];
      var baseY = lineYs[li2];
      var label = posLabels[li2];

      for (var pi = 0; pi < count; pi++) {
        var x;
        if (count === 1) {
          x = 50;
        } else {
          // spread across width: 15% to 85%
          var spreadStart = 12;
          var spreadEnd = 88;
          x = spreadStart + (pi / (count - 1)) * (spreadEnd - spreadStart);
        }
        positions.push({ x: x, y: baseY, position: label, lineIndex: li2 });
      }
    }

    return positions;
  }

  /**
   * Generate players from formation
   */
  function generatePlayers(playerCount, formationLines) {
    var defaults = calculatePositions(formationLines, playerCount);
    var newPlayers = [];
    var num = 1;

    defaults.forEach(function (def, idx) {
      var posLabel = def.position;
      // Determine a more specific default position abbreviation
      var displayPos;
      if (posLabel === 'GK') {
        displayPos = 'GK';
      } else if (posLabel === 'DEF') {
        displayPos = 'DF';
      } else if (posLabel === 'MID') {
        displayPos = 'MF';
      } else {
        displayPos = 'FW';
      }

      newPlayers.push({
        id: idx,
        number: num,
        name: '',
        position: displayPos,
        x: def.x,
        y: def.y
      });
      num++;
    });

    return newPlayers;
  }

  // ============================================================
  // 3. RENDERING
  // ============================================================

  var fieldEl = document.getElementById('field');
  var playersContainer = document.getElementById('playersContainer');

  function getPlayerColorClass(player) {
    var pos = player.position.toUpperCase();
    if (pos === 'GK') return 'player-gk';
    if (pos.indexOf('D') === 0 || pos === 'DF') return 'player-def';
    if (pos.indexOf('M') === 0 || pos === 'MF') return 'player-mid';
    if (pos.indexOf('F') === 0 || pos === 'FW' || pos === 'ST') return 'player-fwd';
    return 'player-def';
  }

  function renderPlayers() {
    playersContainer.innerHTML = '';

    players.forEach(function (player) {
      var dot = document.createElement('div');
      dot.className = 'player ' + getPlayerColorClass(player);
      dot.setAttribute('data-player-id', player.id);
      dot.style.left = player.x + '%';
      dot.style.top = player.y + '%';

      var numberSpan = document.createElement('span');
      numberSpan.className = 'player-number';
      numberSpan.textContent = player.number;

      var positionSpan = document.createElement('span');
      positionSpan.className = 'player-position';
      positionSpan.textContent = player.position;

      dot.appendChild(numberSpan);
      dot.appendChild(positionSpan);

      // Click to edit
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        editPlayer(player);
      });

      playersContainer.appendChild(dot);
    });
  }

  // ============================================================
  // 4. DRAG AND DROP (Pointer Events)
  // ============================================================

  var dragState = null;

  /**
   * @typedef {Object} DragState
   * @property {number} playerId
   * @property {HTMLElement} element
   * @property {number} startX - pointer clientX at drag start
   * @property {number} startY - pointer clientY at drag start
   * @property {number} playerStartX - player X% at drag start
   * @property {number} playerStartY - player Y% at drag start
   * @property {number} fieldWidth - field element width at drag start
   * @property {number} fieldHeight - field element height at drag start
   * @property {number} fieldLeft - field left offset
   * @property {number} fieldTop - field top offset
   */

  function getFieldBounds() {
    var rect = fieldEl.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function onPointerDown(e) {
    var dot = e.target.closest('.player');
    if (!dot) return;

    e.preventDefault();
    dot.setPointerCapture(e.pointerId);

    var playerId = parseInt(dot.getAttribute('data-player-id'), 10);
    var player = players.find(function (p) { return p.id === playerId; });
    if (!player) return;

    var bounds = getFieldBounds();

    dot.classList.add('dragging');

    dragState = {
      playerId: playerId,
      element: dot,
      startX: e.clientX,
      startY: e.clientY,
      playerStartX: player.x,
      playerStartY: player.y,
      fieldWidth: bounds.width,
      fieldHeight: bounds.height,
      fieldLeft: bounds.left,
      fieldTop: bounds.top
    };
  }

  function onPointerMove(e) {
    if (!dragState) return;

    e.preventDefault();

    var dx = e.clientX - dragState.startX;
    var dy = e.clientY - dragState.startY;

    // Convert pixel delta to percentage delta
    var dxPct = (dx / dragState.fieldWidth) * 100;
    var dyPct = (dy / dragState.fieldHeight) * 100;

    var newX = dragState.playerStartX + dxPct;
    var newY = dragState.playerStartY + dyPct;

    // Clamp to field bounds (with margin for player circle radius ~3%)
    newX = Math.max(3, Math.min(97, newX));
    newY = Math.max(1, Math.min(99, newY));

    // Update DOM immediately for responsiveness
    dragState.element.style.left = newX + '%';
    dragState.element.style.top = newY + '%';

    // Update player data
    var player = players.find(function (p) { return p.id === dragState.playerId; });
    if (player) {
      player.x = newX;
      player.y = newY;
    }
  }

  function onPointerUp(e) {
    if (!dragState) return;

    e.preventDefault();

    dragState.element.classList.remove('dragging');

    try {
      dragState.element.releasePointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }

    dragState = null;
  }

  function setupDragListeners() {
    playersContainer.addEventListener('pointerdown', onPointerDown);
    playersContainer.addEventListener('pointermove', onPointerMove);
    playersContainer.addEventListener('pointerup', onPointerUp);
    playersContainer.addEventListener('pointercancel', onPointerUp);
  }

  // ============================================================
  // 5. EDIT PLAYER
  // ============================================================

  function editPlayer(player) {
    var newNumber = prompt(
      '编辑球员 #' + player.number + '\n\n请输入号码：',
      player.number
    );

    if (newNumber === null) return; // cancelled

    var numVal = parseInt(newNumber, 10);
    if (isNaN(numVal) || numVal < 1 || numVal > 99) {
      alert('号码请填写 1-99 之间的数字。');
      return;
    }

    var newName = prompt(
      '编辑球员 #' + numVal + '\n\n请输入姓名（可留空）：',
      player.name
    );

    if (newName === null) return; // cancelled

    var newPosition = prompt(
      '编辑球员 #' + numVal + ' ' + (newName || '') + '\n\n请输入位置（如 GK, DF, MF, FW, CM, ST 等）：',
      player.position
    );

    if (newPosition === null) return; // cancelled

    player.number = numVal;
    player.name = newName.trim();
    player.position = newPosition.trim().toUpperCase() || player.position;

    renderPlayers();
  }

  // ============================================================
  // 6. SAVE / LOAD (localStorage)
  // ============================================================

  var STORAGE_KEY = 'football_tactics_board_saved_lineup';

  function saveLineup() {
    var data = {
      playerCount: currentPlayerCount,
      formationIndex: currentFormationIndex,
      players: players.map(function (p) {
        return {
          id: p.id,
          number: p.number,
          name: p.name,
          position: p.position,
          x: p.x,
          y: p.y
        };
      })
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      alert('✅ 阵型已保存！');
    } catch (err) {
      alert('❌ 保存失败：' + err.message);
    }
  }

  function loadLineup() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      alert('📭 没有已保存的阵型。');
      return;
    }

    try {
      var data = JSON.parse(raw);

      if (!data.players || !Array.isArray(data.players)) {
        throw new Error('数据格式错误');
      }

      currentPlayerCount = data.playerCount || 11;
      currentFormationIndex = data.formationIndex || 0;

      document.getElementById('playerCount').value = currentPlayerCount;
      updateFormationSelect();

      if (currentFormationIndex < FORMATIONS[currentPlayerCount].list.length) {
        document.getElementById('formation').value = currentFormationIndex;
      }

      players = data.players;
      renderPlayers();

      alert('✅ 阵型已加载！');
    } catch (err) {
      alert('❌ 加载失败，数据可能已损坏：' + err.message);
    }
  }

  // ============================================================
  // 7. EXPORT PNG
  // ============================================================

  function exportPNG() {
    if (typeof html2canvas === 'undefined') {
      alert('❌ html2canvas 库加载失败。请检查网络连接后刷新页面。');
      return;
    }

    var exportBtn = document.getElementById('btnExport');
    exportBtn.disabled = true;
    exportBtn.textContent = '⏳ 导出中...';

    html2canvas(fieldEl, {
      backgroundColor: null,
      scale: 2, // higher resolution
      useCORS: true,
      logging: false
    }).then(function (canvas) {
      var link = document.createElement('a');
      link.download = 'football_lineup.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      exportBtn.disabled = false;
      exportBtn.textContent = '📸 导出图片';
    }).catch(function (err) {
      alert('❌ 导出失败：' + err.message);
      exportBtn.disabled = false;
      exportBtn.textContent = '📸 导出图片';
    });
  }

  // ============================================================
  // 8. FORMATION SWITCHING
  // ============================================================

  function updateFormationSelect() {
    var sel = document.getElementById('formation');
    sel.innerHTML = '';

    var formationData = FORMATIONS[currentPlayerCount];
    formationData.labels.forEach(function (label, index) {
      var opt = document.createElement('option');
      opt.value = index;
      opt.textContent = label;
      sel.appendChild(opt);
    });

    sel.value = 0;
  }

  function applyFormation() {
    var count = currentPlayerCount;
    var idx = parseInt(document.getElementById('formation').value, 10);
    currentFormationIndex = idx;

    var formationLines = FORMATIONS[count].list[idx];

    // For 5-a-side: 1 GK + field players; formationLines already accounts for all
    // For others: formationLines are outfield lines, +1 GK
    players = generatePlayers(count, formationLines);
    renderPlayers();
  }

  function resetFormation() {
    applyFormation();
  }

  // ============================================================
  // 9. INITIALIZATION
  // ============================================================

  function init() {
    // Set up dropdown handlers
    var countSelect = document.getElementById('playerCount');
    var formationSelect = document.getElementById('formation');

    countSelect.addEventListener('change', function () {
      currentPlayerCount = parseInt(countSelect.value, 10);
      updateFormationSelect();
      applyFormation();
    });

    formationSelect.addEventListener('change', function () {
      applyFormation();
    });

    // Buttons
    document.getElementById('btnReset').addEventListener('click', resetFormation);
    document.getElementById('btnExport').addEventListener('click', exportPNG);
    document.getElementById('btnSave').addEventListener('click', saveLineup);
    document.getElementById('btnLoad').addEventListener('click', loadLineup);

    // Drag support
    setupDragListeners();

    // Initial render
    updateFormationSelect();
    applyFormation();
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
