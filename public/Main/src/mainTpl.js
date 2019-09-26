import autoSuggestionTpl from '../../autoSuggestion/src/component/Input/InputViewTpl.js';
import carouselTpl from '../../carousel/src/component/carouselTpl.js';

export default data => `${autoSuggestionTpl(data)}${carouselTpl(data)}`;
