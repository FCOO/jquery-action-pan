# jquery-action-pan
>


## Description
Create pan events on elements with threshold for how long to pan before action is fired

## Installation
### bower
`bower install https://github.com/FCOO/jquery-action-pan.git --save`

## Demo
http://FCOO.github.io/jquery-action-pan/demo/ 

## Usage
    $(selector).actionPan({
        direction: 'down',
        threshold: .35,
        action: function( $elem, options ){...}
    });
    //Will call action-function when the element is panned down 35% of it height


### options
| Id | Type | Default | Description |
| :--: | :--: | :-----: | --- |
| `direction` | `string` | `"down"` | `"down"`, `"up"`, `"left"`, or `"right"` |
| `enabled` | `boolean` | `true` | |
| `cssPrefix` | `string` | `"margin-"` | Prefix for the css-property used to move the element |
| `cssPostfix` | `number` | `""` (auto) | `"left"`, `"right"`, `"top"`, or `"bottom"`  |
| `cssFactor` | `number` | `0` (auto) | +1, -1  |
| `threshold` | `number` | `.5` | number <= 1 (`.3`), number (`200`), string (`"200px"`), or `function($element){ return number}`: delta-value for css-property where action is fired  |
| `max` | `number` | `1` | number <= 1 (`.3`), number (`200`), string (`"200px"`), or `function($element){ return number}`: max-value for css-property |
| `maxBeforeAction` | `boolean` | `true` | Animate to max-value before calling action
| `resetAfterAction` | `boolean` | `true` | Reset to start-value after action. NOTE: If `resetAfterAction: false `the element get disabled and can only be panned after `.actionPanEnable( direction )` is called |
| `classNamePan` | `string` | `""` | Class added to the element when it is panning |
| `classNameThreshold` | `string` | `""` | Class added to the element when it is panning AND value is above the threshold value |
| `onPan` | `function`| `null` | `function( $element, direction, delta, options, event )`: called when the element is panned |
| `action` | `function` | `null` | `function($elem, options)`: called when the pan ends above the threshold |
| `shadows` | jQuery-selection | `null` | jQuery-selection of element that gets same panning as the element<br>**NOTE**: Not working correct if element has dual-direction pan (up-down or left-right) and `options.resetAfterAction == false`  |

### Methods

    //Add action-pan
    $.fn.actionPan(options)

    //Enable action-pan
    $.fn.actionPanEnable(direction)
    
    //Disable action-pan
    $.fn.actionPanDisable(direction)
    
    //Switch enable/disable
    $.fn.actionPanToggle(direction, state) 
    
    //Force actionPan to pan in direction. If checkForPan==true the action isn't done if the element is panning. Usefull for on('click', function( event ){ theElement.actionPanForce( 'up', true); }) to prevent ghost click
    $.fn.actionPanForce(direction[, checkForPan]) 
    
    //Reset/move the element back to original position. Usefull if options.resetAfterAction == false$.fn.actionPanReset(direction[, checkForPan]) 


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/jquery-action-pan/LICENSE).

Copyright (c) 2017 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk
