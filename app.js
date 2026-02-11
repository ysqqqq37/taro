const majorArcana = [
  '愚者', '魔术师', '女祭司', '皇后', '皇帝', '教皇', '恋人', '战车', '力量', '隐士',
  '命运之轮', '正义', '倒吊人', '死神', '节制', '恶魔', '高塔', '星星', '月亮', '太阳',
  '审判', '世界'
];

const suits = ['权杖', '圣杯', '宝剑', '星币'];
const pips = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', '侍从', '骑士', '皇后', '国王'];

const fullDeck = [
  ...majorArcana,
  ...suits.flatMap((suit) => pips.map((pip) => `${suit}${pip}`))
];

const cardKeywords = {
  愚者: '新的旅程与勇气', 魔术师: '掌控资源与创造力', 女祭司: '直觉与潜意识', 皇后: '丰盛与滋养',
  皇帝: '结构与责任', 教皇: '信念与规则', 恋人: '关系与抉择', 战车: '行动与意志', 力量: '温柔的控制',
  隐士: '独处反思', 命运之轮: '循环与转机', 正义: '因果与平衡', 倒吊人: '延迟与换位思考',
  死神: '结束与蜕变', 节制: '整合与调和', 恶魔: '束缚与欲望', 高塔: '突变与重建', 星星: '希望与疗愈',
  月亮: '迷雾与感受', 太阳: '清晰与成功', 审判: '觉醒与召唤', 世界: '完成与整合'
};

const CARD_W = 92;
const CARD_H = 146;

const state = {
  question: '',
  drawCount: 3,
  selectedCards: [],
  selectedCardId: null,
  dealt: false,
  viewportOffset: 0,
  maxOffset: 0,
  canvasWidth: 0,
  lastPalmX: null,
  lastFingerY: null,
  lastUpSwipeAt: 0
};

const questionScreen = document.querySelector('#question-screen');
const drawScreen = document.querySelector('#draw-screen');
const startBtn = document.querySelector('#start-btn');
const finishBtn = document.querySelector('#finish-btn');
const questionInput = document.querySelector('#question-input');
const statusText = document.querySelector('#status-text');
const deckViewportEl = document.querySelector('#deck-viewport');
const deckCanvasEl = document.querySelector('#deck-canvas');
const selectedCardsEl = document.querySelector('#selected-cards');
const selectedCountEl = document.querySelector('#selected-count');
const readingResultEl = document.querySelector('#reading-result');
const readingQuestionEl = document.querySelector('#reading-question');
const readingCardsEl = document.querySelector('#reading-cards');
const readingTextEl = document.querySelector('#reading-text');
const gestureStateEl = document.querySelector('#gesture-state');
const cameraEl = document.querySelector('#camera');

startBtn.addEventListener('click', startExperience);
finishBtn.addEventListener('click', showReading);
window.addEventListener('resize', updateCanvasRange);

function startExperience() {
  const question = questionInput.value.trim();
  if (!question) {
    questionInput.focus();
    return;
  }

  const drawOption = document.querySelector('input[name="draw-count"]:checked');
  state.drawCount = Number(drawOption?.value || 3);
  state.question = question;

  questionScreen.classList.remove('active');
  drawScreen.classList.add('active');

  dealAllCards();
  initCameraGesture();
}

function dealAllCards() {
  deckCanvasEl.innerHTML = '';
  state.selectedCards = [];
  state.selectedCardId = null;
  state.dealt = false;
  state.viewportOffset = 0;
  finishBtn.disabled = true;
  renderSelectedCards();

  const viewportWidth = deckViewportEl.clientWidth;
  const viewportHeight = deckViewportEl.clientHeight;
  state.canvasWidth = Math.max(viewportWidth * 2.8, 2200);
  deckCanvasEl.style.width = `${state.canvasWidth}px`;

  const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);
  shuffled.forEach((name, index) => {
    const card = document.createElement('button');
    card.className = 'card';
    card.dataset.id = String(index);
    card.dataset.name = name;

    const x = Math.random() * (state.canvasWidth - CARD_W - 20) + 10;
    const y = Math.random() * (viewportHeight - CARD_H - 24) + 12;
    const angle = Math.random() * 24 - 12;

    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.style.rotate = `${angle}deg`;
    card.style.animationDelay = `${index * 15}ms`;
    card.style.animation = `${card.style.animation}, float ${2.4 + Math.random() * 2.2}s ease-in-out ${Math.random() * 1.2}s infinite`;
    card.title = name;

    card.addEventListener('click', () => {
      selectCard(card.dataset.id);
      pullCard(card.dataset.id);
    });

    deckCanvasEl.appendChild(card);
  });

  updateCanvasRange();

  setTimeout(() => {
    state.dealt = true;
    statusText.textContent = `请浏览牌阵并抽出 ${state.drawCount} 张牌。`;
  }, 1600);
}

function updateCanvasRange() {
  state.maxOffset = Math.max(0, state.canvasWidth - deckViewportEl.clientWidth);
  state.viewportOffset = Math.min(state.viewportOffset, state.maxOffset);
  updateCanvasOffset();
}

function updateCanvasOffset() {
  deckCanvasEl.style.transform = `translateX(${-state.viewportOffset}px)`;
}

function browseDeck(deltaPx) {
  if (!state.dealt) return;
  state.viewportOffset = Math.max(0, Math.min(state.maxOffset, state.viewportOffset + deltaPx));
  updateCanvasOffset();
}

function selectCard(cardId) {
  const cards = [...deckCanvasEl.querySelectorAll('.card')];
  cards.forEach((card) => card.classList.remove('selected'));
  const card = deckCanvasEl.querySelector(`.card[data-id="${cardId}"]`);
  if (!card || card.classList.contains('pulled')) return;

  card.classList.add('selected');
  state.selectedCardId = cardId;
}

function pullCard(cardId) {
  if (!state.dealt || state.selectedCards.length >= state.drawCount) return;

  const card = deckCanvasEl.querySelector(`.card[data-id="${cardId}"]`);
  if (!card || card.classList.contains('pulled')) return;

  const orientation = Math.random() > 0.5 ? '正位' : '逆位';
  card.classList.add('pulled');
  card.classList.remove('selected');

  state.selectedCards.push({ name: card.dataset.name, orientation });
  renderSelectedCards();

  if (state.selectedCards.length === state.drawCount) {
    statusText.textContent = '抽牌完成，请点击“生成解读”。';
    finishBtn.disabled = false;
    state.selectedCardId = null;
  }
}

function renderSelectedCards() {
  selectedCountEl.textContent = String(state.selectedCards.length);
  selectedCardsEl.innerHTML = state.selectedCards
    .map(
      (card, i) => `
      <div class="mini-card">
        <strong>${i + 1}. ${card.name}</strong><br/>
        <em>${card.orientation}</em>
      </div>
    `
    )
    .join('');
}

function showReading() {
  const guidance = state.selectedCards
    .map((card, i) => {
      const key = cardKeywords[card.name] || `${card.name}象征转机与课题`;
      const polarity = card.orientation === '正位' ? '当前能量较顺畅，适合主动推进' : '能量处于内化期，需要先梳理阻碍';
      return `${i + 1}）${card.name}（${card.orientation}）：${key}，${polarity}。`;
    })
    .join(' ');

  readingQuestionEl.textContent = `问题：${state.question}`;
  readingCardsEl.textContent = `牌阵：${state.selectedCards.map((card) => `${card.name}${card.orientation}`).join('、')}`;
  readingTextEl.textContent = `综合解读：围绕你的问题“${state.question}”，牌面提示你目前正处于关键调整窗口。${guidance} 建议先明确最核心目标，再分步骤行动，并持续观察新的信号。`;

  readingResultEl.classList.remove('hidden');
  readingResultEl.scrollIntoView({ behavior: 'smooth' });
}

async function initCameraGesture() {
  if (!window.Hands || !window.Camera) {
    gestureStateEl.textContent = '摄像头状态：手势库加载失败，将启用鼠标点击抽牌。';
    return;
  }

  try {
    const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.6
    });

    hands.onResults((results) => {
      if (!results.multiHandLandmarks?.length) return;
      const landmarks = results.multiHandLandmarks[0];
      handlePalmSwipe(landmarks[0].x);
      handleFingerPoint(landmarks[8].x, landmarks[8].y);
      handleUpSwipe(landmarks[8].y);
    });

    const camera = new Camera(cameraEl, {
      onFrame: async () => {
        await hands.send({ image: cameraEl });
      },
      width: 360,
      height: 240
    });

    await camera.start();
    gestureStateEl.textContent = '摄像头状态：已连接，左右滑手掌可浏览牌阵。';
  } catch (error) {
    gestureStateEl.textContent = '摄像头状态：无法访问摄像头，请检查浏览器权限。';
    console.error(error);
  }
}

function handlePalmSwipe(currentX) {
  if (state.lastPalmX === null) {
    state.lastPalmX = currentX;
    return;
  }

  const diff = currentX - state.lastPalmX;
  if (Math.abs(diff) > 0.09) {
    browseDeck(diff > 0 ? -220 : 220);
    state.lastPalmX = currentX;
  }
}

function handleFingerPoint(currentX, currentY) {
  if (!state.dealt) return;

  const px = state.viewportOffset + currentX * deckViewportEl.clientWidth;
  const py = currentY * deckViewportEl.clientHeight;

  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  const cards = [...deckCanvasEl.querySelectorAll('.card:not(.pulled)')];
  cards.forEach((card) => {
    const x = Number.parseFloat(card.style.left);
    const y = Number.parseFloat(card.style.top);
    const cx = x + CARD_W / 2;
    const cy = y + CARD_H / 2;
    const d = Math.hypot(px - cx, py - cy);
    if (d < bestDistance) {
      bestDistance = d;
      best = card;
    }
  });

  if (best && bestDistance < 110) {
    selectCard(best.dataset.id);
  }
}

function handleUpSwipe(currentY) {
  if (state.lastFingerY === null) {
    state.lastFingerY = currentY;
    return;
  }

  const now = Date.now();
  const diff = state.lastFingerY - currentY;
  if (diff > 0.12 && now - state.lastUpSwipeAt > 850 && state.selectedCardId !== null) {
    pullCard(state.selectedCardId);
    state.lastUpSwipeAt = now;
  }

  state.lastFingerY = currentY;
}

window.addEventListener('keydown', (event) => {
  if (!drawScreen.classList.contains('active')) return;
  if (event.key === 'ArrowLeft') browseDeck(-180);
  if (event.key === 'ArrowRight') browseDeck(180);
  if (event.key === 'ArrowUp' && state.selectedCardId !== null) pullCard(state.selectedCardId);
});
