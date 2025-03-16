// Функция для отображения списка ключей
function displayKeys(keys) {
  const keyList = document.getElementById("key-list");
  keyList.innerHTML = ""; // Очищаем список перед добавлением новых ключей

  keys.forEach((key) => {
    const keyItem = document.createElement("button");
    keyItem.className = "list-group-item list-group-item-action key-item";
    keyItem.textContent = key;
    keyItem.addEventListener("click", () => handleKeyClick(key));
    keyList.appendChild(keyItem);
  });
}

// Обработчик клика по ключу
async function handleKeyClick(key) {
  const responseArea = document.getElementById("response-area");
  responseArea.innerHTML = '<div class="text-center">Загрузка...</div>';

  try {
    const data = await getData(key); // Используем вашу функцию getData
    responseArea.innerHTML = `
            <h5>Ответ для ключа "${key}":</h5>
            <p>${data}</p>
        `;
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    responseArea.innerHTML =
      '<div class="text-danger">Ошибка при загрузке данных.</div>';
  }
}

// Инициализация приложения
async function init() {
  try {
    const keys = await getKeys(); // Используем вашу функцию getKeys
    displayKeys(keys);
  } catch (error) {
    console.error("Ошибка при загрузке списка ключей:", error);
    const keyList = document.getElementById("key-list");
    keyList.innerHTML =
      '<div class="text-danger">Ошибка при загрузке списка ключей.</div>';
  }
}

// Запуск приложения
init();
