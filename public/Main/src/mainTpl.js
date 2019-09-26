import autoSuggestionTpl from '../../AutoSuggestion/src/component/Input/InputViewTpl.js';
import carouselTpl from '../../Carousel/src/component/carouselTpl.js';

export default data => `${autoSuggestionTpl(data)}${carouselTpl(data)}`;
