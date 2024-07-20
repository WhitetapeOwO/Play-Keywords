let keywords = "";
let translationCache = {};

const createButton = () => {
  const button = document.createElement('div');
  button.id = 'playKeywordsButton';
  button.className = 'play-keywords-button';
  button.title = '玩轉 Keywords';
  button.innerHTML = `<img src="${chrome.runtime.getURL("assets/active_btn.png")}" alt="Play Keywords">`;
  return button;
};

const createPopup = () => {
  const popup = document.createElement('div');
  popup.id = 'playKeywordsPopup';
  popup.innerHTML = `
    <div>
      <label for="translateTo">翻譯語言：</label>
      <select id="translateTo"></select>
    </div>  
    <div class="switch-container">
      <label class="switch">
        <input type="checkbox" id="ST_lang">
        <span class="slider"></span>
      </label>
      <label for="ST_lang">搜尋結果語言：</label>
    </div>
    <div>
      <select id="searchLang"></select>
    </div>
    <div class="checkbox-container">
      <button id="applyKeywords">🧐 搜尋</button>
      <button id="resetButton">🔄 重置</button>
    <div>
  `;
  return popup;
};

const initializeLanguageOptions = () => {
  const languages = {
    'en': 'English', 
    'zh-TW': '中文(繁體)', 
    'zh': '中文(简体)',
    'ja': '日本語', 
    'ko': '한국어', 
    'fr': 'Français',
    'de': 'Deutsch', 
    'es': 'Español',
    'vi': 'Tiếng Việt',
    'th': 'ไทย',
    'hi': 'हिन्दी',
    'ms': 'Bahasa Melayu',
    'id': 'Bahasa Indonesia',
    'ar': 'العربية',
    'ru': 'Русский',
    'pt': 'Português'
  };

  const translateSelect = document.getElementById('translateTo');
  const searchLangSelect = document.getElementById('searchLang');
  const stLangCheckbox = document.getElementById('ST_lang');

  if (translateSelect && searchLangSelect) {
    Object.entries(languages).forEach(([code, name]) => {
      translateSelect.add(new Option(name, code));
      searchLangSelect.add(new Option(name, code));
    });

    // Load preferences from local storage
    const savedPreferences = JSON.parse(localStorage.getItem('playKeywordsPreferences') || '{}');
    stLangCheckbox.checked = savedPreferences.stLang || false;
    searchLangSelect.disabled = !stLangCheckbox.checked;
    translateSelect.value = savedPreferences.translateTo || 'en';
    searchLangSelect.value = savedPreferences.searchLang || translateSelect.value;

    stLangCheckbox.addEventListener('change', () => {
      searchLangSelect.disabled = !stLangCheckbox.checked;
      if (stLangCheckbox.checked) searchLangSelect.value = translateSelect.value;
      savePreferences();
    });

    translateSelect.addEventListener('change', () => {
      if (stLangCheckbox.checked) searchLangSelect.value = translateSelect.value;
      savePreferences();
    });

    searchLangSelect.addEventListener('change', savePreferences);
  }
};

const savePreferences = () => {
  const preferences = {
    stLang: document.getElementById('ST_lang').checked,
    translateTo: document.getElementById('translateTo').value,
    searchLang: document.getElementById('searchLang').value
  };
  localStorage.setItem('playKeywordsPreferences', JSON.stringify(preferences));
};

const injectButton = () => {
  const targetElement = document.querySelector('.dRYYxd');
  if (targetElement && !document.getElementById('playKeywordsButton')) {
    const playKeywordsButton = createButton();
    targetElement.appendChild(playKeywordsButton);
    document.body.appendChild(createPopup());

    playKeywordsButton.addEventListener('click', (event) => {
      event.stopPropagation();
      togglePopup(event, playKeywordsButton);
    });

    document.addEventListener('click', (event) => {
      const popup = document.getElementById('playKeywordsPopup');
      if (popup && popup.style.display === 'block' && !popup.contains(event.target)) {
        popup.style.display = 'none';
      }
    });

    document.getElementById('applyKeywords').addEventListener('click', applyKeywords);
    document.getElementById('resetButton').addEventListener('click', resetSearchLanguage);
    
    initializeLanguageOptions();
    initializeButtonEffect();
  }
};

const togglePopup = (event, button) => {
  const popup = document.getElementById('playKeywordsPopup');
  if (popup) {
    const isHidden = popup.style.display === 'none' || popup.style.display === '';
    if (isHidden) {
      if (button && button.getBoundingClientRect) {
        const rect = button.getBoundingClientRect();
        popup.style.top = `${rect.bottom + window.scrollY}px`;
        popup.style.left = `${rect.left + window.scrollX}px`;
      } else {
        popup.style.top = `${event.clientY}px`;
        popup.style.left = `${event.clientX}px`;
      }
    }
    popup.style.display = isHidden ? 'block' : 'none';
  }
};

const applyKeywords = () => {
  const searchInput = document.querySelector('input[name="q"]');
  keywords = searchInput ? searchInput.value.trim() : "";

  if (!keywords) {
    alert("請在 Google 搜尋欄輸入要翻譯的文字");
    return;
  }

  let translateTo = document.getElementById('translateTo').value;
  const stLangCheckbox = document.getElementById('ST_lang');
  const searchLang = stLangCheckbox.checked ? document.getElementById('searchLang').value : null;
  const isTraditionalChinese = translateTo === 'zh-TW';

  if (isTraditionalChinese) translateTo = 'zh';

  // Check cache first
  const cacheKey = `${keywords}_${translateTo}`;
  if (translationCache[cacheKey]) {
    handleTranslation(translationCache[cacheKey], isTraditionalChinese, searchLang);
  } else {
    chrome.runtime.sendMessage({
      type: "TRANSLATE",
      payload: { text: keywords, targetLang: translateTo }
    }, response => {
      if (response.translatedText) {
        // Cache the result
        translationCache[cacheKey] = response.translatedText;
        handleTranslation(response.translatedText, isTraditionalChinese, searchLang);
      } else if (response.error) {
        alert(`翻譯錯誤: ${response.error}`);
      } else {
        alert("翻譯結果為空");
      }
    });
  }

  togglePopup();
};

const handleTranslation = (translatedText, isTraditionalChinese, searchLang) => {
  if (isTraditionalChinese) {
    chrome.runtime.sendMessage({
      type: "CONVERT_TO_TRADITIONAL",
      payload: { text: translatedText }
    }, response => {
      if (response.convertedText) {
        updateSearchInput(response.convertedText, searchLang);
      } else if (response.error) {
        alert(`繁化姬轉換錯誤: ${response.error}`);
      }
    });
  } else {
    updateSearchInput(translatedText, searchLang);
  }
};

const resetSearchLanguage = () => {
  const stLangCheckbox = document.getElementById('ST_lang');
  const searchLangSelect = document.getElementById('searchLang');

  stLangCheckbox.checked = false;
  searchLangSelect.disabled = true;
  searchLangSelect.value = document.getElementById('translateTo').value;

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('lr');
  window.history.replaceState({}, '', currentUrl.toString());

  const resetButton = document.getElementById('resetButton');
  resetButton.textContent = '✔️ 重置';
  setTimeout(() => {
    resetButton.textContent = '🔄 重置';
  }, 1000);

  savePreferences();
};

const updateSearchInput = (text, searchLang) => {
  const searchInput = document.querySelector('input[name="q"]');
  if (searchInput) {
    searchInput.value = text;
    const searchForm = searchInput.closest('form');
    if (searchForm) {
      const stLangCheckbox = document.getElementById('ST_lang');
      const existingLrInput = searchForm.querySelector('input[name="lr"]');
      if (existingLrInput) {
        existingLrInput.remove();
      }
      
      if (stLangCheckbox.checked && searchLang) {
        const hiddenLangInput = document.createElement('input');
        hiddenLangInput.type = 'hidden';
        hiddenLangInput.name = 'lr';
        hiddenLangInput.value = `lang_${searchLang}`;
        searchForm.appendChild(hiddenLangInput);
      }
      searchForm.submit();
    }
  }
};

const initializeButtonEffect = () => {
  const applyKeywords = document.getElementById('applyKeywords');
  if (applyKeywords) {
    applyKeywords.addEventListener('mousemove', (e) => {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      e.target.style.setProperty('--x', `${x}px`);
      e.target.style.setProperty('--y', `${y}px`);
    });
  }
};

// Use MutationObserver for faster button injection
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      const targetElement = document.querySelector('.dRYYxd');
      if (targetElement && !document.getElementById('playKeywordsButton')) {
        injectButton();
        observer.disconnect();
        break;
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Preload some resources
const preloadImage = new Image();
preloadImage.src = chrome.runtime.getURL("assets/active_btn.png");