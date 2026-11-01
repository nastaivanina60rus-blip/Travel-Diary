
// Дневник путешествий
// Ключи, под которыми данные лежат в браузере
var TRIPS_KEY = "travelTrips";      // localStorage: все поездки
var DRAFT_KEY = "tripDraft";        // sessionStorage: черновик формы
var SELECTED_KEY = "selectedTrip";  // sessionStorage: открытая поездка
// Максимум фото в одной поездке
var MAX_PHOTOS = 8;
// Названия всех текстовых полей формы
var fieldNames = ["country", "city", "startDate", "endDate", "impressions"];

// Здесь лежат все поездки и фото для новой поездки
var trips = [];
var draftPhotos = [];
//  Хранилище 


// Загружаем поездки 
function loadTrips() {
    var text = localStorage.getItem(TRIPS_KEY);
    trips = [];
    if (text) {
        try {
            trips = JSON.parse(text);
        } catch (error) {
            trips = [];
        }
    }
    
    for (var i = 0; i < trips.length; i++) {
        trips[i].country = formatName(trips[i].country);
        trips[i].city = formatName(trips[i].city);
    }
}

// Сохраняем поездки 
// Возвращает true, если получилось, и false, если не хватило места
function saveTrips() {
    try {
        localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
        return true;
    } catch (error) {
        return false;
    }
}

// Сохраняем черновик 
function saveDraft() {
    var draft = {};
    for (var i = 0; i < fieldNames.length; i++) {
        var name = fieldNames[i];
        draft[name] = document.getElementById(name).value;
    }
    draft.photos = draftPhotos;
    try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
        // если места нет, просто не сохраняем черновик
    }
}

// Достаём черновик формы из sessionStorage
function loadDraft() {
    var text = sessionStorage.getItem(DRAFT_KEY);
    if (!text) {
        return;
    }
    var draft = JSON.parse(text);
    for (var i = 0; i < fieldNames.length; i++) {
        var name = fieldNames[i];
        document.getElementById(name).value = draft[name] || "";
    }
    draftPhotos = draft.photos || [];
}


// Вспомогательные функции

// Делает первые буквы заглавными: "нью-йорк" -> "Нью-Йорк"
function formatName(text) {
    text = text.trim().toLowerCase();
    var result = "";
    var bigLetter = true; // следующая буква должна быть заглавной
    for (var i = 0; i < text.length; i++) {
        var letter = text.charAt(i);
        if (bigLetter) {
            result = result + letter.toUpperCase();
        } else {
            result = result + letter;
        }
        bigLetter = (letter === " " || letter === "-");
    }
    return result;
}


function plural(number, one, few, many) {
    var last = number % 10;
    var lastTwo = number % 100;
    if (lastTwo >= 11 && lastTwo <= 14) {
        return many;
    }
    if (last === 1) {
        return one;
    }
    if (last >= 2 && last <= 4) {
        return few;
    }
    return many;
}

function daysWord(number) {
    return plural(number, "день", "дня", "дней");
}



// Даты


// Превращает текст "28-12-2019" в дату. Если дата неверная, вернёт null
function parseDate(text) {
    var parts = text.trim().split("-");
    if (parts.length !== 3) {
        return null;
    }
    if (parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
        return null;
    }

    var day = Number(parts[0]);
    var month = Number(parts[1]);
    var year = Number(parts[2]);

    var date = new Date(year, month - 1, day);

    // Проверяем, что такая дата существует 
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
}

// Считает, сколько дней длилась поездка (первый и последний день входят)
function getDuration(startText, endText) {
    var start = parseDate(startText);
    var end = parseDate(endText);
    if (start === null || end === null || start > end) {
        return null;
    }
    var oneDay = 1000 * 60 * 60 * 24;
    return Math.round((end - start) / oneDay) + 1;
}


// Проверка 


function showError(name, message) {
    var input = document.getElementById(name);
    document.getElementById(name + "Error").textContent = message;

    input.classList.remove("invalid");
    input.classList.remove("valid");

    if (message !== "") {
        input.classList.add("invalid");
    } else if (input.value.trim() !== "") {
        input.classList.add("valid");
    }
}

// Проверяет одно поле. Возвращает true, если всё хорошо
function validateField(name) {
    var value = document.getElementById(name).value.trim();
    var error = "";

    if (name === "country" || name === "city") {
        // Только буквы (русские и английские), пробел и дефис, от 2 до 50 символов
        var letters = /^[A-Za-zА-Яа-яЁё\s-]{2,50}$/;
        if (value === "") {
            error = "Поле обязательно для заполнения";
        } else if (!letters.test(value)) {
            error = "Только буквы, от 2 до 50 символов";
        }
    }

    if (name === "startDate" || name === "endDate") {
        if (value === "") {
            error = "Укажи дату в формате ДД-ММ-ГГГГ";
        } else if (parseDate(value) === null) {
            error = "Неверная дата. Формат: ДД-ММ-ГГГГ";
        } else if (name === "endDate") {
            var start = parseDate(document.getElementById("startDate").value);
            if (start !== null && start > parseDate(value)) {
                error = "Дата начала не может быть позже даты окончания";
            }
        }
    }

    if (name === "impressions") {
        if (value.length < 10 || value.length > 1000) {
            error = "Впечатления: от 10 до 1000 символов";
        }
    }

    showError(name, error);
    return error === "";
}

// Показывает длительность поездки под полями дат
function updateDuration() {
    var start = document.getElementById("startDate").value;
    var end = document.getElementById("endDate").value;
    var days = getDuration(start, end);
    var box = document.getElementById("durationPreview");

    if (days === null) {
        box.textContent = "";
    } else {
        box.textContent = "Длительность поездки: " + days + " " + daysWord(days);
    }
}


// Фотографии 


function renderPhotoList() {
    var list = document.getElementById("photoList");
    list.innerHTML = "";

    for (var i = 0; i < draftPhotos.length; i++) {
        var item = document.createElement("li");
        var text = document.createElement("span");

        if (draftPhotos[i].indexOf("data:") === 0) {
            // Это файл 
            var thumb = document.createElement("img");
            thumb.src = draftPhotos[i];
            text.appendChild(thumb);
            text.appendChild(document.createTextNode(" Файл " + (i + 1)));
        } else {
            // Это ссылка
            text.textContent = draftPhotos[i];
        }

        var removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.setAttribute("data-index", i);
        removeButton.addEventListener("click", removePhoto);

        item.appendChild(text);
        item.appendChild(removeButton);
        list.appendChild(item);
    }
}

// Удаляет фото из списка по нажатию на крестик
function removePhoto(event) {
    var index = Number(event.target.getAttribute("data-index"));
    draftPhotos.splice(index, 1);
    renderPhotoList();
    saveDraft();
}

// Если ввели путь вида /Users/... , добавляем file://
function fixLink(link) {
    link = link.trim();
    if (link.charAt(0) === "/") {
        link = "file://" + link;
    }
    return link;
}

// Проверяет, что это ссылка http://, https:// или file:///
function isGoodLink(link) {
    try {
        var url = new URL(link);
        return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "file:";
    } catch (error) {
        return false;
    }
}

// Кнопка «добавить ссылку»
function addPhotoByLink() {
    var input = document.getElementById("photoUrl");
    var error = document.getElementById("photoError");
    var link = fixLink(input.value);

    if (!isGoodLink(link)) {
        error.textContent = "Введи ссылку, начинающуюся с http://, https:// или file:///";
        return;
    }
    if (draftPhotos.length >= MAX_PHOTOS) {
        error.textContent = "Можно добавить не больше " + MAX_PHOTOS + " фото";
        return;
    }

    error.textContent = "";
    draftPhotos.push(link);
    input.value = "";
    renderPhotoList();
    saveDraft();
}

// Читает фото и уменьшает его
function readPhotoFile(file) {
    var reader = new FileReader();

    reader.onload = function () {
        var image = new Image();

        image.onload = function () {
            // Уменьшаем большую сторону до 900 пикселей
            var biggestSide = Math.max(image.width, image.height);
            var scale = 1;
            if (biggestSide > 900) {
                scale = 900 / biggestSide;
            }

            var canvas = document.createElement("canvas");
            canvas.width = Math.round(image.width * scale);
            canvas.height = Math.round(image.height * scale);
            canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

            // Превращаем картинку в текст и добавляем в список
            draftPhotos.push(canvas.toDataURL("image/jpeg", 0.7));
            renderPhotoList();
            saveDraft();
        };

        image.src = reader.result;
    };

    reader.readAsDataURL(file);
}

// Когда пользователь выбрал файлы 
function addPhotosFromFiles(event) {
    var files = event.target.files;
    var error = document.getElementById("photoError");
    error.textContent = "";

    var added = 0;
    for (var i = 0; i < files.length; i++) {
        if (files[i].type.indexOf("image/") !== 0) {
            error.textContent = "«" + files[i].name + "» не является изображением";
            continue;
        }
        if (draftPhotos.length + added >= MAX_PHOTOS) {
            error.textContent = "Можно добавить не больше " + MAX_PHOTOS + " фото";
            break;
        }
        readPhotoFile(files[i]);
        added = added + 1;
    }

    // Очищаем выбор, чтобы можно было выбрать тот же файл ещё раз
    event.target.value = "";
}


//  Очистка и отправка формы


function clearForm() {
    document.getElementById("tripForm").reset();
    draftPhotos = [];

    for (var i = 0; i < fieldNames.length; i++) {
        showError(fieldNames[i], "");
    }
    document.getElementById("photoError").textContent = "";

    renderPhotoList();
    updateDuration();
    sessionStorage.removeItem(DRAFT_KEY);
}

function submitForm(event) {
    event.preventDefault(); // чтобы страница не перезагружалась

    // Проверяем все поля
    var allGood = true;
    for (var i = 0; i < fieldNames.length; i++) {
        if (!validateField(fieldNames[i])) {
            allGood = false;
        }
    }
    if (!allGood) {
        return;
    }

    // Создаём новую поездку
    var trip = {
        id: Date.now(),
        country: formatName(document.getElementById("country").value),
        city: formatName(document.getElementById("city").value),
        startDate: document.getElementById("startDate").value.trim(),
        endDate: document.getElementById("endDate").value.trim(),
        photos: draftPhotos,
        impressions: document.getElementById("impressions").value.trim()
    };

    trips.push(trip);

    if (!saveTrips()) {
        trips.pop();
        document.getElementById("photoError").textContent =
            "Не хватило места в браузере: уберите часть фото или используйте ссылки";
        return;
    }

    clearForm();
    renderAll();
    showView("listView");
}


// ============================================
// 7. Карточки поездок
// ============================================

// Создаёт одну карточку (ячейку таблицы) для поездки
function createTripCard(trip) {
    var card = document.createElement("article");
    card.className = "trip-card";
    if (String(trip.id) === sessionStorage.getItem(SELECTED_KEY)) {
        card.classList.add("selected");
    }

    // Даты
    var date = document.createElement("p");
    date.className = "trip-date";
    date.textContent = trip.startDate + " — " + trip.endDate;

    // Фото (или первая буква города, если фото нет)
    var photo = document.createElement("div");
    photo.className = "trip-photo";
    if (trip.photos.length > 0) {
        var image = document.createElement("img");
        image.src = trip.photos[0];
        image.alt = trip.city;
        // Если картинка не загрузилась, показываем букву
        image.onerror = function () {
            photo.textContent = trip.city.charAt(0);
        };
        photo.appendChild(image);
    } else {
        photo.textContent = trip.city.charAt(0);
    }

    // Город, страна и длительность
    var title = document.createElement("h3");
    title.textContent = trip.city;

    var country = document.createElement("p");
    country.className = "trip-country";
    country.textContent = trip.country;

    var days = getDuration(trip.startDate, trip.endDate);
    var length = document.createElement("p");
    length.className = "trip-days";
    length.textContent = days + " " + daysWord(days);

    card.appendChild(date);
    card.appendChild(photo);
    card.appendChild(title);
    card.appendChild(country);
    card.appendChild(length);

    // По клику открываем подробности
    card.addEventListener("click", function () {
        showDetail(trip.id);
    });

    return card;
}

// Рисует все карточки
function renderList() {
    var list = document.getElementById("tripList");
    list.innerHTML = "";

    for (var i = 0; i < trips.length; i++) {
        list.appendChild(createTripCard(trips[i]));
    }

    // Если поездок нет, показываем надпись
    document.getElementById("emptyText").hidden = trips.length > 0;
}



// Ищет поездку по номеру
function findTrip(id) {
    for (var i = 0; i < trips.length; i++) {
        if (trips[i].id === id) {
            return trips[i];
        }
    }
    return null;
}

function showDetail(id) {
    var trip = findTrip(id);
    if (trip === null) {
        hideDetail();
        return;
    }
    sessionStorage.setItem(SELECTED_KEY, String(id));

    var days = getDuration(trip.startDate, trip.endDate);

    // Заголовок и текст
    document.getElementById("detailTitle").textContent = trip.city;
    document.getElementById("detailMeta").textContent =
        trip.country + " · " + trip.startDate + " — " + trip.endDate;
    document.getElementById("detailDays").textContent = days + " " + daysWord(days);
    document.getElementById("detailText").textContent = trip.impressions;

    // Большое фото справа
    var cover = document.getElementById("detailCover");
    cover.innerHTML = "";
    if (trip.photos.length > 0) {
        var coverImage = document.createElement("img");
        coverImage.src = trip.photos[0];
        coverImage.alt = trip.city;
        cover.appendChild(coverImage);
    } else {
        cover.textContent = trip.city.charAt(0);
    }

    // Галерея
    var gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    if (trip.photos.length === 0) {
        gallery.textContent = "Фотографии не добавлены";
    }
    for (var i = 0; i < trip.photos.length; i++) {
        var picture = document.createElement("img");
        picture.src = trip.photos[i];
        picture.alt = "Фото: " + trip.city;
        gallery.appendChild(picture);
    }

    // Карта (Google Maps ищет место по названию)
    var place = encodeURIComponent(trip.city + ", " + trip.country);
    document.getElementById("map").src = "https://maps.google.com/maps?q=" + place + "&output=embed";

    document.getElementById("detail").hidden = false;
    renderList();
    document.getElementById("detail").scrollIntoView({ behavior: "smooth" });
}

function hideDetail() {
    sessionStorage.removeItem(SELECTED_KEY);
    document.getElementById("detail").hidden = true;
    document.getElementById("map").removeAttribute("src");
    renderList();
}

function deleteTrip() {
    var id = Number(sessionStorage.getItem(SELECTED_KEY));
    if (!confirm("Удалить эту поездку?")) {
        return;
    }

    // Собираем новый список без удалённой поездки
    var newTrips = [];
    for (var i = 0; i < trips.length; i++) {
        if (trips[i].id !== id) {
            newTrips.push(trips[i]);
        }
    }
    trips = newTrips;

    saveTrips();
    hideDetail();
    renderAll();
}

// Проверяет, есть ли текст в списке (без учёта больших и маленьких букв)
function hasInList(list, text) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].toLowerCase() === text.toLowerCase()) {
            return true;
        }
    }
    return false;
}


function fillList(id, items) {
    var ul = document.getElementById(id);
    ul.innerHTML = "";

    if (items.length === 0) {
        ul.textContent = "Пока пусто";
        return;
    }

    items.sort();
    for (var i = 0; i < items.length; i++) {
        var li = document.createElement("li");
        li.textContent = items[i];
        ul.appendChild(li);
    }
}

function renderStats() {
    var countries = []; // уникальные страны
    var cities = [];    // уникальные города
    var totalDays = 0;

    for (var i = 0; i < trips.length; i++) {
        var trip = trips[i];

        if (!hasInList(countries, trip.country)) {
            countries.push(trip.country);
        }

        var cityName = trip.city + " (" + trip.country + ")";
        if (!hasInList(cities, cityName)) {
            cities.push(cityName);
        }

        totalDays = totalDays + getDuration(trip.startDate, trip.endDate);
    }

    // Большие плитки
    document.getElementById("statTrips").textContent = trips.length;
    document.getElementById("statCountries").textContent = countries.length;
    document.getElementById("statCities").textContent = cities.length;
    document.getElementById("statDays").textContent = totalDays;

    // Строка со сводкой на главной странице
    document.getElementById("summary").textContent =
        trips.length + " " + plural(trips.length, "поездка", "поездки", "поездок") + " · " +
        countries.length + " " + plural(countries.length, "страна", "страны", "стран") + " · " +
        cities.length + " " + plural(cities.length, "город", "города", "городов") + " · " +
        totalDays + " " + daysWord(totalDays) + " в пути";

    // Списки
    fillList("countryList", countries);
    fillList("cityList", cities);
}



// Переключение разделов


function showView(id) {
    
    var views = document.querySelectorAll(".view");
    for (var i = 0; i < views.length; i++) {
        if (views[i].id === id) {
            views[i].classList.add("active");
        } else {
            views[i].classList.remove("active");
        }
    }

    //  кнопка меню
    var buttons = document.querySelectorAll(".nav-btn");
    for (var j = 0; j < buttons.length; j++) {
        if (buttons[j].getAttribute("data-view") === id) {
            buttons[j].classList.add("active");
        } else {
            buttons[j].classList.remove("active");
        }
    }
}

function renderAll() {
    renderList();
    renderStats();
}


// Проверка полей при вводе текста
for (var i = 0; i < fieldNames.length; i++) {
    document.getElementById(fieldNames[i]).addEventListener("input", function (event) {
        validateField(event.target.id);

        // Если поменяли дату начала, заново проверяем дату окончания
        if (event.target.id === "startDate" && document.getElementById("endDate").value !== "") {
            validateField("endDate");
        }
        updateDuration();
        saveDraft();
    });
}

// Все кнопки с атрибутом data-view переключают раздел
var viewButtons = document.querySelectorAll("[data-view]");
for (var j = 0; j < viewButtons.length; j++) {
    viewButtons[j].addEventListener("click", function (event) {
        showView(event.target.getAttribute("data-view"));
    });
}

document.getElementById("tripForm").addEventListener("submit", submitForm);
document.getElementById("resetForm").addEventListener("click", clearForm);
document.getElementById("addPhoto").addEventListener("click", addPhotoByLink);
document.getElementById("closeDetail").addEventListener("click", hideDetail);
document.getElementById("deleteTrip").addEventListener("click", deleteTrip);

// Кнопка «с компьютера» открывает выбор файлов
document.getElementById("pickFiles").addEventListener("click", function () {
    document.getElementById("photoFile").click();
});
document.getElementById("photoFile").addEventListener("change", addPhotosFromFiles);

// Enter в поле ссылки добавляет фото
document.getElementById("photoUrl").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addPhotoByLink();
    }
});

// Запуск страницы


loadTrips();
loadDraft();
renderPhotoList();

// Если в черновике уже есть текст, сразу проверяем поля
for (var k = 0; k < fieldNames.length; k++) {
    if (document.getElementById(fieldNames[k]).value.trim() !== "") {
        validateField(fieldNames[k]);
    }
}
updateDuration();
renderAll();

// Если до перезагрузки была открыта поездка, открываем её снова
var selectedId = Number(sessionStorage.getItem(SELECTED_KEY));
if (selectedId) {
    showDetail(selectedId);
}
