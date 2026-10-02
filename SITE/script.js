const JSON_FILE_URL = 'data.json'; 

let allCards = [];
let allTypes = []; // Armazena a lista global de tipos do JSON

// Elementos do Modal
const modal = document.getElementById('card-modal');
const modalDetails = document.getElementById('modal-details');
const closeModalBtn = document.getElementById('close-modal');

closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

function getCardImage(card) {
  const commonKeys = ['image', 'imageUrl', 'image_url', 'imagem', 'img', 'photo', 'picture', 'card_image'];
  for (const key of commonKeys) {
    if (card[key]) return card[key];
  }
  
  for (const [key, value] of Object.entries(card)) {
    if (typeof value === 'string' && (value.includes('.jpg') || value.includes('.png') || value.includes('.jpeg') || value.includes('images/'))) {
      return value;
    }
  }

  if (card.card_images && Array.isArray(card.card_images) && card.card_images[0]) {
    return card.card_images[0].image_url || card.card_images[0].imageUrl || '';
  }

  return 'https://via.placeholder.com/200x290?text=Sem+Imagem';
}

function getCardName(card) {
  return card.name || card.nome || card.title || 'Carta Sem Nome';
}

// Função robusta que cruza o ID da carta com a lista global 'types' ou lê direto
function getCardType(card) {
  // 1. Tenta buscar pelo ID do tipo na lista global 'allTypes' do JSON
  const typeId = card.type_id || card.typeId || (typeof card.type === 'number' ? card.type : null);
  if (typeId !== null && allTypes.length > 0) {
    const foundType = allTypes.find(t => t.id === typeId);
    if (foundType && foundType.name) {
      return foundType.name;
    }
  }

  // 2. Se a carta possuir um array 'types' interno próprio
  if (card.types && Array.isArray(card.types) && card.types.length > 0) {
    if (typeof card.types[0] === 'object' && card.types[0] !== null && card.types[0].name) {
      return card.types[0].name;
    }
    if (typeof card.types[0] === 'string') {
      return card.types[0];
    }
  }

  // 3. Fallbacks para propriedades diretas em formato de texto
  if (typeof card.type === 'string' && card.type.trim() !== '') return card.type;
  if (card.tipo) return card.tipo;
  if (card.race) return card.race;
  if (card.attribute) return card.attribute;

  return 'Desconhecido';
}

async function loadCards() {
  try {
    const response = await fetch(JSON_FILE_URL);
    if (!response.ok) {
      throw new Error('Não foi possível carregar o ficheiro JSON.');
    }
    const data = await response.json();
    
    // Captura separadamente a lista de cartas e a lista global de tipos
    allCards = data.cards || (Array.isArray(data) ? data : (data.data || []));
    allTypes = data.types || [];

    renderCards(allCards);
  } catch (error) {
    console.error('Erro ao buscar as cartas:', error);
    document.getElementById('card-grid').innerHTML = '<p style="color: #ef4444; grid-column: 1/-1; text-align: center;">Erro ao carregar os dados das cartas. Verifique o ficheiro JSON.</p>';
  }
}

function renderCards(cardsToRender) {
  const grid = document.getElementById('card-grid');
  grid.innerHTML = ''; 

  if (!cardsToRender || cardsToRender.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #94a3b8;">Nenhuma carta encontrada.</p>';
    return;
  }

  cardsToRender.forEach(card => {
    const cardItem = document.createElement('div');
    cardItem.classList.add('card-item');
    cardItem.style.cursor = 'pointer';

    const cardName = getCardName(card);
    const cardImage = getCardImage(card);
    const cardType = getCardType(card);

    cardItem.innerHTML = `
      <img src="${cardImage}" alt="${cardName}">
      <h3>${cardName}</h3>
      <p>Tipo: ${cardType}</p>
    `;

    cardItem.addEventListener('click', () => {
      openCardModal(card, cardName, cardImage);
    });

    grid.appendChild(cardItem);
  });
}

function openCardModal(card, cardName, cardImage) {
  let statsHtml = '';
  const imageKeys = ['image', 'imageUrl', 'image_url', 'imagem', 'img', 'photo', 'picture', 'card_image'];

  for (const [key, value] of Object.entries(card)) {
    const lowerKey = key.toLowerCase();
    if (typeof value !== 'object' && value !== null && !imageKeys.includes(lowerKey) && key !== 'card_images' && key !== 'cardImages' && key !== 'types') {
      statsHtml += `<p><strong>${key}:</strong> ${value}</p>`;
    }
  }

  // Garante que o tipo correto apareça limpo no modal
  const cardType = getCardType(card);
  statsHtml = `<p><strong>type:</strong> ${cardType}</p>` + statsHtml;

  modalDetails.innerHTML = `
    <div class="modal-body">
      <img src="${cardImage}" alt="${cardName}" style="width: 200px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); border: 1px solid #334155; margin-bottom: 10px;">
      <h2>${cardName}</h2>
      <div class="modal-stats">
        ${statsHtml || '<p>Sem status adicionais.</p>'}
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

const searchInput = document.getElementById('card-search-input');
const searchForm = document.getElementById('search-form');

if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    const filteredCards = allCards.filter(card => {
      const name = getCardName(card).toLowerCase();
      return name.includes(searchTerm);
    });

    renderCards(filteredCards);
  });
}

loadCards();