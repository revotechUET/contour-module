import angular from 'angular';
import "lodash";
import * as d3 from 'd3';
import components from '../../components';

console.log("components to load", components);

angular
    .module('myApp', components.angularComponents)
    .controller('rootController', function($scope) {
        const rootCtrl = this;
        this.headers = {},
        this.values = [],
        this.minValue = 0,
        this.maxValue = 1,
        this.colorScale = d3.scaleLinear().range(['red', 'blue']),
        this.step = 100,
        this.majorEvery = 5,
        this.fontSize = 2,
        this.showLabel = true,
        this.showGrid = true,
        this.gridMajor = 5,
        this.gridMinor = 4,
        this.gridNice = true,
        this.scale = 1,

        this.onDataChanged = function(changedData) {
            console.log('on data changed');
            console.log(changedData);
            rootCtrl.headers = _.clone(changedData.headers);
            rootCtrl.values = _.flatten(changedData.data);
            const domain = d3.extent(rootCtrl.values);
            // rootCtrl.colorScale.domain(domain);
            rootCtrl.minValue = domain[0];
            rootCtrl.maxValue = domain[1];
            $scope.$digest();
        },
        this.onColorScaleChanged = function(colorScale) {
            console.log("color scale changed");
            rootCtrl.colorScale = colorScale;
            $scope.$digest();
        }
        this.onScaleChanged = (_scl) => {
            rootCtrl.scale = _scl
            $scope.$digest();
        };

        this.onColorScaleChangedGet = () => this.onColorScaleChanged;
        this.minValueGet = () => this.minValue
        this.maxValueGet = () => this.maxValue
    });

export default components.angularComponents;


