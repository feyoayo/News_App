// Custom Http Module
function customHttp() {
  return {
    get(url, cb) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.addEventListener("load", () => {
          if (Math.floor(xhr.status / 100) !== 2) {
            cb(`Error. Status code: ${xhr.status}`, xhr);
            return;
          }
          const response = JSON.parse(xhr.responseText);
          cb(null, response);
        });

        xhr.addEventListener("error", () => {
          cb(`Error. Status code: ${xhr.status}`, xhr);
        });

        xhr.send();
      } catch (error) {
        cb(error);
      }
    },
    post(url, body, headers, cb) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.addEventListener("load", () => {
          if (Math.floor(xhr.status / 100) !== 2) {
            cb(`Error. Status code: ${xhr.status}`, xhr);
            return;
          }
          const response = JSON.parse(xhr.responseText);
          cb(null, response);
        });

        xhr.addEventListener("error", () => {
          cb(`Error. Status code: ${xhr.status}`, xhr);
        });

        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        }

        xhr.send(JSON.stringify(body));
      } catch (error) {
        cb(error);
      }
    },
  };
}
// Init http module
const http = customHttp();

const newsService = (function () {
  //!описывается логика взаимодействия с апи
  //Токен ключ
  const apiKey = "e599ef0638f5440e915f8b14890966c3";
  //URL api, откуда будем брать новости
  const apiUrl = "https://news-api-v2.herokuapp.com";
  // const apiUrl = "http://newsapi.org/v2";

  return {
    topHeadlines(country = "ua", category = "general", cb) {
      http.get(
        `${apiUrl}/top-headlines?country=${country}&category=${category}&apiKey=${apiKey}`,
        cb
      );
    },
    everything(query, cb) {
      http.get(`${apiUrl}/everything?q=${query}&apiKey=${apiKey}`, cb);
    },
  };
})();

//Elements
const form = document.forms["newsControls"];
const countrySelect = form.elements["country"];
const searchInput = form.elements["search"];
const categorySelect = form.elements["category"];

form.addEventListener("submit", (e) => {
  e.preventDefault();
  loadNews();
});
categorySelect.addEventListener("change", (e) => {
  loadNews();
  //Сделал так, чтобы при смене категории сразу отрисовывались необходимые для этой категории новости, без необходимости нажатия ентера или кнопки
});
countrySelect.addEventListener("change", (e) => {
  loadNews();
  //Аналогично что и выше
});
//  init selects
document.addEventListener("DOMContentLoaded", function () {
  M.AutoInit();
  loadNews();
});

//Load news function
function loadNews() {
  showLoader();
  //!Делает запрос на указаный адрессат, передает что мы хотим обратиться на ТопХедлайнс, передаем страну ua и коллбек(отрабатывает когда сервер возвращает ответ)
  const country = countrySelect.value;
  const searchText = searchInput.value;
  const category = categorySelect.value;

  //Если нет текста в поле ввода поиска, тогда выводить топХедлайны по выбраной стране. Если есть текст в строке, то выводить по заданому запросу
  if (!searchText) {
    newsService.topHeadlines(country, category, onGetResponse);
  } else {
    newsService.everything(searchText, onGetResponse);
  }
}

//function on get response from server
function onGetResponse(err, res) {
  removePreloader();
  if (err) {
    showAlert(err, "error-msg");
    return;
  }
  if (!res.articles.length) {
    //show empty message
    return;
  }
  //Получает результат и передаем в рендер ньюз
  renderNews(res.articles);
}

//Function render news
function renderNews(news) {
  //!Принимает новости. Определяет контейнер и перебирает наши новости
  //Нам нужен контейнер куда будут грузиться наши новости
  const newsContainer = document.querySelector(".news-container .row");
  if (newsContainer.children.length) {
    clearContainer(newsContainer);
  }
  let fragment = "";

  news.forEach((newsItem) => {
    //в el передается сама разметка и конкатенируется с фрагментом
    const el = newsTemplate(newsItem);
    fragment += el;
  });
  //Вставляем нашу разметку в страницу
  newsContainer.insertAdjacentHTML("afterbegin", fragment);
}

//function clear container
function clearContainer(container) {
  //container.innerHtml = '';
  let child = container.lasElementChild;
  while (child) {
    container.removeChild(child);
    //Чтобы не был бесконечным, нужно на каждой итерации переопределять переменную
    child = container.lasElementChild;
  }
}

//News item template function
function newsTemplate({ urlToImage, title, url, description }) {
  if (!urlToImage) {
    urlToImage.style.background = "red";
  }
  //!На основе одной новости мы формируем разметку и возвращаем ее
  return `
    <div class="col s12">
      <div class="card">
        <div class="card-image">
          <img src="${urlToImage}">
          <span class="card-title">${title || ""}</span>
        </div>
        <div class="card-content">
        <p>${description || ""}</p>
        </div>
        <div class="card-action">
          <a href ="${url}">Read more</a>
        </div>
      </div>
    </div>
  `;
}

function showAlert(msg, type = "success") {
  M.toast({ html: msg, classes: type });
}

//show loader function
function showLoader() {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
      <div class="progress">
        <div class="indeterminate"></div>
      </div>
  `
  );
}

//remove loader function
function removePreloader() {
  const loader = document.querySelector(".progress");
  if (loader) {
    loader.remove();
  }
  //Вызовем в onGetResponse, чтобы скрывать когда мы получим ответ от сервера
}
