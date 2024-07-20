chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("Message received:", request);

  if (request.type === "TRANSLATE") {
    const { text, targetLang } = request.payload;
    const apiUrl = 'https://api-free.deepl.com/v2/translate';
    const authKey = '916aa16c-5b1f-45fa-be0f-8061849461cc:fx'; // 在此處輸入你的 DeepL API 金鑰

    console.log("Preparing to send request to DeepL API"); // 調試訊息
    console.log("Text:", text, "Target Language:", targetLang);

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${authKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        "text": text,
        "target_lang": targetLang
      })
    })
    .then(response => {
      console.log("Response received:", response);
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    })
    .then(data => {
      console.log("Data received from DeepL API:", data);
      if (data.translations && data.translations.length > 0) {
        sendResponse({ translatedText: data.translations[0].text });
        console.log("Original text sent to DeepL:", text);
      } else {
        sendResponse({ error: "Translation failed" });
      }
    })
    .catch(error => {
      console.error("Translation error:", error);
      if (error.message.includes('403')) {
        sendResponse({ error: "Authentication failed. Please check your API key." });
      } else {
        sendResponse({ error: `Translation failed: ${error.message}` });
      }
    });

    return true;  // 保持消息通道開放以進行異步響應
  }

  // 支語台灣化
  if (request.type === "CONVERT_TO_TRADITIONAL") {
    const { text } = request.payload;
    const apiUrl = 'https://api.zhconvert.org/convert';

    console.log("Preparing to send request to zhconvert API");

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        text: text,
        converter: 'Taiwan',
        outputFormat: 'json'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Data received from zhconvert API:", data);
      if (data.code === 0) {
        sendResponse({ convertedText: data.data.text });
      } else {
        sendResponse({ error: `繁化姬API錯誤: ${data.msg}` });
      }
    })
    .catch(error => {
      console.error("Conversion error:", error);
      sendResponse({ error: `網路錯誤: ${error.message}` });
    });

    return true;  // 保持消息通道開放以進行異步響應
  }
});