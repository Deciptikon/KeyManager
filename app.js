console.log(`start app.js`);
bridge = window.vkBridge;

document.getElementById("add-key-btn").addEventListener("click", () => {
  handleAddKey();
});

let currentOffset = 0; // Текущее смещение
const limit = 5; // Количество ключей на странице

function getKeys(offset, limit) {
  console.log(`getKeys()`);
  return new Promise((resolve, reject) => {
    bridge
      .send("VKWebAppStorageGetKeys", {
        count: limit,
        offset: offset,
      })
      .then((response) => {
        console.log(`response = ${response}`);
        console.log(response);
        console.log(`response.keys = ${response.keys}`);
        if (response.keys.length > 0) {
          console.log(`response.keys = ${response.keys}`);
          resolve(response.keys); // Возвращаем массив ключей
        } else {
          resolve([]); // Если ключей нет, возвращаем пустой массив
        }
      })
      .catch((error) => {
        console.error("Ошибка при получении ключей:", error);
        reject(error); // Пробрасываем ошибку
      });
  });
}

function getData(key) {
  console.log(`getData(key)`);
  return new Promise((resolve, reject) => {
    bridge
      .send("VKWebAppStorageGet", {
        keys: [key], // Передаём массив с одним ключом
      })
      .then((response) => {
        console.log(response);
        if (
          response.detail &&
          response.detail.data &&
          response.detail.data.keys
        ) {
          // Извлекаем значение по ключу
          const value = response.detail.data.keys[0].value;
          resolve(value); // Возвращаем значение
        } else {
          resolve("Данные не найдены"); // Если данные отсутствуют
        }
      })
      .catch((error) => {
        console.error("Ошибка при получении данных:", error);
        reject(error); // Пробрасываем ошибку
      });
  });
}

// Функция для отображения списка ключей
async function displayKeys(offset, limit) {
  const keyList = document.getElementById("key-list");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  // Показываем загрузку
  keyList.innerHTML = '<div class="text-center">Загрузка...</div>';

  try {
    const keys = await getKeys(offset, limit);
    keyList.innerHTML = ""; // Очищаем список перед добавлением новых ключей

    if (keys.length === 0) {
      addKeyItem.addEventListener("click", () => handleAddKey()); // Обработчик клика
      keyList.innerHTML = '<div class="text-center">Ключи не найдены.</div>';
    } else {
      // Отображаем ключи
      keys.forEach((key) => {
        const keyItem = document.createElement("button");
        keyItem.className = "list-group-item list-group-item-action key-item";
        keyItem.textContent = key;
        keyItem.addEventListener("click", () => handleKeyClick(key));
        keyList.appendChild(keyItem);
      });
    }

    // Добавляем элемент "Добавить ключ" (вне зависимости от наличия ключей)

    // Управляем состоянием кнопок
    prevBtn.disabled = offset === 0; // Кнопка "Назад" disabled, если offset = 0
    nextBtn.disabled = keys.length < limit; // Кнопка "Вперёд" disabled, если ключей меньше limit
  } catch (error) {
    console.error("Ошибка при загрузке ключей:", error);
    keyList.innerHTML =
      '<div class="text-danger">Ошибка при загрузке списка ключей.</div>';
  }
}

async function handleKeyClick(key) {
  const responseArea = document.getElementById("response-area");
  responseArea.innerHTML = '<div class="text-center">Загрузка...</div>';

  try {
    const data = await getData(key);
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

function handleAddKey() {
  const newKey = prompt("Введите новый ключ:"); // Простой способ ввода
  if (newKey) {
    console.log("Добавляем новый ключ:", newKey);
    bridge
      .send("VKWebAppStorageSet", {
        key: "example",
        value: "example_value",
      })
      .then((data) => {
        if (data.result) {
          // Значение переменной задано
          displayKeys(currentOffset, limit);
        }
      })
      .catch((error) => {
        // Ошибка
        console.log(error);
      });
  }
}

// Инициализация приложения
async function init() {
  console.log(`function init()`);
  bridge
    .send("VKWebAppGetConfig")
    .then((data) => {
      console.log(`Платформа ${data.app}`);
      //console.log(data.app);
    })
    .catch((error) => {
      console.error(error);
    });

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

init();
