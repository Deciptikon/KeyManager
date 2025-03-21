bridge = window.vkBridge;

const pageNumberInput = document.getElementById("page-number-input");
const responseArea = document.getElementById("response-area");

const limitKeys = 5; // Количество ключей на странице
let pageNumber = parseInt(pageNumberInput.value, 10); // текущий номер страницы
let currentOffset = pageNumber * limitKeys; // Текущее смещение
let keyToDelete = null;

const KEY_SAVE_AGREE = "KeyManagerIAgree";
let iAgree = false;

const toastEl = document.getElementById("toast");
const toast = new bootstrap.Toast(toastEl, {
  autohide: true,
  delay: 3000,
});

function showToast(message) {
  document.getElementById("toast-message").textContent = message;
  toast.show();
}

document.addEventListener("DOMContentLoaded", function () {
  init();
});

// Обработчик для формы добавления ключа
document.getElementById("add-key-form").addEventListener("submit", (event) => {
  event.preventDefault(); // Предотвращаем отправку формы
  responseArea.innerHTML = "";

  // Получаем данные из формы
  const keyName = document.getElementById("key-name").value;
  const keyValue = document.getElementById("key-value").value;

  if (!keyValue) keyValue = "null";

  if (keyName) {
    //console.log("Добавляем новый ключ:", keyName, "со значением:", keyValue);
    bridge
      .send("VKWebAppStorageSet", {
        key: keyName,
        value: keyValue,
      })
      .then((data) => {
        if (data.result) {
          showToast("Новый ключ сохранён.");
          displayKeys(currentOffset, limitKeys);
        }
      })
      .catch((error) => {
        showToast("Ошибка добавления ключа.");
        console.error("Ошибка добавления ключа:", error);
      });

    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addKeyModal")
    );
    modal.hide();

    // Очищаем форму
    document.getElementById("add-key-form").reset();
  } else {
    showToast('Поле "Key" не заполнено.');
  }
});

document.getElementById("srch-key-form").addEventListener("submit", (event) => {
  event.preventDefault(); // Предотвращаем отправку формы

  const keyName = document.getElementById("srch-key-name").value; // Получаем значение из поля ввода

  if (keyName) {
    responseArea.innerHTML = "";

    // Выполняем поиск ключа
    handleKeyClick(keyName);

    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("srchKeyModal")
    );
    modal.hide();
  } else {
    showToast('Поле "Key" не заполнено.');
  }
});

function getKeys(offset, limit) {
  //console.log(`getKeys()`);
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
  //console.log(`getData(key)`);
  return new Promise((resolve, reject) => {
    bridge
      .send("VKWebAppStorageGet", {
        keys: [key], // Передаём массив с одним ключом
      })
      .then((response) => {
        if (response.keys.length > 0) {
          const data = response.keys[0]; // нулевой элемент (потому что ключ всего один)
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

document.getElementById("confirm-delete-btn").addEventListener("click", () => {
  if (keyToDelete) {
    // Отправляем запрос на удаление ключа
    handleDeleteKey(keyToDelete);

    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("deleteConfirmModal")
    );
    modal.hide();
  }
});

// открытие модального окна подтверждения удаления
function openDeleteModal(key) {
  keyToDelete = key; // Сохраняем ключ для удаления
  const modal = new bootstrap.Modal(
    document.getElementById("deleteConfirmModal")
  );
  modal.show();
}

// Функция для отображения списка ключей
async function displayKeys(offset, limit) {
  const keyList = document.getElementById("key-list");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  responseArea.innerHTML = "";
  pageNumberInput.value = pageNumber;

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
        const keyItem = document.createElement("div");
        keyItem.className =
          "list-group-item list-group-item-action key-item d-flex justify-content-between align-items-center";
        keyItem.style.cursor = "pointer";
        keyItem.addEventListener("click", () => handleKeyClick(key));

        // Текст ключа
        const keyText = document.createElement("span");
        keyText.textContent = key;

        // Кнопка удаления
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>'; // Иконка мусорного ведра
        deleteButton.addEventListener("click", (event) => {
          event.stopPropagation(); // Предотвращаем всплытие события
          openDeleteModal(key); // Обработчик удаления ключа
        });

        // Добавляем текст и кнопку в элемент списка
        keyItem.appendChild(keyText);
        keyItem.appendChild(deleteButton);

        // Добавляем элемент в список
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
  responseArea.innerHTML = '<div class="text-center">Загрузка...</div>';

  try {
    const data = await getData(key);
    responseArea.innerHTML = `
      <h5>Значение по ключу "${key}":</h5>
      <textarea id="key-value-edit" class="form-control mb-2" rows="3">${data}</textarea>
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
          if (newValue === "") {
            showToast("Ключ успешно удалён.");
          } else {
            showToast("Изменения успешно сохранены.");
          }
          responseArea.innerHTML = "";
          displayKeys(currentOffset, limitKeys);
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

function handleDeleteKey(key) {
  // Отправляем запрос на удаление ключа
  bridge
    .send("VKWebAppStorageSet", {
      key: key,
      value: "",
    })
    .then((response) => {
      showToast("Ключ успешно удалён.");
      responseArea.innerHTML = "";
      keyToDelete = null;
      displayKeys(currentOffset, limitKeys);
    })
    .catch((error) => {
      showToast("Ошибка удаления ключа.");
      console.error("Ошибка при сохранении изменений:", error);
    });
}

// Инициализация приложения
async function init() {
  // реклама
  bridge
    .send("VKWebAppShowBannerAd", {
      banner_location: "bottom",
    })
    .then((data) => {
      if (data.result) {
        // Баннерная реклама отобразилась
        console.log("Баннерная реклама отобразилась");
      }
    })
    .catch((error) => {
      // Ошибка
      console.log(error);
    });

  // Предупреждение
  bridge
    .send("VKWebAppStorageGet", {
      keys: [KEY_SAVE_AGREE], // Передаём массив с одним ключом
    })
    .then((response) => {
      if (response.keys.length > 0) {
        const data = response.keys[0]; // нулевой элемент (потому что ключ всего один)
        if (data.key === KEY_SAVE_AGREE && data.value === "true") {
          iAgree = true;
        }
      }

      if (!iAgree) {
        let modalElement = document.getElementById("infoKeyModal");

        let infoModal = new bootstrap.Modal(modalElement, {
          keyboard: false,
        });
        infoModal.show();

        modalElement.addEventListener("hidden.bs.modal", function () {
          let nbtt = document.getElementById("next-btn");
          if (nbtt) {
            nbtt.focus();
          }

          bridge
            .send("VKWebAppStorageSet", {
              key: KEY_SAVE_AGREE,
              value: "true",
            })
            .then((response) => {
              displayKeys(currentOffset, limitKeys);
            })
            .catch((error) => {
              console.error("Ошибка при сохранении изменений:", error);
            });
        });
      }
    })
    .catch((error) => {
      console.error("Ошибка при получении данных:", error);
    });

  bridge
    .send("VKWebAppGetConfig")
    .then((data) => {
      console.log(`Платформа ${data.app}`);
      //console.log(data.app);
    })
    .catch((error) => {
      console.error(error);
    });

  responseArea.innerHTML = "";
  await displayKeys(currentOffset, limitKeys);

  // Обработчики для кнопок пагинации
  document.getElementById("prev-btn").addEventListener("click", async () => {
    let v = pageNumberInput.value;
    if (v === "" || v === null) v = 0;
    pageNumber = parseInt(v, 10);
    if (pageNumber > 0) {
      pageNumber--;
      currentOffset = pageNumber * limitKeys;

      await displayKeys(currentOffset, limitKeys);
    }
  });

  document.getElementById("go-to-btn").addEventListener("click", async () => {
    let v = pageNumberInput.value;
    if (v === "" || v === null) v = 0;
    const newPageNumber = parseInt(v, 10);

    if (!isNaN(newPageNumber) && newPageNumber >= 0) {
      pageNumber = newPageNumber;
      currentOffset = pageNumber * limitKeys;

      await displayKeys(currentOffset, limitKeys);
    } else {
      showToast("Не корректный номер страницы.");
    }
  });

  document.getElementById("next-btn").addEventListener("click", async () => {
    let v = pageNumberInput.value;
    if (v === "" || v === null) v = 0;
    pageNumber = parseInt(v, 10) + 1;
    currentOffset = pageNumber * limitKeys;

    await displayKeys(currentOffset, limitKeys);
  });
}
