console.log(`start app.js`);

bridge = window.vkBridge;

let currentOffset = 0; // Текущее смещение
const limit = 5; // Количество ключей на странице

const toastEl = document.getElementById("toast");
const toast = new bootstrap.Toast(toastEl, {
  autohide: true,
  delay: 3000,
});

function showToast(message) {
  document.getElementById("toast-message").textContent = message;
  toast.show();
}

// Обработчик для формы добавления ключа
document.getElementById("add-key-form").addEventListener("submit", (event) => {
  event.preventDefault(); // Предотвращаем отправку формы

  // Получаем данные из формы
  const keyName = document.getElementById("key-name").value;
  const keyValue = document.getElementById("key-value").value;

  if (!keyValue) keyValue = "null";

  if (keyName) {
    console.log("Добавляем новый ключ:", keyName, "со значением:", keyValue);
    bridge
      .send("VKWebAppStorageSet", {
        key: keyName,
        value: keyValue,
      })
      .then((data) => {
        if (data.result) {
          // Значение переменной задано
          showToast("Новый ключ сохранён.");
          displayKeys(currentOffset, limit);
        }
      })
      .catch((error) => {
        showToast("Ошибка добавления ключа.");
        console.log(error);
      });

    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addKeyModal")
    );
    modal.hide();

    // Очищаем форму
    document.getElementById("add-key-form").reset();
  } else {
    showToast('Заполниете поле "Key"');
  }
});

function getKeys(offset, limit) {
  console.log(`getKeys()`);
  return new Promise((resolve, reject) => {
    bridge
      .send("VKWebAppStorageGetKeys", {
        count: limit,
        offset: offset,
      })
      .then((response) => {
        if (response.keys.length > 0) {
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
        if (response.keys.length > 0) {
          const data = response.keys[0]; // нулевой элемент
          if (data.key === key) resolve(data.value); // Возвращаем значение
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
      <h5>Значение по ключу "${key}":</h5>
      <textarea id="key-value-edit" class="form-control mb-2" rows="5">${data}</textarea>
      <button id="save-key-btn" class="btn btn-primary">Сохранить</button>
    `;

    // Обработчик для кнопки "Сохранить"
    document.getElementById("save-key-btn").addEventListener("click", () => {
      const newValue = document.getElementById("key-value-edit").value;
      // Отправляем изменения на сервер
      bridge
        .send("VKWebAppStorageSet", {
          key: key,
          value: newValue,
        })
        .then((response) => {
          console.log("Значение ключа успешно обновлено:", response);

          if (newValue === "") {
            showToast("Ключ успешно удалён.");
            displayKeys(currentOffset, limit);
          } else {
            showToast("Изменения успешно сохранены.");
          }
        })
        .catch((error) => {
          console.error("Ошибка при сохранении изменений:", error);
          showToast("Ошибка сохранения изменений");
        });
    });
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    responseArea.innerHTML =
      '<div class="text-danger">Ошибка при загрузке данных.</div>';
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
