import contourView from "./contour-view"
import contourFileImport from "./contour-file-import"
import colorScaleGenerator from "./color-scale-generator"
const vueComponents = [
    contourView,
    contourFileImport,
    colorScaleGenerator
];

import vueContainer from "./vue-container";
import ngContourView from "./contour-view/ng-component";
import ngContourFileImport from "./contour-file-import/ng-component";
import ngColorScaleGenerator from "./color-scale-generator/ng-component";
const angularComponents = [
    vueContainer, ngColorScaleGenerator, ngContourView, ngContourFileImport
];
export default {vueComponents, angularComponents};
