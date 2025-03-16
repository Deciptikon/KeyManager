// Пример функции getKeys
function getKeys(offset, limit) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allKeys = [
        "key1",
        "key2",
        "key3",
        "key4",
        "key5",
        "key6",
        "key7",
        "key8",
        "key9",
        "key10",
      ];
      const keys = allKeys.slice(offset, offset + limit); // Возвращаем ключи с учётом offset и limit
      resolve(keys);
    }, 1000);
  });
}

// Пример функции getData
function getData(key) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Данные для ключа ${key}: Lorem ipsum dolor sit amet.`); // Пример данных
    }, 1000);
  });
}
let currentOffset = 0; // Текущее смещение
const limit = 5; // Количество ключей на странице

// Функция для отображения списка ключей
async function displayKeys(offset, limit) {
  const keyList = document.getElementById("key-list");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  // Показываем загрузку
  keyList.innerHTML = '<div class="text-center">Загрузка...</div>';

  try {
    const keys = await getKeys(offset, limit); // Используем вашу функцию getKeys
    keyList.innerHTML = ""; // Очищаем список перед добавлением новых ключей

    if (keys.length === 0) {
      keyList.innerHTML = '<div class="text-center">Ключи не найдены.</div>';
    } else {
      keys.forEach((key) => {
        const keyItem = document.createElement("button");
        keyItem.className = "list-group-item list-group-item-action key-item";
        keyItem.textContent = key;
        keyItem.addEventListener("click", () => handleKeyClick(key));
        keyList.appendChild(keyItem);
      });
    }

    // Управляем состоянием кнопок
    prevBtn.disabled = offset === 0; // Кнопка "Назад" disabled, если offset = 0
    nextBtn.disabled = keys.length < limit; // Кнопка "Вперёд" disabled, если ключей меньше limit
  } catch (error) {
    console.error("Ошибка при загрузке ключей:", error);
    keyList.innerHTML =
      '<div class="text-danger">Ошибка при загрузке списка ключей.</div>';
  }
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
  await displayKeys(currentOffset, limit);

  // Обработчики для кнопок пагинации
  document.getElementById("prev-btn").addEventListener("click", async () => {
    if (currentOffset >= limit) {
      currentOffset -= limit;
      await displayKeys(currentOffset, limit);
    }
  });

  document.getElementById("next-btn").addEventListener("click", async () => {
    currentOffset += limit;
    await displayKeys(currentOffset, limit);
  });
}

// Запуск приложения
init();
