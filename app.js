bridge = window.vkBridge;
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
        console.log(`response.detail = ${response.detail}`);
        console.log(`response.detail.data = ${response.detail.data}`);
        console.log(`response.detail.data.keys = ${response.detail.data.keys}`);
        if (
          response.detail &&
          response.detail.data &&
          response.detail.data.keys
        ) {
          console.log(
            `response.detail.data.keys = ${response.detail.data.keys}`
          );
          resolve(response.detail.data.keys); // Возвращаем массив ключей
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
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Данные для ключа ${key}: Lorem ipsum dolor sit amet.`); // Пример данных
    }, 1000);
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
    keyList.innerHTML = "";

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

init();
