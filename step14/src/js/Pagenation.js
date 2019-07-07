import Observer from './lib/Observer';

const Pagenation = class extends Observer {
  constructor({
    carousel,
    carouselMain,
    container,
    item,
    items,
    config = {
      duration: 200,
      easing: 'ease-out',
    },
  }) {
    super();
    this.carousel = document.querySelector(carousel);
    this.carouselMain = this.carousel.querySelector(carouselMain);
    this.container = this.carousel.querySelector(container);
    this.item = this.carousel.querySelector(item);
    this.items = this.carousel.querySelectorAll(items);
    this.itemWidth = this.item.offsetWidth;
    this.itemsLength = this.items.length;
    this.config = config;
  }

  init() {
    this.setCarouselSize();
    this.attachEvent();
    this.insertClone();
    this.publisher.setState({
      offest: -this.itemWidth,
      itemWidth: this.itemWidth,
    });
    this.moveWithoutAnimation(-this.itemWidth);
    this.carouselMain.style.opacity = 1;
  }

  setCarouselSize() {
    this.carouselMain.style.width = `${this.item.offsetWidth}px'`;
    this.carouselMain.style.height = `${this.item.offsetHeight}px`;
  }

  insertClone() {
    const firstItem = this.items[0];
    const lastItem = this.items[this.items.length - 1];

    this.container.insertBefore(
      lastItem.cloneNode(true),
      this.container.firstChild,
    );

    this.container.appendChild(firstItem.cloneNode(true));
  }

  reportEvent(e) {
    if (this.isTransitioning) return;
    const { direction } = e.target.closest('arrow').dataset;
    const { name } = this.constructor;
    this.publisher.setState({ direction });
    this.publisher.updateState(name);
  }

  attachEvent() {
    const arrow = this.carousel.querySelector('.arrow');
    arrow.addEventListener('click', e => this.reportEvent(e));
    this.container.addEventListener('transitionend', () => {
      this.transitionStatsToggle();
    });
  }

  isClone(currentItem) {
    return currentItem === 0 || currentItem === this.itemsLength + 1;
  }

  fakeMove(state) {
    const itemWidth = this.item.offsetWidth;
    let { offset, currentItem } = state;
    // setState
    if (currentItem === 0) {
      offset -= this.itemsLength * itemWidth;
      currentItem += this.itemsLength;
    } else {
      offset += this.itemsLength * itemWidth;
      currentItem -= this.itemsLength;
    }
    this.publisher.setState({ offset, currentItem });
    // pagenation
    setTimeout(() => this.moveWithoutAnimation(offset), this.config.duration);
  }

  moveMain(offset) {
    this.transitionStatsToggle();
    this.container.style.transition = `transform ${this.config.duration}ms ${
      this.config.easing
    }`;
    this.container.style.transform = `translate3D(${offset}px, 0, 0)`;
  }

  update(state) {
    const { offset, currentItem } = state;
    this.moveMain(offset);
    if (this.isClone(currentItem)) this.fakeMove({ offset, currentItem });
  }

  // pagenation
  moveWithoutAnimation(offset) {
    this.container.style.transition = 'none';
    this.container.style.transform = `translate3D(${offset}px, 0, 0)`;
  }
};

export default Pagenation;
