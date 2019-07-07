## Templating 설계

## 1. template literal 활용과 함수로직 분리 

###  1-1기획 

- react 에서 component 처럼 분리해 보면 어떨까?

![image-20190703150551373](assets/image-20190703150551373.png)

- carouselHeader, carouselMain, carousel(index) 로 나누고, carousel이 header와 main template를 포함한다
- carousel(index)
  - carouselHead
  - carouselMain
- 실제 데이터를 받아 templating을 작동할 때는 carousel 만 이용하자.
- 각 컴포넌트는 데이터를 받아 template에 데이터를 주입시켜서 완성된 html 텍스트를 반환하는 함수가 되야 한다.

### 1-2 Sudo code

#### 1-2-1  컴포넌트 

```js
// carouselHeader 
const carouselHeader = data => 
`
  <ul class="carousel__header">
    ${data} //
  </ul>
`
export default carouselHeader;

------------------------------------------------------

// carouselMain
const carouselMain = data => 
`
  <div class="carousel__main">
    ${data} //
  </div>
`
------------------------------------------------------

// carousel
import carouselHeader from './carouselHeader.js';
import carouselMain from './carouselMain.js';

const carousel = data =>
  `
  <div class="carousel">
    ${carouselHeader(data)}
    ${carouselMain(data)}
  </div>
`;

export default carousel;

```

#### 1-2-2 템플릿을 만드는 함수

```js
const makeDataToHtml = (data, templateFunc) => templateFunc(data);
```

## 2. 데이터 캐쉬

### 2-1 기획 

- [localstorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)를 이용하자
- 먼저 localStorage 를 조회하여 data가 있는지 점검하자 
- 없다면 fetch를 통해 데이터를 끌어다 쓰자(여기서 분기를 줄때 catch 메소드를 쓰면되겠다)
  - 다시 생각해보니 catch 는 오류를 잡을 때 쓰는거라, 분기를 줄때 써도 되는건지 의심스럽다. 
- fetch를 하고나서 localstroage에 다시 저장해두자 
- 업데이트나 변화가 있으면 새로 받아와야 하니까 버전정보도 함께 저장하자, 나중에 cache 유무 점검시 버젼 정보를 확인해 cache 에 저장된 버젼과 current 버젼이 다르면 데이터를 새로 업데이트 하도록 하자.   
- [Frontend caching strategies](https://medium.com/@brockreece/frontend-caching-strategies-38c57f59e254) 참고

### 2-2 sudo

```js
const currentVersion = 1
let data = localStorage.getItem('data')
let version = localStorage.getItem('version')
const URL = 'http://127.0.0.1:5500/data.json';
if (!version || version < currentVersion) {
  fetch(carouselURL).then((response) => {
    data = response;
    localStorage.setItem('data', data)
    localStorage.setItem('version', currentVersion)
  })
}
```

### 2-3 반영하며 어려웠던 점 

- `data = localstorage.getItem('data')` 는 동기적으로 작동하며 값을 리턴한다. 
- `fetch(carouselURL)` 은  비동기로 작동하며  프로미스를 리턴한다. 
- 동기로직은 바로 데이터를 받아 처리하면 되지만, 비동기 로직은 반환된 프로미스 값에 `.then` 메소드 체인을 통해 처리해야 한다. 그렇다보니 화면을 그리는 코드(`makeDataToHtml(data, carouselTemplate)`) 와 carousel 객체 생성 코드가 분기별(if, else)로 중복된다. 한쪽은 동기적 처리, 한쪽은 프로미스 패턴으로 처리해야 하기 때문이다. 

```js
window.addEventListener('DOMContentLoaded', () => {
 const URL = 'http://127.0.0.1:5500/data.json';
 const version = localStorage.getItem('version')
 const currentVersion = 1
  if (!version || version < currentVersion) {
    // 비동기 로직
    fetch(url)
      .then(response => response.json())
      .then(data => {
      localStorage.setItem('data', JSON.stringify(data));
      localStorage.setItem('version', currentVersion);
      return data;})
      .then(parsedData => {
      makeDataToHtml(parseddata, carosuelTemplate)}) // 중복
      .then(_ => new Carousel()) // 중복 
      .then(carousel => carousel.init()); // 중복
  } else {
    // 동기 로직
      const data =  JSON.parse(localStorage.getItem('data'));
      makeDataToHtml(data, carosuelTemplate); // 중복
      const carousel = new Carousel(); // 중복
      carousel.init(); // 중복 
  }

}  
```

### 2-4 해결방법: 모두 Promise를 반환하여 chaining을 하자

- Async, await 을 통해  html 렌더링 이후 `new Carousel()` 이 실행되도록 하자 

```js
// renderHTML
const getCarouselData = async (currentVersion, url) => {
  const version = localStorage.getItem('version');
  if (!version || version < currentVersion) {
    return await fetch(url)
      .then(response => response.json())
      .then(data => {
        localStorage.setItem('data', JSON.stringify(data));
        localStorage.setItem('version', currentVersion);
        return data;
      });
  } else {
    return await Promise.resolve(localStorage.getItem('data')).then(response =>
      JSON.parse(response),
    );
  }
};

const renderHTML = ({ currentVersion, url, templateFunc }) => {
  const body = document.querySelector('body');
  const data = getCarouselData(currentVersion, url);
  return data.then(parsedData => {
    body.insertAdjacentHTML('afterbegin', templateFunc(parsedData));
  });
};

export default renderHTML;
-------------------------------------------------------------------------
// app.js 
window.addEventListener('DOMContentLoaded', () => {
  renderHTML({
    currentVersion: 1,
    url: 'http://127.0.0.1:5500/data.json',
    templateFunc: carouselTemplate,
  }).then(_ => {
    const carousel = new Carousel(config);
    carousel.init();
  });
});

```

## 3. 앱 실행시킬 때 초기화는 어떻게 하는게 좋을까?

### 3-1 기획 

- 데이터를 받아와서 렌더링하기 전까지 carousel 인스턴스가 초기화되면 안된다. 렌더링 이후로 init의 순서가 보장되어야 한다. 
- 렌더링(templating)과 carousel(조작)객체는 무관해야 하니까 분리해야 한다.
- app.js 는 entry point 이므로 복잡도를 높이지 말자. 렌더링과 관련된 로직을 따로 분리하여 캐시 전략의 의도를 분명히 할 수도 있다.

### 3-2 Real

```js
// app.js 
window.addEventListener('DOMContentLoaded', () => {
  renderHTML({
    currentVersion: 1,
    url: 'http://127.0.0.1:5500/data.json',
    templateFunc: carouselTemplate,
  }).then(_ => {
    const carousel = new Carousel(config);
    carousel.init();
  });
});
```



## 4. Carousel 리펙토링 

### 4-1 책임과 역할 파악해보기(+개선요소 파악)

#### 4-1-1 책임과 역할 파악 

### ![image-20190705085151258](assets/image-20190705085151258.png)

- 현재 상단에 표기된 `nav`, `pagenation` 은 현재 carousel 객체(view + model 짬뽕) 내부에 몽땅 들어있다.
- nav, pagenation 을 각각의 view 로 분리해서 그려봤다.
- 현재는 view가 화면을 그리는 일 이외에 상태를 관리하는 일까지 모두 한다. 이럴 경우 변경이 필요한 순간 모든 코드를 다 고쳐야 하며 그것은 끔찍한 일이다. 
- 상태관리는 별도의 객체(model) 가 하도록 하고, 각 view 들은 그리는 일만 담당하도록 바꿔야 한다. 
- 기존 MV* 모델과 다른 특이한 점은 각 view가 독립적이지 않고, 상태변경에 따라 같이 변한다는 점이다. 
  - nav의 변경이 pagenation의 변경을 유발한다.
  - pagenation의 변경이 nav 의 변경을 유발한다.  

#### 4-1-2 개선 요소 

- `clikedIndex` 를 파악할 때, 클릭된 nav 요소의 인덱스를 파악하기 위해 `getClikedIndex()` 내부에서  `indexOf(e.target)` 을 쓰고 있는데, 클릭할 때 마다 n번의 탐색 비용이 발생한다. html 내부에 data 속성에 인덱스 정보를 추가해 그것으로 인덱스를 파악하는 방식으로 개선하자 

### 4-2 인터렉션의 주요 흐름을 설계로 표현하기

#### 4-2-1 역할들 

이벤트 &rarr; 상태변경 &rarr; 화면의 변화 

#### 4-2-2 역할 할당 (구체화)

![image-20190705160327308](assets/image-20190705160327308.png)

- 각 view 는 이벤트 등록과 화면 변경의 역할을 가진다.
- model은 상태를 변경한다. 
- **이벤트가 발생하면 view는 model에게 상태 변경을 요청한다(메시지를 보낸다)**
- **상태가 변경되면 model은 각 view에게 화면 변경을 요청한다(메시지를 보낸다)**
- **'객체간의 소통은 메세지를 통해 한다.' 라는 말이 이런거였구나 하는 무릎 탁 하는 순간!!** 

#### 4-2-3 *케러셀의 독특한 특징

![image-20190705162339907](assets/image-20190705162339907.png)

- 한쪽 view가 발생시킨 이벤트가 모델의 상태변경을 요청한다.
- 여기서 조금 특이한게 **해당 상태변경의 파급력이 존재하는 모든 view 에 화면변화를 유도**한다는 점이다. 
- 슬슬 패턴이 보이기 시작한다. 주변 동료들이 옵저버(observer) 패턴을 쓴다고 하는데 옵저버 패턴을 공부해보자. 

### 4-3 Observer Pattern

#### 4-3-1 [blog 학습](https://webdevstudios.com/2019/02/19/observable-pattern-in-javascript/) 

> The observer pattern is a software design pattern in which **an object, called the subject**, **maintains a list of its dependents, called observers, and notifies them automatically of any state changes, usually by calling one of their methods.**
>
> **The observer pattern defines a one-to-many relationship. When one object updates, it notifies many other objects that it has been updated.** 
>
> Here is a brief explanation for each:
>
> - **subject** – This is the object that will send out a notification to all of the ‘observers’ who want/need to know that the subject was updated. In our case, the subject will be the application state object.
> - **observers** – These are the objects that want to know when the subject has changed. In our case, these will be the page elements that need to update when the application state changes.

 **''옵저버 패턴은 일대다 관계를 정의한다. 상태를 관리하는 객체의 변경이 있을 경우 다른 모든 객체에 그 변경을 알려야 한다.**" 라는 내용은 바로 **4-2-3 에서 발견했던 독특한 특징**과  동일했다.  옵져버 패턴을 써야할 명분이 생겼다. 

 